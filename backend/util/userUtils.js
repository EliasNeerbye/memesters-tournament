const User = require('../models/User');
const Game = require('../models/Game');

const verifyUser = async (socket) => {
    try {
        const player = await User.findById(socket.user.id);
        if (!player) {
            socket.emit('error', { message: 'Player not found' });
            return null;
        }
        return player;
    } catch (error) {
        console.error('User verification error:', error);
        socket.emit('error', { message: 'Error verifying user' });
        return null;
    }
};

const checkExistingGame = async (player) => {
    if (!player.currentGame) {
        return { error: null };
    }

    const game = await Game.findOne({
        _id: player.currentGame,
        state: { $in: ['waiting', 'playing'] }
    });

    if (!game) {
        await User.updateOne(
            { _id: player._id },
            { $unset: { currentGame: 1 } }
        );
        return { error: null };
    }

    if (game.hostUserId.equals(player._id)) {
        return { error: 'Player already host of a game!' };
    }

    return { error: 'Player already in a game!' };
};

module.exports = { verifyUser, checkExistingGame };
