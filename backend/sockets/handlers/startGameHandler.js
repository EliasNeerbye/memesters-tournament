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
            totalRounds: game.settings[0].rounds, // Using the first setting (rounds)
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
                timeLimit: game.settings[0].timeLimit, // Include the time limit in the round
            });
        });

        // Timer to automatically end the round when the time limit is reached
        setTimeout(async () => {
            const roundEndResult = await memeRound.endRound();

            // Send the round end result to all players
            io.to(game.code.toString()).emit("roundEnded", {
                round: roundEndResult.round,
                leaderboard: roundEndResult.leaderboard,
            });

            // Proceed to the next round or end the game if the round limit is reached
            if (game.currentRound >= game.settings[0].rounds) {
                game.state = "finished";
                await game.save();
                io.to(game.code.toString()).emit("gameEnded", { leaderboard: game.leaderboard });
            } else {
                // Start the next round
                const nextRound = new MemeRound(game._id, game.players);
                await nextRound.startRound();
            }
        }, game.settings[0].timeLimit); // Using timeLimit from game settings

        // Add game to active games
        activeGames.set(game._id.toString(), game);
    } catch (error) {
        console.error("Error starting game:", error);
        socket.emit("error", { message: "An error occurred while starting the game" });
    }
};

module.exports = startGameHandler;