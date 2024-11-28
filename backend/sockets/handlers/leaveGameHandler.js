const User = require('../../models/User');
const Game = require('../../models/Game');
const { verifyUser } = require('../../util/userUtils');

const leaveGameHandler = (io, socket, activeGames) => async () => {
    try {
        const player = await verifyUser(socket);
        if (!player) return;

        const game = await Game.findById(player.currentGame)
            .populate('players.userId', 'username pfp roles')
            .populate('hostUserId', 'username pfp');
        
        if (!game) {
            socket.emit('error', { message: 'Game not found!' });
            return;
        }

        const playerIndex = game.players.findIndex(p => p.userId._id.toString() === player._id.toString());
        if (playerIndex === -1) {
            socket.emit('error', { message: 'Player not in game!' });
            return;
        }

        game.players.splice(playerIndex, 1);
        if (game.players.length === 0 && game.state === 'waiting') {
            await game.deleteOne();
            activeGames.delete(game._id.toString());
            socket.emit('gameDeleted', { message: 'Game deleted as it was empty and waiting' });
        } else {
            await game.save();
            await User.updateOne({ _id: player._id }, { $unset: { currentGame: 1 } });
            
            socket.emit("leftGame", {
                gameId: game._id,
                updatedPlayers: game.players.map((p) => ({
                    username: p.userId.username,
                    pfp: p.userId.pfp,
                })),
                host: game.hostUserId
                    ? {
                          username: game.hostUserId.username,
                          pfp: game.hostUserId.pfp,
                      }
                    : null,
            });
            
            socket.to(game._id.toString()).emit("playerLeft", {
                playerInfo: {
                    playerName: player.username,
                    playerPfp: player.pfp,
                },
                updatedPlayers: game.players.map((p) => ({
                    username: p.userId.username,
                    pfp: p.userId.pfp,
                })),
            });
        }

        socket.leave(game._id.toString());
    } catch (error) {
        console.error('Leave game error:', error);
        socket.emit('error', { message: 'Internal server error' });
    }
};

module.exports = leaveGameHandler;
