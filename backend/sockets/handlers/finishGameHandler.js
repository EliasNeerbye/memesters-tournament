const User = require('../../models/User');
const Game = require('../../models/Game');

const finishGameHandler = (io, socket, activeGames) => async () => {
    try {
        const player = await User.findById(socket.user.id);
        if (!player || !player.currentGame) {
            socket.emit('error', { message: 'No active game to finish' });
            return;
        }

        const game = await Game.findById(player.currentGame);
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        if (!game.hostUserId.equals(player._id)) {
            socket.emit('error', { message: 'Only the host can finish the game' });
            return;
        }

        if (game.state === 'waiting' && game.rounds.length === 0) {
            await Game.deleteOne({ _id: game._id });
            io.to(game._id.toString()).emit('gameFinished', { message: 'Game has been cancelled by the host' });
            return;
        } else {
            game.state = 'finished';
            await game.save();
            io.to(game._id.toString()).emit('gameFinished', { message: 'Game has been finished by the host' });
        }

        if (activeGames.has(game._id.toString())) {
            const gameData = activeGames.get(game._id.toString());
            for (let i = 0; i < gameData.players.length; i++) {
                io.sockets.sockets.get(gameData.players[i].socketId)?.leave(game._id.toString());
                await User.findByIdAndUpdate(gameData.players[i].userId, { $unset: { currentGame: "" } });
            }
            activeGames.delete(game._id.toString());
        }
    } catch (error) {
        console.error('Finish game error:', error);
        socket.emit('error', { message: 'Internal server error' });
    }
};

module.exports = finishGameHandler;
