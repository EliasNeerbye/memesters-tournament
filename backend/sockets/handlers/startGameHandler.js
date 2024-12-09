const User = require('../../models/User');
const Game = require('../../models/Game');
const MemeRound = require("../state/memeRound");
const { verifyUser } = require("../../util/userUtils");

const startGameHandler = (io, socket, activeGames) => async () => {
    try {
        const player = await verifyUser(socket);
        if (!player) {
            socket.emit("error", { message: "User verification failed" });
            return;
        }

        const game = await Game.findOne({ hostUserId: player._id, state: "waiting" });
        if (!game) {
            socket.emit("error", { message: "Game not found or not in waiting state" });
            return;
        }

        if (game.players.length < 1) {
            socket.emit("error", { message: "Not enough players to start the game" });
            return;
        }

        game.state = "playing";
        await game.save();

        const memeRound = new MemeRound(game._id, game.players, io);
        const firstRound = await memeRound.startRound();

        const gameState = {
            gameId: game._id,
            players: game.players,
            currentRound: game.currentRound,
            totalRounds: game.settings.rounds,
            leaderboard: game.leaderboard,
        };

        io.to(game.code.toString()).emit("gameStarted", gameState);

        game.players.forEach(async (player) => {
            const memeTemplates = memeRound.memeTemplates;

            // Fisher-Yates shuffle algorithm
            for (let i = memeTemplates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [memeTemplates[i], memeTemplates[j]] = [memeTemplates[j], memeTemplates[i]];
            }

            const playerMemes = memeTemplates.slice(0, 6);

            const user = await User.find(player.userId);

            try {
                await User.findByIdAndUpdate(player.userId, { currentMemes: JSON.stringify(playerMemes) });
            } catch (error) {
                console.error("Error updating user memes:", error);
            }

            io.to(player.socketId).emit("newRound", {
                roundNumber: firstRound.roundNumber,
                memes: playerMemes,
                timeLimit: game.settings.timeLimit,
            });
        });

        activeGames.set(game._id.toString(), { game, sockets: new Set(game.players.map((p) => p.socketId)) });
    } catch (error) {
        console.error("Error starting game:", error);
        socket.emit("error", { message: "An error occurred while starting the game" });
    }
};

module.exports = startGameHandler;
