const User = require('../../models/User');
const Game = require('../../models/Game');
const { verifyUser, checkExistingGame } = require('../../util/userUtils');

const joinGameHandler = (io, socket, activeGames) => async (code) => {
    try {
        const player = await verifyUser(socket);
        if (!player) return;

        const gameCheckResult = await checkExistingGame(player);
        if (gameCheckResult.error) {
            socket.emit('error', { message: gameCheckResult.error });
            return;
        }

        const game = await Game.findOne({code});
        if(!game){
            socket.emit('error', {message: "Game not found!"});
            return;
        }

        if (game.isFull()){
            socket.emit('error', {message: "Game is full!"});
            return;
        }

        game.players.push({ userId: player._id, socketId: socket.id });
        await game.save();
        await User.updateOne({ _id: player._id }, { currentGame: game._id });

        if (!activeGames.has(game._id.toString())) {
            console.warn(`Game ${game._id} not found in activeGames, creating new entry`);
            activeGames.set(game._id.toString(), {
                game: game,
                sockets: new Set([socket.id])
            });
        } else {
            activeGames.get(game._id.toString()).sockets.add(socket.id);
        }

        socket.emit('gameJoined', { gameId: game._id, playerId: player._id });
        socket.join(game._id.toString());
        socket.to(game._id.toString()).emit('newPlayerJoined', { playerId: player._id });
    } catch (error) {
        console.error('Join game error:', error);
        socket.emit('error', { message: 'Internal server error' });
    }
};

module.exports = joinGameHandler;
