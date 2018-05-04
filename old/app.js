var express = require('express')
var app = express()
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

// Create server
app.listen(config.settings.port, () => {
  console.log('Listening on ' + config.settings.port)
})
