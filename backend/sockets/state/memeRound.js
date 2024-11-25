const User = require("../../models/User");
const Game = require("../../models/Game");
const Round = require("../../models/Round");
const { getRandomMemeTemplates } = require("../../util/memeUtils");
const { activeGames, activeRounds } = require("./gameState");

class MemeRound {
    constructor(gameId, players) {
        this.gameId = gameId;
        this.players = players;
        this.roundNumber = null;
        this.memeTemplates;
    }

    async getMoreInfo() {
        const game = await Game.findById(this.gameId);
        if (!game) {
            return { error: "Game not found" };
        }

        if (game.state !== "playing") {
            return { error: "Game is not on-going" };
        }

        game.currentRound++;
        await game.save();
        this.roundNumber = game.currentRound;

        this.memeTemplates = await getRandomMemeTemplates(12);

        const newRound = new Round({
            gameId: this.gameId,
            roundNumber: this.roundNumber,
            memeTemplates: this.memeTemplates,
        });

        await newRound.save();
        return newRound;
    }

    async startRound() {
        // Verify the game exists
        const game = await Game.findById(this.gameId);
        if (!game) {
            throw new Error("Game not found");
        }

        // If this is the first round, create it
        if (!this.roundNumber) {
            await this.getMoreInfo();
        }

        // Find the current round
        const currentRound = await Round.findOne({
            gameId: this.gameId,
            roundNumber: this.roundNumber,
        });

        if (!currentRound) {
            throw new Error("Round not found");
        }

        // Update round status
        currentRound.status = "inProgress";
        currentRound.startTime = new Date();
        await currentRound.save();

        // Add to active rounds
        activeRounds.set(currentRound._id.toString(), currentRound);

        return currentRound;
    }

    async endRound() {
        // Find the current round
        const currentRound = await Round.findOne({
            gameId: this.gameId,
            roundNumber: this.roundNumber,
        });

        if (!currentRound) {
            throw new Error("Round not found");
        }

        // Calculate scores
        const sortedSubmissions = currentRound.submissions.sort((a, b) => b.score - a.score);

        // Update game leaderboard
        const game = await Game.findById(this.gameId);

        sortedSubmissions.forEach((submission, index) => {
            const leaderboardEntry = game.leaderboard.find((entry) => entry.userId.equals(submission.userId));

            if (leaderboardEntry) {
                // Award points based on submission ranking
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

        // Remove from active rounds
        activeRounds.delete(currentRound._id.toString());

        return {
            round: currentRound,
            leaderboard: game.leaderboard,
        };
    }

    async saveRound(roundId, submissions) {
        const round = await Round.findById(roundId);

        if (!round) {
            throw new Error("Round not found");
        }

        // Add submissions to the round
        submissions.forEach((submission) => {
            round.submissions.push({
                userId: submission.userId,
                memeId: submission.memeId,
                caption: submission.caption,
            });
        });

        await round.save();
        return round;
    }
}

module.exports = MemeRound;
