const User = require('../../models/User');
const Game = require('../../models/Game');
const { verifyUser, checkExistingGame } = require('../../util/userUtils');

const newGameHandler = (io, socket, activeGames) => async () => {
    try {
        const player = await verifyUser(socket);
        if (!player) return;

        const gameCheckResult = await checkExistingGame(player);
        if (gameCheckResult.error) {
            socket.emit('error', { message: gameCheckResult.error });
            return;
        }

        const newGame = new Game({
            hostUserId: player._id,
        });
        newGame.players.push({
            userId: player._id,
            socketId: socket.id
        });
        await newGame.save();
        await User.updateOne(
            { _id: player._id },
            { currentGame: newGame._id }
        );

        if (!activeGames.has(newGame._id.toString())) {
            activeGames.set(newGame._id.toString(), {
                game: newGame,
                sockets: new Set([socket.id])
            });
        } else {
            console.warn(`Game ${newGame._id} already exists in activeGames`);
            activeGames.get(newGame._id.toString()).sockets.add(socket.id);
        }

        socket.emit('gameCreated', {
            gameId: newGame._id,
            hostId: player._id,
            code: newGame.code
        });
        socket.join(newGame._id.toString());
    } catch (error) {
        console.error('New game error:', error);
        socket.emit('error', { message: 'Internal server error' });
    }
};

module.exports = newGameHandler;
