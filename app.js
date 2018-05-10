var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var session = require('express-session')
var qrimage = require('qr-image')
const uuidv4 = require('uuid/v4')

// Game duration in seconds
const gameDuration = 20 * 60

var config = require('./config')
var tools = require('./tools')

// Initialize
// Setup socket.IO to provide access to session variables as described
// https://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x
var sessionMiddleware = session(config.settings.sessionSettings)
io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next)
})
app.use(sessionMiddleware)

// Setup view engine
app.set('view engine', 'pug')

// Serve static files to client
app.use('/pages', express.static(__dirname + '/pages', {index: false}))
app.use('/js', express.static(__dirname + '/js', {index: false}))
app.use('/styles', express.static(__dirname + '/styles', {index: false}))

// Root page, i.e. where it all begins
app.get('/', function (req, res) {
    console.log('New (root): ' + req.session.uuid)
    checkSession(req)

    res.render('index', {new_team_page: config.settings.baseURL + config.settings.routes.startPage, new_team_qr_code: createQRLink(config.settings.baseURL + config.settings.routes.startPage, 200, 200)})
})

// Status page
app.get(config.settings.routes.statusPage, function(req, res) {
    res.sendFile(__dirname + '/pages/statuspage.html')
})

// Set up a new player
app.get(config.settings.routes.startPage, function (req, res) {
    console.log('New: ' + req.session.uuid)
    checkSession(req)

    // Set up server side
    tools.generateConnectionInfo(config, req.session.uuid)

    // Send home page
    res.redirect(config.settings.routes.homePage)
})

// A player home page
app.get(config.settings.routes.homePage, function(req, res) {
    // Create timer
    if(isTimer() == false) {
        createTimer(gameDuration)
    }
    if(isTimerRunning() == false) {
        startTimer(countdown)
    }
    config.sessions.ingame.push(req.session.uuid)

    // Send actual file (HTML)
    res.sendFile(__dirname + '/pages/homepage.html')
})

// Game ending
app.get(config.settings.routes.endingPage, function(req, res) {
    // Remove from ingame
    removeIngame(req.session.uuid)

    res.redirect(config.settings.routes.statusPage)
})

app.get(config.settings.routes.holdPage, function(req, res) {
    res.render('holding')
})

app.get(config.settings.routes.restartPage, function(req, res) {
    if(isTimerRunning() == true || config.sessions.ingame.length > 0) {
        infoScreen(res, 'Game ongoing', 'Restarting is not possible while the game is ongoing.')
        return
    }
    restartGame()
    res.send('Wilco!')
})

app.get(config.settings.routes.joinPage + ':uuid', function(req, res) {
    console.log('Join')
    console.log('Sessions: ' + config.sessions.ids)
    console.log('Session id: ' + req.session.uuid)

    if(req.session.uuid == req.params.uuid) {
        console.log('Self join')
        infoScreen(res, config.constants.selfJoinTitle, config.constants.selfJoinMessage)
        return
    }

    // Existing player joins another one
    if(config.sessions.ids.includes(req.session.uuid) &&
      (config.game.players.hasOwnProperty(req.session.uuid))) {
        // Check that connection has not yet been made
        if(!config.game.players[req.session.uuid].connections.includes(req.params.uuid)) {
            console.log('New for exisiting other player: ' + config.game.players[req.session.uuid].nick)
            config.game.players[req.session.uuid].connections.push(req.params.uuid)
            config.game.players[req.params.uuid].connections.push(req.session.uuid)
            config.game.players[req.params.uuid].socket.emit(config.emitmsg.nickCount, config.game.players[req.params.uuid].connections.length)
            config.game.players[req.session.uuid].socket.emit(config.emitmsg.nickCount, config.game.players[req.session.uuid].connections.length)
        }
        else {
            console.log('A double attempt (existing)')
            infoScreen(res, config.constants.contactRejoiningTitle, config.constants.contactRejoiningMessage)
            return
        }
    }
    // A non-player joins to someone
    else if(typeof req.session.uuid == 'undefined') {
        console.log('New non-player')
        req.session.uuid = tools.newEntry(config, uuidv4)
    }
    // Add joined link holder count
    if(config.sessions.ids.includes(req.params.uuid)) {
        // Check that connection has not yet been made
        if(config.game.players[req.params.uuid].connections.includes(req.session.uuid) == false) {
            console.log('New for existing player: ' + config.game.players[req.params.uuid].nick)
            config.game.players[req.params.uuid].connections.push(req.session.uuid)
            config.game.players[req.params.uuid].socket.emit(config.emitmsg.nickCount, config.game.players[req.params.uuid].connections.length)
        }
        else if(config.game.players.hasOwnProperty(req.session.uuid) == false) {
            console.log('A double attempt (non-player)')
            infoScreen(res, config.constants.config.constants.nonplayerRejoiningTitle, config.constants.config.constants.nonplayerRejoiningMessage)
            return
        }
    }
    else {
        // Someone found a link for game that is already over
        console.log('New for non-existing player')
        infoScreen(res, config.constants.deadLinkTitle, config.constants.deaLinkMessage)
        return
    }

    // Update participant statistics on players home pages
    io.emit(config.emitmsg.participants, participantStats())

    // Res object, title and message
    infoScreen(res, config.constants.newPlayerTitle, config.constants.newPlayerMessage + config.game.players[req.params.uuid].nick)
})

