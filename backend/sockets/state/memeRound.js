const Round = require("../../models/Round");
const Game = require("../../models/Game");
const { getRandomMemeTemplates } = require("../../util/memeUtils");
const { activeRounds } = require("./gameState");

class MemeRound {
    constructor(gameId, players, io) {
        this.gameId = gameId;
        this.players = players;
        this.io = io;
        this.roundNumber = null;
        this.memeTemplates = null;
    }

    async startRound() {
        const game = await Game.findById(this.gameId);
        if (!game) {
            throw new Error("Game not found");
        }

        // Increment and save the current round number
        game.currentRound++;
        await game.save();

        this.roundNumber = game.currentRound;

        // Fetch meme templates for the round
        this.memeTemplates = await getRandomMemeTemplates(12);

        const newRound = new Round({
            gameId: this.gameId,
            roundNumber: this.roundNumber,
            submissions: [],
            status: "submitting",
            startTime: new Date(),
            endTime: null,
        });

        this.memeTemplates.forEach((element) => {
            newRound.memeTemplates.push(element);
        });

        await newRound.save();

        // Add to active rounds
        activeRounds.set(newRound._id.toString(), newRound);

        // Emit event to start the round
        this.io.to(game.code.toString()).emit("roundStarted", {
            roundNumber: newRound.roundNumber,
            timeLimit: game.settings.timeLimit,
        });

        // Start the timer for the round using the timeLimit from game settings
        setTimeout(async () => {
            try {
                const result = await this.endRound();
                this.io.to(this.gameId.toString()).emit("roundEnded", {
                    round: result.round,
                    leaderboard: result.leaderboard,
                });
            } catch (error) {
                console.error("Error ending round:", error);
                this.io.to(this.gameId.toString()).emit("error", { message: "An error occurred while ending the round" });
            }
        }, game.settings.timeLimit);

        return newRound;
    }

    async endRound() {
        const game = await Game.findById(this.gameId);
        if (!game) {
            throw new Error("Game not found");
        }

        const currentRound = await Round.findOne({
            gameId: this.gameId,
            roundNumber: this.roundNumber,
        });

        if (!currentRound) {
            throw new Error("Round not found");
        }

        // Calculate scores and update leaderboard
        const sortedSubmissions = currentRound.submissions.sort((a, b) => b.score - a.score);

        sortedSubmissions.forEach((submission, index) => {
            const leaderboardEntry = game.leaderboard.find((entry) => entry.userId.equals(submission.userId));
            if (leaderboardEntry) {
                switch (index) {
                    case 0:
                        leaderboardEntry.score += 3; // First place
                        break;
                    case 1:
                        leaderboardEntry.score += 2; // Second place
                        break;
                    case 2:
                        leaderboardEntry.score += 1; // Third place
                        break;
                }
            }
        });

        // Update round status
        currentRound.status = "completed";
        currentRound.endTime = new Date();
        await currentRound.save();
        await game.save();

        // Check if the game should end
        if (game.currentRound >= game.settings.rounds) {
            game.state = "finished"; // Set game to "finished"
            await game.save();
            this.io.to(game.code.toString()).emit("gameEnded", {
                leaderboard: game.leaderboard,
                message: "Game has ended!",
            });
        }

        // Remove from active rounds
        activeRounds.delete(currentRound._id.toString());

        return {
            round: currentRound,
            leaderboard: game.leaderboard,
        };
    }
}

module.exports = MemeRound;
