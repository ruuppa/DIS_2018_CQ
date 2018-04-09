var express = require('express')
var app = express()
// var qrimage = require('qr-image')

// Server port
const port = 8000
// Image files location
var pathToImages = '/School/School5/DIS/Project/DIS_2018_CQ-master/dqdemo/images/' // Correct this!
// Application base URL address
var baseURL = 'http://localhost:8000'

// Available teams
var availTeams = ['blue', 'green', 'red', 'yellow', 'aquamarine', 'blueviolet', 'brown', 'gold']
// Created teams and their member count
var existingTeams = {}

var finished = false

// Express.JS settings
app.set('view engine', 'pug')
app.use(express.static('/'))

// Root page, i.e. where it all begins
app.get('/', function (req, res) {
  res.render('index', {new_team_qr_code: pathToImages + 'qr-helsinki-fi.svg'})
})

// Temporary URL for team creation that redirects to team home page
app.get('/newteam', function (req, res) {
  var newTeam = availTeams.pop()
  existingTeams[newTeam] = 1

  res.redirect('/team/' + newTeam)
})

// New team home page for team leader and members
app.get('/team/:team', function (req, res) {
  var teamSize = existingTeams[req.params.team]
  var teamPage = 'Welcome to ' + req.params.team + ' team!'
  var teamColor = req.params.team
  var newTeamMemberLink = baseURL + '/team/' + req.params.team + '/newmember'
  var teamQrCode = pathToImages + 'qr-helsinki-fi.svg'
  var teamInfo = 'Your team has ' + teamSize + ' ' + (teamSize === 1 ? 'member' : 'members') + ', collect 10 to win!'
	if (teamSize >= 10) {
		var gameStatus = "Finished. You win!";
		finished = true
	} else if (finished){
		var gameStatus = "Finished. You did not win, better luck next time!";
	} else {
		var gameStatus = "Game ongoing.";
	}

  res.render('team_page', {team_page: teamPage, team_color: teamColor, new_team_member: newTeamMemberLink, team_qr_code: teamQrCode, team_info: teamInfo, game_status : gameStatus})
})

// Temporary URL for team members to join a team
app.get('/team/:team/newmember', function (req, res) {
  existingTeams[req.params.team] += 1

  res.redirect('/team/' + req.params.team)
})

// Create server
app.listen(port, () => {
  console.log('Listening on ' + port)
})
