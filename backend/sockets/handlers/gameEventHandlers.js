const newGameHandler = require('./newGameHandler');
const joinGameHandler = require('./joinGameHandler');
const rejoinGameHandler = require('./rejoinGameHandler');
const leaveGameHandler = require('./leaveGameHandler');
const removeUserHandler = require('./removeUserHandler');

const startGameHandler = require('./startGameHandler');
const finishGameHandler = require('./finishGameHandler');

const gameEventHandlers = (io, socket, activeGames) => {
    // Connections
    socket.on('newGame', newGameHandler(io, socket, activeGames));
    socket.on('joinGame', joinGameHandler(io, socket, activeGames));
    socket.on('rejoinGame', rejoinGameHandler(io, socket, activeGames));
    socket.on('leaveGame', leaveGameHandler(io, socket, activeGames));
    socket.on('removeUser', removeUserHandler(io, socket, activeGames));

    //Game Events
    socket.on('startGame', startGameHandler(io, socket, activeGames));
    socket.on('finishGame', finishGameHandler(io, socket, activeGames));
};

module.exports = gameEventHandlers;