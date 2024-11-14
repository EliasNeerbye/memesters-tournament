const authMiddleware = require('./middleware/authMiddleware');
const gameEventHandlers = require('./handlers/gameEventHandlers');
const { activeGames } = require('./state/gameState');

const GameSocket = (io) => {
    io.use(authMiddleware);

    io.on('connection', (socket) => {
        gameEventHandlers(io, socket, activeGames);
    });
};

module.exports = GameSocket;