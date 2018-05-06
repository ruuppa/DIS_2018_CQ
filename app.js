var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var session = require('express-session')
var qrimage = require('qr-image')
const uuidv4 = require('uuid/v4')
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

// Server static files to client
app.use('/pages', express.static(__dirname + '/pages', {index: false}))
app.use('/js', express.static(__dirname + '/js', {index: false}))
app.use('/styles', express.static(__dirname + '/styles', {index: false}))

// Root page, i.e. where it all begins
app.get('/', function (req, res) {
    console.log('New: ' + req.session.uuid)
    // Create session for new client
    if(typeof req.session.uuid == 'undefined') {
        req.session.uuid = tools.newEntry(config, uuidv4)
        console.log('ID: ' + req.session.uuid)
    }
    res.render('index', {new_team_page: config.settings.baseURL + config.settings.routes.startPage, new_team_qr_code: createQRLink(config.settings.baseURL + config.settings.routes.startPage, 200, 200)})
})

// Status page
app.get(config.settings.routes.statusPage, function(req, res) {
    res.sendFile(__dirname + '/pages/statuspage.html')
})

// Set up a new player
app.get(config.settings.routes.startPage, function (req, res) {
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

    // Send actual file (HTML)
    res.sendFile(__dirname + '/pages/homepage.html')
})

app.get(config.settings.routes.joinPage + ':uuid', function(req, res) {
    console.log('Join')
    console.log('Sessions: ' + config.sessions.ids)
    console.log('Session id: ' + req.session.uuid)

    // Existing player joins another one
    if(config.sessions.ids.includes(req.session.uuid) &&
      (config.game.players.hasOwnProperty(req.session.uuid))) {
        // Check that connection has not yet been made
        if(!config.game.players[req.session.uuid].connections.includes(req.params.uuid)) {
            console.log('New for exisiting other player: ' + config.game.players[req.session.uuid].nick)
            config.game.players[req.session.uuid].connections.push(req.params.uuid)
            config.game.players[req.params.uuid].connections.push(req.session.uuid)
            config.game.players[req.params.uuid].socket.emit('nickcount', config.game.players[req.params.uuid].connections.length)
            config.game.players[req.session.uuid].socket.emit('nickcount', config.game.players[req.session.uuid].connections.length)
        }
        else {
            console.log('A double attempt (existing)')
            res.render('double')
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
            config.game.players[req.params.uuid].socket.emit('nickcount', config.game.players[req.params.uuid].connections.length)
        }
        else if(config.game.players.hasOwnProperty(req.session.uuid) == false) {
            console.log('A double attempt (non-player)')
            res.render('double')
            return
        }
    }
    else {
        // Someone found a link for game that is already over
        console.log('New for non-existing player')
        res.render('dead_link')
        return
    }

    // Update participant statistics on players home pages
    io.emit('participants', participantStats())
    res.render('player_join', {join_msg: 'A new contact joins ' + config.game.players[req.params.uuid].nick})
})

app.get(config.settings.routes.timerStart, function(req, res) {
    createTimer(gameDuration)
    startTimer(countdown)
    res.send('Start')
})

app.get(config.settings.routes.timerStop, function(req, res) {
    stopTimer()
    res.send('Stop')
})

app.get(config.settings.routes.timerReset, function(req, res) {
    restartTimer()
    res.send('Restart')
})

// Socket.IO
io.on('connection', function(socket) {
    console.log('Sock conn: ' + socket.request.session.uuid)
    // If no session UUID exists redirect to start page
    if(typeof socket.request.session.uuid == 'undefined') {
        io.emit('redirect', '/')
        return;
    }

    // Respond to client request on his own nick
    socket.on('mynick', function(data) {
        // Send playr information
        console.log('Player info')
        config.game.players[socket.request.session.uuid].socket = socket
        socket.emit('nick', config.game.players[socket.request.session.uuid].nick)
        socket.emit('nickcount', config.game.players[socket.request.session.uuid].connections.length)
        var nlink = config.settings.baseURL + config.settings.routes.joinPage + socket.request.session.uuid
        socket.emit('nqr', extractPathFromQRLink(createQRLink(nlink, 200, 200)))
        socket.emit('nqrlink', nlink)

        // Gather list of all participants and broadcast them to all
        participantNicks = participantStats()
        console.log('Participants: ' + participantNicks)
        io.emit('participants', participantNicks)
    })

    socket.on('statuspage', function(data) {
        console.log('Status page')
        var statusNote = 'OFF'
        var parts = participantStats()
        if(isTimer() == true && isTimerRunning() == true) {
            statusNote = 'RUNNING'
        }
        if(parts.length > 0) {
            io.emit('participants', parts)
        }
        socket.emit('gamestatus', statusNote)
    })
})

// Start server
server.listen(config.settings.port)

// Extras
function createQRLink (link, width, height) {
    var svgStr = qrimage.imageSync(link, {type: 'svg'})
    var idx = svgStr.indexOf('path') - 2
    var fixedSvg = svgStr.substr(0, idx) + ' width="' + width + '" height="' + height + '"' + svgStr.substr(idx)

    return fixedSvg
}

function extractPathFromQRLink(svgdata) {
    var searchStr = 'path d='
    // Find above string starting point, add its length plus one for quotation mark
    var startIdx = svgdata.indexOf(searchStr) + searchStr.length + 1
    // Find noted string and subtract until inside of path last quotation mark
    var endIdx = svgdata.lastIndexOf('svg') - 5

    return svgdata.substring(startIdx, endIdx)
}

function participantStats() {
    var keys = Object.keys(config.game.players)

    participantNicks = []
    keys.forEach(function(idx) {
        // console.log(idx)
        participantNicks.push(config.game.players[idx].nick + '|' + config.game.players[idx].connections.length)
        // console.log(config.game.players[idx].nick)
    })

    return participantNicks
}

function countdown() {
    if(config.game.timer.present == 0) {
        stopTimer()
        io.emit('gamestatus', 'OFF')
        io.emit('tick', 'Game over')
        io.emit('redirect', config.settings.routes.statusPage)
        return
    }
    config.game.timer.present--
    var hours = Math.floor(config.game.timer.present / 3600)
    var minutes = Math.floor((config.game.timer.present - hours * 3600) / 60)
    var seconds = Math.floor((config.game.timer.present - hours * 3600 - minutes * 60))

    var timerStr = hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds)

    io.emit('tick', timerStr)
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

function restartTimer(duration) {
    if(config.game.timer.timerObj == null) return
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
