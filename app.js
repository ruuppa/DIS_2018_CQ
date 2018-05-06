var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var session = require('express-session')
var qrimage = require('qr-image')
const uuidv4 = require('uuid/v4')

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

// Set up a new player
app.get(config.settings.routes.startPage, function (req, res) {
    // Set up server side
    tools.generateConnectionInfo(config, req.session.uuid)

    // Send home page
    res.redirect(config.settings.routes.homePage)
})

// A player home page
app.get(config.settings.routes.homePage, function(req, res) {
    // Send actual file (HTML)
    res.sendFile(__dirname + '/pages/homepage.html')
})

app.get(config.settings.routes.joinPage + ':uuid', function(req, res) {
    console.log('Join')
    // Possibly existing player joins
    if(config.sessions.ids.includes(req.session.uuid)) {
        console.log('New for exisiting other player: ' + config.game.players[req.session.uuid].nick)
        config.game.players[req.session.uuid].connectionCount += 1
    }
    // A non-player joins
    else if(typeof req.session.uuid == 'undefined') {
        console.log('New non-player')
        req.session.uuid = tools.newEntry(config, uuidv4)
    }
    // Add joined link holder count
    if(config.sessions.ids.includes(req.params.uuid)) {
        console.log('New for existing player: ' + config.game.players[req.params.uuid].nick)
        config.game.players[req.params.uuid].connectionCount += 1
    }
    else {
        console.log('New for non-existing player')
        return;
    }

    io.emit('participants', participantStats())
    res.render('player_join', {join_msg: 'A new contact joins ' + config.game.players[req.params.uuid].nick})
})

//Timer for app.js or equivalent (app.js or equivalent)
var countdown = 3660;
setInterval(function() {  
  countdown--;
  var days        = Math.floor(countdown/24/60/60);
  var hoursLeft   = Math.floor((countdown) - (days*86400));
  var hours       = Math.floor(hoursLeft/3600);
  var minutesLeft = Math.floor((hoursLeft) - (hours*3600));
  var minutes     = Math.floor(minutesLeft/60);
  var secondsLeft = countdown % 60;
  if(hours < 10){hours = "0"+hours}
  if(minutes < 10){minutes = "0"+minutes}
  if(secondsLeft < 10){ secondsLeft = "0"+secondsLeft}
  displaycountdown = "H: "+hours+" M: "+minutes+" S: "+secondsLeft
  io.emit('timer', { countdown: displaycountdown });		//This sends the timer from server to clients
}, 1000);

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
        socket.emit('nick', config.game.players[socket.request.session.uuid].nick)
        socket.emit('nickcount', config.game.players[socket.request.session.uuid].connectionCount)
        var nlink = config.settings.baseURL + config.settings.routes.joinPage + socket.request.session.uuid
        socket.emit('nqr', extractData(createQRLink(nlink, 200, 200)))
        socket.emit('nqrlink', nlink)
        participantNicks = participantStats()
        console.log('Current: ' + participantNicks)
        io.emit('participants', participantNicks)
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

function extractData(svgdata) {
    var searchStr = 'path d='
    var startIdx = svgdata.indexOf(searchStr) + searchStr.length + 1
    var endIdx = svgdata.lastIndexOf('svg') - 5

    return svgdata.substring(startIdx, endIdx)
}

function participantStats() {
    var keys = Object.keys(config.game.players)

    participantNicks = []
    keys.forEach(function(idx) {
        // console.log(idx)
        participantNicks.push(config.game.players[idx].nick + '|' + config.game.players[idx].connectionCount)
        // console.log(config.game.players[idx].nick)
    })

    return participantNicks
}