// Socket.IO
io.on('connection', function(socket) {
    console.log('Sock conn: ' + socket.request.session.uuid)
    // If no session UUID exists redirect to start page
    if(typeof socket.request.session.uuid == 'undefined') {
        io.emit(config.emitmsg.redirect, '/')
        return;
    }

    checkReconnect(socket.request.session.uuid)

    // Respond to client request on his own nick
    socket.on(config.emitmsg.ownNick, function(data) {
        // Send playr information
        console.log('Player info')
        config.game.players[socket.request.session.uuid].socket = socket
        socket.emit(config.emitmsg.nick, config.game.players[socket.request.session.uuid].nick)
        socket.emit(config.emitmsg.nickCount, config.game.players[socket.request.session.uuid].connections.length)
        var nlink = config.settings.baseURL + config.settings.routes.joinPage + socket.request.session.uuid
        socket.emit(config.emitmsg.nickQRCode, extractPathFromQRLink(createQRLink(nlink, 200, 200)))
        socket.emit(config.emitmsg.nickQRLink, nlink)

        // Gather list of all participants and broadcast them to all
        participantNicks = participantStats()
        console.log('Participants: ' + participantNicks)
        io.emit(config.emitmsg.participants, participantNicks)
    })

    socket.on(config.emitmsg.statusPage, function(data) {
        console.log('Status page')
        var statusNote = 'OFF'
        var parts = participantStats()
        if(isTimer() == true && isTimerRunning() == true) {
            statusNote = 'RUNNING'
        }
        else if(isTimer() == true && isTimerRunning() == false) {
            statusNote = "Game over!"
        }
        if(parts.length > 0) {
            io.emit(config.emitmsg.participants, parts)
        }
        socket.emit(config.emitmsg.gameStatus, statusNote)
    })

    socket.on(config.emitmsg.disconnect, function(reason) {
        // Collected disconnected inmage players
        if(config.sessions.ingame.includes(socket.request.session.uuid)) {
            console.log('Disconnect noted: ' + socket.request.session.uuid)
            config.sessions.disconnected[socket.request.session.uuid] = {}
            config.sessions.disconnected[socket.request.session.uuid].remaining = 15

            // Start maintenance timer
            if(typeof config.sessions.connectionTimer == 'undefined') {
                config.sessions.connectionTimer = setInterval(connectionMaintenance, 1000)
            }
        }
    })
})

// Start server
server.listen(config.settings.port)

// Extras
function restartGame() {
    // Redirect all players to holding page
    io.emit(config.emitmsg.redirect, config.settings.routes.holdPage)

    // After short break restart the game
    setTimeout(function() {
        config.sessions.disconnected = {}
        config.sessions.ingame = []
        resetTimer()
    }, 2000)
}

function infoScreen(res, title, message) {
    // Create info screen that redirects to status page
    var redirStr = '5; ' + config.settings.baseURL + config.settings.routes.statusPage
    res.render('info_screen', {redir_page: redirStr, title_msg: title, info_msg: message})
}

function createQRLink (link, width, height) {
    // Create QR-link to given location
    var svgStr = qrimage.imageSync(link, {type: 'svg'})
    var idx = svgStr.indexOf('path') - 2
    var fixedSvg = svgStr.substr(0, idx) + ' width="' + width + '" height="' + height + '"' + svgStr.substr(idx)

    return fixedSvg
}

function extractPathFromQRLink(svgdata) {
    // Extract SVG path from QR-link
    var searchStr = 'path d='
    // Find above string starting point, add its length plus one for quotation mark
    var startIdx = svgdata.indexOf(searchStr) + searchStr.length + 1
    // Find noted string and subtract until inside of path last quotation mark
    var endIdx = svgdata.lastIndexOf('svg') - 5

    return svgdata.substring(startIdx, endIdx)
}

