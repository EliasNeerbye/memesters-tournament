const User = require("../../models/User");
const Game = require("../../models/Game");
const Round = require("../../models/Round");
const MemeRound = require("../state/memeRound");
const { verifyUser } = require("../../util/userUtils");

const newRoundHandler = (io, socket, activeGames) => async () => {
    try {
        const player = await verifyUser(socket);
        if (!player) {
            socket.emit("error", { message: "User verification failed" });
            return;
        }

        const game = await Game.findOne({
            hostUserId: player._id,
            state: "playing",
        });

        if (!game) {
            socket.emit("error", { message: "Game not found or not in playing state" });
            return;
        }

        // Check if we've reached the maximum number of rounds
        if (game.currentRound >= game.settings.rounds) {
            socket.emit("error", { message: "Maximum rounds reached" });
            return;
        }

        // Find the current round and check its status
        const currentRound = await Round.findOne({
            gameId: game._id,
            roundNumber: game.currentRound,
        });

        // Verify that either there is no current round or it's completed
        if (currentRound && currentRound.status !== "completed") {
            socket.emit("error", { message: "Cannot start new round while previous round is still in progress" });
            return;
        }

        // Create and start new round
        const memeRound = new MemeRound(game._id, game.players, io);
        const newRound = await memeRound.startRound();

        // Distribute different memes to each player
        game.players.forEach((player) => {
            // Randomly select 6 memes for each player from the pool of 12
            const playerMemes = memeRound.memeTemplates.sort(() => 0.5 - Math.random()).slice(0, 6);

            io.to(player.socketId).emit("newRound", {
                roundNumber: newRound.roundNumber,
                memes: playerMemes,
                timeLimit: game.settings.timeLimit,
            });
        });

        // Update active games map
        if (activeGames.has(game._id.toString())) {
            const gameData = activeGames.get(game._id.toString());
            gameData.currentRound = newRound;
        }
    } catch (error) {
        console.error("New round error:", error);
        socket.emit("error", { message: "Internal server error" });
    }
};

module.exports = newRoundHandler;
