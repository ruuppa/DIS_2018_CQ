constSock = {
    EL_HEADING: '.heading',
    EL_PLAYEROWN: '.playerown',
    EL_NICK_COUNT: '.nickcount',
    EL_NICK: '.nick',
    EL_QR_CODE: '.qrcode',
    EL_QR_PLACE: '.qrplace'
}

// Socket.IO
var socket = io();

socket.on('connect', () => {
    // Upon opening a connection request own nick
    socket.emit('mynick');
})
socket.on('nick', function(data) {
    // Show own nick name
    var nick = document.querySelector(constSock.EL_PLAYEROWN).querySelector(constSock.EL_NICK);
    nick.textContent = data;
})
socket.on('nickcount', function(data) {
    // Show own connection count
    var nickCount = document.querySelector(constSock.EL_PLAYEROWN).querySelector(constSock.EL_NICK_COUNT);
    nickCount.textContent = 'Connections: ' + data;
})
socket.on('nqr', function(data) {
    // Show QR code
    // console.log(data);
    var qrcode = document.querySelector(constSock.EL_PLAYEROWN).querySelector(constSock.EL_QR_CODE);
    var newElem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    newElem.setAttribute('d', data);
    qrcode.appendChild(newElem);
})
socket.on('nqrlink', function(data) {
    // Show QR code link
    console.log(data);
    var qrparent = document.querySelector(constSock.EL_PLAYEROWN).querySelector(constSock.EL_QR_PLACE);
    var newLink = document.createElement("a");
    newLink.setAttribute('href', data);
    var qrcode = document.querySelector(constSock.EL_QR_CODE);
    newLink.appendChild(qrcode);
    qrparent.appendChild(newLink);
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
    var ticker = document.querySelector(constSock.EL_HEADING);
    ticker.textContent = data;
})
