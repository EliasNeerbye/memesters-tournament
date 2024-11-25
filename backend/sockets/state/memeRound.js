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

    // Calculate score based on position and player count
    calculatePositionScore(position, totalPlayers) {
        // Ensure position is 0-based (1st place = position 0)
        const MAX_SCORE = 1500;
        const MIN_SCORE = 500;
        const score_range = MAX_SCORE - MIN_SCORE;

        // With fewer players, create bigger gaps between positions
        const positionFactor = Math.pow((totalPlayers - position) / totalPlayers, 2);

        // Calculate base score
        let score = MIN_SCORE + score_range * positionFactor;

        // Add bonus for top 3 positions
        if (position === 0)
            score *= 1.5; // 50% bonus for 1st place
        else if (position === 1)
            score *= 1.25; // 25% bonus for 2nd place
        else if (position === 2) score *= 1.1; // 10% bonus for 3rd place

        // Round to nearest 10 for cleaner numbers
        return Math.round(score / 10) * 10;
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
            memeTemplates: this.memeTemplates,
        });

        // Start the timer for the round using the timeLimit from game settings
        setTimeout(async () => {
            try {
                await this.endRound();
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

        // Update round status
        currentRound.status = "judging";
        currentRound.endTime = new Date();
        await currentRound.save();

        // Send anonymized submissions to all players for judging
        const anonymizedSubmissions = currentRound.submissions.map((submission) => ({
            id: submission._id,
            memeIndex: submission.memeIndex,
            captions: submission.captions,
        }));

        this.io.to(game.code.toString()).emit("startJudging", {
            submissions: anonymizedSubmissions,
            timeLimit: 60000, // 1 minute for judging
        });

        // Start the timer for judging phase
        setTimeout(async () => {
            try {
                await this.endJudging();
            } catch (error) {
                console.error("Error ending judging:", error);
                this.io.to(this.gameId.toString()).emit("error", { message: "An error occurred while ending the judging phase" });
            }
        }, 60000);
    }

    async endJudging() {
        const game = await Game.findById(this.gameId);
        if (!game) {
            throw new Error("Game not found");
        }

        const currentRound = await Round.findOne({
            gameId: this.gameId,
            roundNumber: this.roundNumber,
        }).populate("submissions.userId");

        if (!currentRound) {
            throw new Error("Round not found");
        }

        // Initialize submission rankings
        const submissionRankings = new Map();
        currentRound.submissions.forEach((submission) => {
            submissionRankings.set(submission._id.toString(), 0);
        });

        // Calculate average ranking for each submission
        currentRound.judgements.forEach((judgement) => {
            judgement.submissionsRanked.forEach((submissionId, rank) => {
                submissionRankings.set(submissionId.toString(), (submissionRankings.get(submissionId.toString()) || 0) + rank);
            });
        });

        // Convert average rankings to array and sort
        const sortedSubmissions = Array.from(submissionRankings.entries())
            .map(([submissionId, totalRank]) => ({
                submissionId,
                averageRank: totalRank / currentRound.judgements.length,
            }))
            .sort((a, b) => a.averageRank - b.averageRank);

        // Calculate and assign scores based on position
        const totalPlayers = sortedSubmissions.length;
        sortedSubmissions.forEach((submission, index) => {
            const score = this.calculatePositionScore(index, totalPlayers);
            const currentSubmission = currentRound.submissions.find((s) => s._id.toString() === submission.submissionId);

            if (currentSubmission) {
                currentSubmission.score = score;
                currentSubmission.status = "judged";
            }
        });

        currentRound.status = "completed";
        await currentRound.save();

        // Update game leaderboard with new scores
        currentRound.submissions.forEach((submission) => {
            const playerIndex = game.leaderboard.findIndex((entry) => entry.userId.equals(submission.userId._id));

            if (playerIndex !== -1) {
                game.leaderboard[playerIndex].score += submission.score;
            } else {
                game.leaderboard.push({
                    userId: submission.userId._id,
                    score: submission.score,
                });
            }
        });

        // Sort leaderboard by score
        game.leaderboard.sort((a, b) => b.score - a.score);

        // Check if this was the final round
        const isGameFinished = game.currentRound >= game.settings.rounds;

        if (isGameFinished) {
            game.state = "finished";
            // Remove from active rounds
            activeRounds.delete(currentRound._id.toString());

            // Emit game finished event with final results
            this.io.to(game.code.toString()).emit("gameFinished", {
                leaderboard: game.leaderboard,
                roundResults: {
                    submissions: currentRound.submissions.map((sub) => ({
                        ...sub.toObject(),
                        position: sortedSubmissions.findIndex((s) => s.submissionId === sub._id.toString()) + 1,
                    })),
                    scores: sortedSubmissions.map((s, index) => ({
                        submissionId: s.submissionId,
                        score: this.calculatePositionScore(index, totalPlayers),
                        position: index + 1,
                    })),
                },
            });
        } else {
            // Emit round results and prepare for next round
            this.io.to(game.code.toString()).emit("roundResults", {
                roundNumber: this.roundNumber,
                submissions: currentRound.submissions.map((sub) => ({
                    ...sub.toObject(),
                    position: sortedSubmissions.findIndex((s) => s.submissionId === sub._id.toString()) + 1,
                })),
                scores: sortedSubmissions.map((s, index) => ({
                    submissionId: s.submissionId,
                    score: this.calculatePositionScore(index, totalPlayers),
                    position: index + 1,
                })),
                leaderboard: game.leaderboard,
            });
        }

        await game.save();
    }
}

module.exports = MemeRound;