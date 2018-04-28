module.exports = function (app, config) {
  var qrimage = require('qr-image')
// Root page, i.e. where it all begins
  app.get('/', function (req, res) {
	res.render('index', {new_team_qr_code: createQRLink(config.settings.baseURL + '/newteam', 200, 200),teams: config.existingTeams, keys_sorted: sortKeys(config.existingTeams)})
  })

  // Temporary URL for team creation that redirects to team home page
  app.get('/newteam', function (req, res) {
    var newTeam = config.game.availTeams.pop()
    config.existingTeams[newTeam] = 1

    res.redirect('/team/' + newTeam)
  })

  // New team home page for team leader and members
  app.get('/team/:team', function (req, res) {
	var currentRank = sortKeys(config.existingTeams).indexOf(req.params.team)+1
	
    var teamSize = config.existingTeams[req.params.team]
    var teamPage = 'Welcome to ' + req.params.team + ' team!'
    var teamColor = req.params.team
    var newTeamMemberLink = config.settings.baseURL + '/team/' + req.params.team + '/newmember'
	var teamQrCode = createQRLink(newTeamMemberLink, 200, 200)
    var teamInfo = 'Your team has ' + teamSize + ' ' + (teamSize === 1 ? 'member' : 'members')
    var subTeamInfo = 'You need ' + config.game.maxTeamSize + ' members in your team to win!'
    var gameStatus = 'Game ongoing, your rank is: '+currentRank
	
    if (teamSize >= config.game.maxTeamSize) {
      gameStatus = 'You made it!'
      config.game.inprogress = true
    } else if (config.game.inprogress) {
      teamColor = ''
      subTeamInfo = ''
      gameStatus = 'The game is over at this point. Please join on the next one.'
    }

    res.render('team_page', {team_page: teamPage, team_color: teamColor, new_team_member: newTeamMemberLink, team_qr_code: teamQrCode, team_info: teamInfo, game_status: gameStatus, sub_team_info: subTeamInfo, teams: config.existingTeams})
  })

  // Temporary URL for team members to join a team
  app.get('/team/:team/newmember', function (req, res) {
    config.existingTeams[req.params.team] += 1

    res.redirect('/team/' + req.params.team)
  })
  
  function createQRLink (link, width, height) {
  var svgStr = qrimage.imageSync(link, {type: 'svg'})
  var idx = svgStr.indexOf('path') - 2
  var fixedSvg = svgStr.substr(0, idx) + ' width="' + width + '" height="' + height + '"' + svgStr.substr(idx)

  return fixedSvg
  }
  //Sort the ranking of connections
  function sortKeys (teams) {
   var keysSorted = Object.keys(teams).sort(function(a,b){return teams[b]-teams[a]})
   return keysSorted
  }
}
