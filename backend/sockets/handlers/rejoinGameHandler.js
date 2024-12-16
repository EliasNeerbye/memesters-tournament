const User = require('../../models/User');
const Game = require('../../models/Game');
const { verifyUser } = require('../../util/userUtils');

const rejoinGameHandler = (io, socket, activeGames) => async () => {
    try {
        const player = await verifyUser(socket);
        if (!player) return;

        const currentGame = await Game.findById(player.currentGame)
            .populate('players.userId', 'username pfp roles')
            .populate('hostUserId', 'username pfp');
        
        if (!currentGame) {
            await User.updateOne({ _id: player._id }, { $unset: { currentGame: 1 } });
            socket.emit('error', { message: 'You are not currently in any game.' });
            return;
        }

        if (currentGame.state === 'finished') {
            await User.updateOne({ _id: player._id }, { $unset: { currentGame: 1 } });
            socket.emit('error', { message: 'The game has already finished.' });
            return;
        }

        const playerIndex = currentGame.players.findIndex(p => p.userId._id.toString() === player._id.toString());
        if (playerIndex === -1) {
            await User.updateOne({ _id: player._id }, { $unset: { currentGame: 1 } });
            socket.emit('error', { message: 'You are not part of this game.' });
            return;
        }

        const oldSocketId = currentGame.players[playerIndex].socketId;
        currentGame.players[playerIndex].socketId = socket.id;

        // If the game is active in the "activeGames" collection, update its socket connections
        if (activeGames.has(currentGame._id.toString())) {
            const gameData = activeGames.get(currentGame._id.toString());
            gameData.sockets.delete(oldSocketId);
            gameData.sockets.add(socket.id);
        }

        // Ensure we send the correct state if the game is in the "waiting" or "playing" state
        if (currentGame.state === "playing") {
            // Corrected: Use `player.currentMemes` for currentMemes
            return socket.emit("gameRejoined", {
                gameId: currentGame._id,
                gameState: currentGame.state,
                currentMemes: player.currentMemes,  // Corrected to player.currentMemes
            });
        } else if (currentGame.state === "waiting") {
            socket.emit("gameRejoined", {
                gameId: currentGame._id,
                gameState: currentGame.state,
                host: {
                    username: currentGame.hostUserId.username,
                    pfp: currentGame.hostUserId.pfp,
                },
                players: currentGame.players.map((p) => ({
                    username: p.userId.username,
                    pfp: p.userId.pfp,
                })),
            });
        } else {
            socket.emit("gameRejoined", {
                gameId: currentGame._id,
                gameState: currentGame.state,
                host: {
                    username: currentGame.hostUserId.username,
                    pfp: currentGame.hostUserId.pfp,
                },
                players: currentGame.players.map((p) => ({
                    username: p.userId.username,
                    pfp: p.userId.pfp,
                })),
            });
        }

        socket.join(currentGame._id.toString());

        // Emit player rejoin to all other connected players
        socket.to(currentGame._id.toString()).emit("playerRejoined", {
            playerInfo: {
                playerName: player.username,
                playerPfp: player.pfp,
            },
        });
    } catch (error) {
        console.error('Rejoin game error:', error);
        socket.emit('error', { message: 'Internal server error' });
    }
};

module.exports = rejoinGameHandler;
