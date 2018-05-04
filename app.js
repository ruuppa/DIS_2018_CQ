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
    console.log('Ping: ' + req.session.uuid)
    // Create session for new client
    if(typeof req.session.uuid == 'undefined') {
        req.session.uuid = tools.newEntry(config, uuidv4)
        console.log('Pong: ' + req.session.uuid)
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

// Socket.IO
io.on('connection', function(socket) {
    console.log(socket.request.session.uuid)
    // If no session UUID exists redirect to start page
    if(typeof socket.request.session.uuid == 'undefined') {
        io.emit('redirect', '/')
    }

    // Respond to client request on his own nick
    socket.on('mynick', function(data) {
        io.emit('nick', config.game.players[socket.request.session.uuid].nick)
        var keys = Object.keys(config.game.players)
        console.log(keys)
        participantNicks = []
        keys.forEach(function(idx) {
            console.log(idx)
            participantNicks.push(config.game.players[idx].nick)
            console.log(config.game.players[idx].nick)
        })
        console.log(participantNicks)
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
