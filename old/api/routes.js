module.exports = function (app, config) {
// Root page, i.e. where it all begins
  app.get('/', function (req, res) {
    res.render('index', {new_team_qr_code: config.settings.pathToImages + 'qr-helsinki-fi.svg'})
  })

  // Temporary URL for team creation that redirects to team home page
  app.get('/newteam', function (req, res) {
    var newTeam = config.game.availTeams.pop()
    config.existingTeams[newTeam] = 1

    res.redirect('/team/' + newTeam)
  })

  // New team home page for team leader and members
  app.get('/team/:team', function (req, res) {
    var teamSize = config.existingTeams[req.params.team]
    var teamPage = 'Welcome to ' + req.params.team + ' team!'
    var teamColor = req.params.team
    var newTeamMemberLink = config.settings.baseURL + '/team/' + req.params.team + '/newmember'
    var teamQrCode = config.settings.pathToImages + 'qr-helsinki-fi.svg'
    var teamInfo = 'Your team has ' + teamSize + ' ' + (teamSize === 1 ? 'member' : 'members')
    var subTeamInfo = 'You need ' + config.game.maxTeamSize + ' members in your team to win!'
    var gameStatus = 'Game ongoing'
    if (teamSize >= config.game.maxTeamSize) {
      gameStatus = 'You made it!'
      config.game.inprogress = true
    } else if (config.game.inprogress) {
      teamColor = ''
      subTeamInfo = ''
      gameStatus = 'The game is over at this point. Please join on the next one.'
    }

    res.render('team_page', {team_page: teamPage, team_color: teamColor, new_team_member: newTeamMemberLink, team_qr_code: teamQrCode, team_info: teamInfo, game_status: gameStatus, sub_team_info: subTeamInfo})
  })

  // Temporary URL for team members to join a team
  app.get('/team/:team/newmember', function (req, res) {
    config.existingTeams[req.params.team] += 1

    res.redirect('/team/' + req.params.team)
  })
}
