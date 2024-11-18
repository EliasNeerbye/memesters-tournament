const newGameHandler = require('./newGameHandler');
const joinGameHandler = require('./joinGameHandler');
const finishGameHandler = require('./finishGameHandler');
const leaveGameHandler = require('./leaveGameHandler');
const rejoinGameHandler = require('./rejoinGameHandler');

const gameEventHandlers = (io, socket, activeGames) => {
    socket.on('newGame', newGameHandler(io, socket, activeGames));
    socket.on('joinGame', joinGameHandler(io, socket, activeGames));
    socket.on('finishGame', finishGameHandler(io, socket, activeGames));
    socket.on('leaveGame', leaveGameHandler(io, socket, activeGames));
    socket.on('rejoinGame', rejoinGameHandler(io, socket, activeGames));
};

module.exports = gameEventHandlers;