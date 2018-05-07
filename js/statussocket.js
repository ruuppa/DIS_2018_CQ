constStatus = {
    EL_HEADING: '.heading',
    STATUS_OFF: 'OFF',
    STATUS_RUNNING: 'RUNNING',
    STATUS_GAME_OVER: 'Game over!'
}
    // Socket.IO
var socket = io();

socket.on('connect', () => {
    // Upon opening a connection request own nick
    socket.emit('statuspage');
})
socket.on('gamestatus', function(data) {
    // Show game status
    var ticker = document.querySelector(constStatus.EL_HEADING);
    if(data === constStatus.STATUS_OFF) {
        ticker.textContent = 'No game ongoing!';
    }
    else if(data === constStatus.STATUS_GAME_OVER) {
        ticker.textContent = data;
    }
    else {
        ticker.textContent = '-';
    }
    console.log(data);
})
socket.on('participants', function(data) {
    // Show participant status list
    addParticipants(data);
})
socket.on('redirect', function(destination) {
    // Server wants to send client to new place
    window.location.href = destination;
})
socket.on('tick', function(data) {
    // Update timer
    var ticker = document.querySelector(constStatus.EL_HEADING);
    ticker.textContent = data;
})
