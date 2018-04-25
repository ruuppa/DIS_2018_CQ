var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
// var qrimage = require('qr-image')

// Express.JS settings
app.set('view engine', 'pug')
app.use(express.static('/'))

var config = require('./config')
require('./api/routes.js')(app, config)

app.use(function (error, req, res, next) {
  console.error(error.stack)
  res.status(400).send(error.message)
})
/*
// Create server
app.listen(config.settings.port, () => {
  console.log('Listening on ' + config.settings.port)
})
*/
//Socket.io works only when listening to server with server.listen, because of the http -requirement
server.listen(8000)

//A crude timer counting from 1 hour 1 min, listing hours/mins/secs
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

// Socket.io connection and returns from client.
io.on('connection', function (socket) {
/*
  socket.emit('news', { hello: 'world' });
  console.log("Derp from server");
  socket.on('my other event', function (data) {
    console.log(data);
	  console.log("Derp to server");
  });*/
});