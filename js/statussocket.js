constStatus = {
    EL_HEADING: '.heading',
    STATUS_OFF: 'OFF',
    STATUS_RUNNING: 'RUNNING'
}
    // Socket.IO
var socket = io();

socket.on('connect', () => {
    // Upon opening a connection request own nick
    socket.emit('statuspage');
})
socket.on('gamestatus', function(data) {
    if(data === constStatus.STATUS_OFF) {
        var ticker = document.querySelector(constStatus.EL_HEADING);
        ticker.textContent = 'No game ongoing!';
    }
    console.log(data);
})
socket.on('participants', function(data) {
    addParticipants(data);
    sortStatuses();
})
socket.on('redirect', function(destination) {
    // Server wants to send client to new place
    window.location.href = destination;
})
socket.on('tick', function(data) {
    var ticker = document.querySelector(constStatus.EL_HEADING);
    ticker.textContent = data;
})
