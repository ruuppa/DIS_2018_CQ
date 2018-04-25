var config = {}

// App configuration
config.settings = {}
//config.settings.pathToImages = '/path/to/images/' // Fix this!
config.settings.pathToImages = '/School/School5/DIS/Project/DIS_2018_CQ-master/images/'
config.settings.port = process.env.WEB_PORT || 8000
config.settings.baseURL = 'http://localhost:' + config.settings.port

// Game specific
config.game = {}
config.game.inprogress = false
config.game.availTeams = ['blue', 'green', 'red', 'yellow', 'aquamarine', 'blueviolet', 'brown', 'gold']
config.game.maxTeamSize = 10

config.existingTeams = {}

module.exports = config
