const User = require('../../models/User');
const Game = require('../../models/Game');
const { verifyUser } = require('../../util/userUtils');

const removeUserHandler = (io, socket, activeGames) => async (userIdToRemove) => {
    try {
        const owner = await verifyUser(socket);
        if (!owner) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        const game = await Game.findOne({ 'players.userId': owner._id })
            .populate('players.userId', 'username pfp roles');
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        if (game.hostUserId.toString() !== owner._id.toString()) {
            socket.emit('error', { message: 'Only the game host can remove users' });
            return;
        }

        const userToRemove = game.players.find(
            player => player.userId._id.toString() === userIdToRemove
        );
        if (!userToRemove) {
            socket.emit('error', { message: 'User not found in game' });
            return;
        }

        game.players = game.players.filter(
            player => player.userId._id.toString() !== userIdToRemove
        );
        await game.save();

        await User.updateOne(
            { _id: userIdToRemove },
            { $unset: { currentGame: 1 } }
        );

        const activeGame = activeGames.get(game._id.toString());
        if (activeGame) {
            activeGame.sockets.delete(userToRemove.socketId);
            activeGame.game = game;
        }

        const removedPlayerInfo = {
            username: userToRemove.userId.username,
            pfp: userToRemove.userId.pfp,
        };

        socket.to(game._id.toString()).emit("playerRemoved", {
            removedPlayer: removedPlayerInfo,
            removedBy: {
                username: owner.username,
            },
            updatedPlayers: game.players.map((p) => ({
                username: p.userId.username,
                pfp: p.userId.pfp,
            })),
        });

        io.to(userToRemove.socketId).emit("youWereRemoved", {
            gameId: game._id,
            removedBy: {
                username: owner.username,
            },
        });

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