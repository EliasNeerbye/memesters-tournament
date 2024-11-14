const User = require('../../models/User');
const Game = require('../../models/Game');
const { verifyUser, checkExistingGame } = require('../../util/userUtils');

const gameEventHandlers = (io, socket, activeGames) => {
    socket.on('newGame', async () => {
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
    });

    socket.on('joinGame', async (code) => {
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
    });

    socket.on('finishGame', async () => {
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
            } else {
                game.state = 'finished';
                await game.save();
    
                io.to(game._id.toString()).emit('gameFinished', { message: 'Game has been finished by the host' });
            }
    
            if (activeGames.has(game._id.toString())) {
                const gameData = activeGames.get(game._id.toString());
    
                for (const socketId of gameData.sockets) {
                    io.sockets.sockets.get(socketId)?.leave(game._id.toString());
                }
    
                activeGames.delete(game._id.toString());
            }
    
            socket.emit('gameFinished', { gameId: game._id });
            
        } catch (error) {
            console.error('Finish game error:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    });

    socket.on('leaveGame', async () => {
        try {
            const player = await verifyUser(socket);
            if (!player) return;
    
            const game = await Game.findById(player.currentGame);
            if (!game) {
                socket.emit('error', { message: 'Game not found!' });
                return;
            }
    
            const playerIndex = game.players.findIndex(p => p.userId.toString() === player._id.toString());
            if (playerIndex === -1) {
                socket.emit('error', { message: 'Player not in game!' });
                return;
            }
    
            game.players.splice(playerIndex, 1);
    
            if (game.players.length === 0 && game.state === 'waiting') {
                await game.deleteOne();
                socket.emit('gameDeleted', { message: 'Game deleted as it was empty and waiting' });
            } else {
                await game.save();
    
                await User.updateOne({ _id: player._id }, { $unset: { currentGame: 1 } });
    
                socket.emit('leftGame', { gameId: game._id });
                socket.to(game._id.toString()).emit('playerLeft', { playerId: player._id });
            }
    
            socket.leave(game._id.toString());
        } catch (error) {
            console.error('Leave game error:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    });

    socket.on('rejoinGame', async () => {
        try {
            const player = await verifyUser(socket);
            if (!player) return;
    
            // Check if the player has a current game
            const currentGame = await Game.findById(player.currentGame);
            if (!currentGame) {
                socket.emit('error', { message: 'You are not currently in any game.' });
                return;
            }
    
            // Check if the game is still active
            if (currentGame.state === 'finished') {
                socket.emit('error', { message: 'The game has already finished.' });
                return;
            }
    
            // Re-add player to the game
            const playerIndex = currentGame.players.findIndex(p => p.userId.toString() === player._id.toString());
            if (playerIndex !== -1) {
                // Player's socket ID is already in the game, update it
                currentGame.players[playerIndex].socketId = socket.id;
                await currentGame.save();

                // Update activeGames
                if (activeGames.has(currentGame._id.toString())) {
                    activeGames.get(currentGame._id.toString()).sockets.add(socket.id);
                } else {
                    activeGames.set(currentGame._id.toString(), {
                        game: currentGame,
                        sockets: new Set([socket.id])
                    });
                }

                // Notify the player and other players in the game
                socket.emit('gameRejoined', { gameId: currentGame._id, playerId: player._id });
                socket.join(currentGame._id.toString());
                socket.to(currentGame._id.toString()).emit('newPlayerJoined', { playerId: player._id });
            } else {
                // Player is not in the game, add them as a new player
                currentGame.players.push({ userId: player._id, socketId: socket.id });
                await currentGame.save();

                // Update activeGames
                if (activeGames.has(currentGame._id.toString())) {
                    activeGames.get(currentGame._id.toString()).sockets.add(socket.id);
                } else {
                    activeGames.set(currentGame._id.toString(), {
                        game: currentGame,
                        sockets: new Set([socket.id])
                    });
                }

                // Notify the player and other players in the game
                socket.emit('gameRejoined', { gameId: currentGame._id, playerId: player._id });
                socket.join(currentGame._id.toString());
                socket.to(currentGame._id.toString()).emit('newPlayerJoined', { playerId: player._id });
            }
        } catch (error) {
            console.error('Rejoin game error:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    });
    
};

module.exports = gameEventHandlers;