function participantStats() {
    // Provide participant status information
    var keys = Object.keys(config.game.players)
    var partiMap = {}
    var participantNicks = []

    // Collect participants into mapped list based on their connection count
    keys.forEach(function(idx) {
        // console.log(idx)
        var scr = config.game.players[idx].connections.length
        if(!(partiMap.hasOwnProperty(scr))) {
            partiMap[scr] = []
        }
        partiMap[scr].push(config.game.players[idx].nick)
    })

    // Sort map based on keys, i.e. connection count, to get score status
    keys = Object.keys(partiMap)
    keys.sort()
    keys.reverse()
    // and put them into list
    keys.forEach(function(idx) {
        for(var i=0; i<partiMap[idx].length; i++) {
            participantNicks.push(partiMap[idx][i] + '|' + idx)
        }
    })
    console.log(participantNicks)

    return participantNicks
}

function checkSession(req) {
    // Create that session exists for new client
    if(typeof req.session.uuid == 'undefined') {
        req.session.uuid = tools.newEntry(config, uuidv4)
        console.log('ID: ' + req.session.uuid)
    }
}

function removeIngame(uuid) {
    // Remove UUID from ingame status
    if(config.sessions.ingame.includes(uuid)) {
        console.log('Remove ingame: ' + uuid)
        var idx = config.sessions.ingame.indexOf(uuid)
        config.sessions.ingame.splice(idx, 1)
    }
}

function countdown() {
    // If time's up then game is over
    if(config.game.timer.present == 0) {
        stopTimer()
        io.emit(config.emitmsg.gameStatus, 'OFF')
        io.emit(config.emitmsg.redirect, config.settings.routes.endingPage)
        return
    }
    // Otherwise update clock and send it to clients
    config.game.timer.present--
    var hours = Math.floor(config.game.timer.present / 3600)
    var minutes = Math.floor((config.game.timer.present - hours * 3600) / 60)
    var seconds = Math.floor((config.game.timer.present - hours * 3600 - minutes * 60))

    var timerStr = hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds)

    io.emit(config.emitmsg.tick, timerStr)
}

function createTimer(duration) {
    config.game.timer.duration = duration
    config.game.timer.present = duration
    config.game.timer.tick = 1000
    console.log('Timer created')
}

function isTimer() {
    if(typeof callback == 'undefined' && typeof config.game.timer.callback == 'undefined') {
        console.log('isTimer: no')
        return false
    }
    console.log('isTimer: yes')
    return true
}

function isTimerRunning() {
    var stat = (config.game.timer.duration == config.game.timer.present) || (config.game.timer.present == 0)
    console.log('Timer running: ' + (stat ? 'no' : 'yes'))
    return (stat ? false : true)
}

function resetTimer() {
    console.log('Timer reset')
    config.game.timer.present = config.game.timer.duration
}

function restartTimer(duration) {
    if(!isTimer()) return
    stopTimer()
    startTimer()
    console.log('Timer restarted')
}

function startTimer(callback) {
    if(typeof config.game.timer.callback == 'undefined') {
        config.game.timer.callback = callback
    }
    config.game.timer.timerObj = setInterval(config.game.timer.callback, config.game.timer.tick)

    console.log('Timer started')
}

function stopTimer() {
    if(typeof config.game.timer.timerObj == 'undefined' || config.game.timer.timerObj == null) return

    clearInterval(config.game.timer.timerObj)
    config.game.timer.timerObj = null

    console.log('Timer stopped')
}

function connectionMaintenance() {
    // If no disconnected clients, no in-game clients or timer has stopped
    if(Object.keys(config.sessions.disconnected).length == 0 ||
    config.sessions.ingame.length == 0 || isTimerRunning() == false) {
        // If no clients in queue stop timer
        console.log('Game has ended')
        clearInterval(config.sessions.connectionTimer)
        config.sessions.connectionTimer = undefined
        return
    }

    // Maintain timer and remove disconnected clients from in game
    var keys = Object.keys(config.sessions.disconnected)
    var toRemove = []
    console.log('Maintain timers')
    keys.forEach(function(idx) {
        if(config.sessions.disconnected[idx].remaining > 0) {
            config.sessions.disconnected[idx].remaining--;
        }
        else {
            toRemove.push(idx)
        }
    })

    if(toRemove.length > 0) {
        do {
            var ditem = toRemove.pop()
            if(config.sessions.ingame.includes(ditem)) {
                console.log('Disconnected: ' + ditem)
                removeIngame(ditem)
                // var idx = config.sessions.ingame.indexOf(ditem)
                // config.sessions.ingame.splice(idx, 1)
            }
        } while(toRemove.length > 0)
    }
}

function checkReconnect(uuid) {
    // If no disconnected clients
    if(Object.keys(config.sessions.disconnected).length == 0) return

    var keys = Object.keys(config.sessions.disconnected)
    // Remove client from disconnected queue on reconnect
    if(keys.includes(uuid)) {
        console.log('Reconnected: ' + uuid)
        delete config.sessions.disconnected[uuid]
    }
}
