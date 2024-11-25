const User = require('../../models/User');
const Game = require('../../models/Game');
const MemeRound = require("../state/memeRound"); // Import the MemeRound class
const { verifyUser, checkExistingGame } = require("../../util/userUtils");

const startGameHandler = (io, socket, activeGames) => async () => {
    try {
        // Verify the user
        const player = await verifyUser(socket);
        if (!player) return;

        // Check if the player is already in a game
        const { error } = await checkExistingGame(player);
        if (!error) {
            socket.emit("error", { message: error });
            return;
        }

        // Find the game
        const game = await Game.findOne({ hostUserId: player._id, state: "waiting" });
        if (!game) {
            socket.emit("error", { message: "Game not found or not in waiting state" });
            return;
        }

        // Check if there are enough players
        if (game.players.length < 1) {
            socket.emit("error", { message: "Not enough players to start the game" });
            return;
        }

        // Start the game
        game.state = "playing";
        await game.save();

        // Initialize and start the first round using MemeRound
        const memeRound = new MemeRound(game._id, game.players);
        const firstRound = await memeRound.startRound();

        // Prepare game state to send to clients
        const gameState = {
            gameId: game._id,
            players: game.players,
            currentRound: game.currentRound,
            totalRounds: game.settings.rounds,
            leaderboard: game.leaderboard,
        };

        // Send game state to all players in the game
        io.to(game.code.toString()).emit("gameStarted", gameState);

        // Distribute memes to players for the first round
        game.players.forEach((player) => {
            const playerMemes = memeRound.memeTemplates.sort(() => 0.5 - Math.random()).slice(0, 6);

            io.to(player.socketId).emit("newRound", {
                roundNumber: firstRound.roundNumber,
                memes: playerMemes,
            });
        });

        // Add game to active games
        activeGames.set(game._id.toString(), game);
    } catch (error) {
        console.error("Error starting game:", error);
        socket.emit("error", { message: "An error occurred while starting the game" });
    }
};

module.exports = startGameHandler;