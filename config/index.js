var config = {}

// App configuration
config.settings = {}
config.settings.port = process.env.WEB_PORT || 8000
config.settings.baseURL = 'http://localhost:' + config.settings.port
config.settings.sessionSettings = {
    secret: 'demo.skene.only',
    resave: false,
    saveUninitialized: false
}
config.settings.routes = {
    startPage: '/newtem',
    homePage: '/homepage',
    joinPage: '/join/',
    statusPage: '/statuspage',
    timerStart: '/_starttimer',
    timerStop: '/_stoptimer',
    timerReset: '/_resettimer'
}
// Session related
config.sessions = {}
config.sessions.ids = []

// Runtime
config.runtime = {}
config.runtime.usedAdjectives = []
config.runtime.usedAnimals = []

// Game specific
config.game = {}
config.game.timer = {}
config.game.players = {}

module.exports = config
