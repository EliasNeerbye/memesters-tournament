const User = require('../../models/User');
const Game = require('../../models/Game');
const { verifyUser } = require('../../util/userUtils');

const removeUserHandler = (io, socket, activeGames) => async (userIdToRemove) => {
    try {
        // Check if user is verified
        const owner = await verifyUser(socket);
        if (!owner) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        // Get the game
        const game = await Game.findOne({ 'players.userId': owner._id });
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        // Check if user is owner
        if (game.owner.toString() !== owner._id.toString()) {
            socket.emit('error', { message: 'Only the game owner can remove users' });
            return;
        }

        // Check if attempting to remove the host
        if (userIdToRemove === game.owner.toString()) {
            socket.emit('error', { message: 'Cannot remove the game host' });
            return;
        }

        // Check if user to remove is in the game
        const userToRemove = game.players.find(
            player => player.userId.toString() === userIdToRemove
        );
        if (!userToRemove) {
            socket.emit('error', { message: 'User not found in game' });
            return;
        }

        // Remove the user from the game
        game.players = game.players.filter(
            player => player.userId.toString() !== userIdToRemove
        );
        await game.save();

        // Remove current game from the user
        await User.updateOne(
            { _id: userIdToRemove },
            { $unset: { currentGame: 1 } }
        );

        // Update activeGames map
        const activeGame = activeGames.get(game._id.toString());
        if (activeGame) {
            activeGame.sockets.delete(userToRemove.socketId);
            activeGame.game = game;
        }

        // Notify all players in the game
        socket.to(game._id.toString()).emit('playerRemoved', { 
            removedPlayerId: userIdToRemove,
            removedBy: owner._id 
        });

        // Notify the removed player
        io.to(userToRemove.socketId).emit('youWereRemoved', {
            gameId: game._id,
            removedBy: owner._id
        });

        // Make the removed player leave the socket room
        const removedSocket = io.sockets.sockets.get(userToRemove.socketId);
        if (removedSocket) {
            removedSocket.leave(game._id.toString());
        }

    } catch (error) {
        console.error('Remove user error:', error);
        socket.emit('error', { message: 'Internal server error' });
    }
};

module.exports = removeUserHandler;