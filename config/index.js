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
    startPage: '/newteam',
    homePage: '/homepage',
    joinPage: '/join/',
    endingPage: '/ending',
    statusPage: '/statuspage',
    holdPage: '/hold',
    restartPage: '/_restart'
}
// Session related
config.sessions = {}
config.sessions.ids = []
config.sessions.ingame = []
config.sessions.disconnected = {}

// Socket messages
config.emitmsg = {}
config.emitmsg.ownNick = 'mynick'
config.emitmsg.nick = 'nick'
config.emitmsg.nickCount = 'nickcount'
config.emitmsg.nickQRCode = 'nqr'
config.emitmsg.nickQRLink = 'nqrlink'
config.emitmsg.participants = 'participants'
config.emitmsg.statusPage = 'statuspage'
config.emitmsg.gameStatus = 'gamestatus'
config.emitmsg.disconnect = 'disconnect'
config.emitmsg.redirect = 'redirect'
config.emitmsg.tick = 'tick'

// Runtime
config.runtime = {}
config.runtime.usedAdjectives = []
config.runtime.usedAnimals = []

// Game specific
config.game = {}
config.game.timer = {}
config.game.players = {}

// Messages
config.constants = {}
config.constants.selfJoinTitle = 'No self joins'
config.constants.selfJoinMessage = 'Purpose is to connect with others, not self.'
config.constants.contactRejoiningTitle = 'Already contact with this player'
config.constants.contactRejoiningMessage = 'It would appear that you have already connected with given contact. Try to connect with someone else.'
config.constants.nonplayerRejoiningTitle = 'Already participated with this player'
config.constants.nonplayerRejoiningMessage = 'It would appear that you have already connected with given contact. Try to connect with someone else.'
config.constants.deadLinkTitle = 'Dead link'
config.constants.deadLinkMessage = 'It would appear that you have used a dead link. Please check that game is still on and link is correct.'
config.constants.newPlayerTitle = 'A new contact'
config.constants.newPlayerMessage = 'A new contact joins '

module.exports = config
