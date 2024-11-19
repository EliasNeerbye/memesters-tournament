const User = require('../../models/User');
const Game = require('../../models/Game');
const Round = require('../../models/Round');
const { verifyUser, checkExistingGame } = require('../../util/userUtils');
const { getRandomMemeTemplates } = require('../../util/memeUtils');

const startGameHandler = (io, socket, activeGames) => async () => {
    try {
        // Verify the user
        const player = await verifyUser(socket);
        if (!player) return;

        // Check if the player is already in a game
        const { error } = await checkExistingGame(player);
        if (!error) {
            socket.emit('error', { message: error });
            return;
        }

        // Find the game
        const game = await Game.findOne({ hostUserId: player._id, state: 'waiting' });
        if (!game) {
            socket.emit('error', { message: 'Game not found or not in waiting state' });
            return;
        }

        // Check if there are enough players
        if (game.players.length < 1) {
            socket.emit('error', { message: 'Not enough players to start the game' });
            return;
        }

        // Start the game
        game.state = 'playing';
        game.currentRound = 1;

        // Fetch 12 random meme templates for the first round
        const roundMemeTemplates = await getRandomMemeTemplates(12);

        // Create the first round
        const round = new Round({
            gameId: game._id,
            roundNumber: 1,
            memeTemplates: roundMemeTemplates.map(template => template.id),
            status: 'inProgress'
        });
        await round.save();

        // Add round to game
        game.rounds.push(round._id);
        await game.save();

        // Prepare game state to send to clients
        const gameState = {
            gameId: game._id,
            players: game.players,
            currentRound: game.currentRound,
            totalRounds: game.settings.rounds,
            leaderboard: game.leaderboard
        };

        // Send game state to all players in the game
        io.to(game.code.toString()).emit('gameStarted', gameState);

        // Send 6 random memes to each player
        game.players.forEach((player) => {
            const playerMemes = roundMemeTemplates
            .sort(() => 0.5 - Math.random())
            .slice(0, 6);

            io.to(player.socketId).emit('newRound', {
            roundNumber: 1,
            memes: playerMemes
            });
        });

        // Add game to active games
        activeGames.set(game._id.toString(), game);

    } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'An error occurred while starting the game' });
    }
};

module.exports = startGameHandler;