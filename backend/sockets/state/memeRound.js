const Round = require("../../models/Round");
const Game = require("../../models/Game");
const { getRandomMemeTemplates } = require("../../util/memeUtils");
const { activeRounds } = require("./gameState");
const mongoose = require("mongoose");

const gameEvents = require('../../events/gameEvents');
class MemeRound {
    constructor(gameId, players, io) {
        this.gameId = gameId;
        this.players = players;
        this.io = io;
        this.roundNumber = null;
        this.memeTemplates = null;
        this.submissionTimer = null;
        this.judgingTimer = null;

        gameEvents.on("allSubmissionsCompleted", async (data) => {
            if (data.gameId.toString() == this.gameId.toString()) {
                if (this.submissionTimer) clearTimeout(this.submissionTimer);
        
                try {
                    const currentGame = await Game.findById(new mongoose.Types.ObjectId(this.gameId));
                    const currentRound = await Round.findOne({ gameId: this.gameId, roundNumber: currentGame.currentRound});
                    if (currentRound && currentRound.status == 'submitting') {
                        await this.handleTimeoutSubmissions(currentRound);
                        await this.endRound();
                    }
                } catch (error) {
                    console.error("Error in submission timeout:", error);
                    this.io.to(this.gameId.toString()).emit("error", { message: "Error processing submissions" });
                }
            }
        });


        gameEvents.on("allJudgementsCompleted", async (data) => {
            if (data.gameId.toString() == this.gameId.toString()) {
                if (this.submissionTimer) clearTimeout(this.submissionTimer);
        
                try {
                    const currentGame = await Game.findById(new mongoose.Types.ObjectId(this.gameId));
                    const currentRound = await Round.findOne({ gameId: this.gameId, roundNumber: currentGame.currentRound});
                    if (currentRound && currentRound.status == 'judging') {
                        await this.handleTimeoutJudging(currentRound);
                        await this.endJudging();
                    }
                } catch (error) {
                    console.error("Error in submission timeout:", error);
                    this.io.to(this.gameId.toString()).emit("error", { message: "Error processing submissions" });
                }
            }
        });
    }

    calculatePositionScore(position, totalPlayers) {
        const MAX_SCORE = 1500;
        const MIN_SCORE = 500;
        const score_range = MAX_SCORE - MIN_SCORE;
        const positionFactor = Math.pow((totalPlayers - position) / totalPlayers, 2);
        let score = MIN_SCORE + score_range * positionFactor;

        if (position === 0) score *= 1.5;
        else if (position === 1) score *= 1.25;
        else if (position === 2) score *= 1.1;

        return Math.round(score / 10) * 10;
    }

    async startRound() {
        const game = await Game.findById(this.gameId);
        if (!game) throw new Error("Game not found");

        game.currentRound++;
        await game.save();

        this.roundNumber = game.currentRound;
        this.memeTemplates = await getRandomMemeTemplates(12);

        const newRound = new Round({
            gameId: this.gameId,
            roundNumber: this.roundNumber,
            submissions: [],
            status: "submitting",
            startTime: new Date(),
            memeTemplates: this.memeTemplates,
            endTime: new Date(Date.now() + game.settings.timeLimit),
        });

        await newRound.save();
        activeRounds.set(newRound._id.toString(), newRound);

        this.submissionTimer = setTimeout(async () => {
            try {
                const currentRound = await Round.findById(newRound._id);
                if (currentRound && currentRound.status === "submitting") {
                    await this.handleTimeoutSubmissions(currentRound);
                    await this.endRound();
                }
            } catch (error) {
                console.error("Error in submission timeout:", error);
                this.io.to(this.gameId.toString()).emit("error", { message: "Error processing submissions" });
            }
        }, game.settings.timeLimit);

        return newRound;
    }

    async handleTimeoutSubmissions(round) {
        const game = await Game.findById(this.gameId);
        const nonSubmittedPlayers = game.players.filter((player) => !round.submissions.some((sub) => sub.userId.toString() === player.userId.toString()));

        for (const player of nonSubmittedPlayers) {
            this.io.to(player.socketId).emit("submissionTimeout", {
                message: "Time's up! You didn't submit a meme for this round.",
            });
        }
    }

    async endRound() {
        const game = await Game.findById(this.gameId);
        if (!game) throw new Error("Game not found");

        const currentRound = await Round.findOne({
            gameId: this.gameId,
            roundNumber: this.roundNumber,
        });

        if (!currentRound) throw new Error("Round not found");

        currentRound.status = "judging";
        await currentRound.save();

        const anonymizedSubmissions = currentRound.submissions.map((submission) => ({
            id: submission._id,
            memeIndex: submission.memeIndex,
            captions: submission.captions,
        }));

        this.io.to(this.gameId.toString()).emit("startJudging", {
            submissions: anonymizedSubmissions,
            timeLimit: 60000,
        });

        this.judgingTimer = setTimeout(async () => {
            try {
                const updatedRound = await Round.findById(currentRound._id);
                if (updatedRound && updatedRound.status === "judging") {
                    await this.handleTimeoutJudging(updatedRound);
                    await this.endJudging();
                }
            } catch (error) {
                console.error("Error in judging timeout:", error);
                this.io.to(this.gameId.toString()).emit("error", { message: "Error processing judgments" });
            }
        }, 60000);
    }

    async handleTimeoutJudging(round) {
        const game = await Game.findById(this.gameId);
        const nonJudgedPlayers = game.players.filter(
            (player) =>
                !round.judgements.some((judge) => judge.userId.toString() === player.userId.toString()) &&
                !round.submissions.some((sub) => sub.userId.toString() === player.userId.toString())
        );

        for (const player of nonJudgedPlayers) {
            this.io.to(player.socketId).emit("judgingTimeout", {
                message: "Time's up! You didn't submit your votes for this round.",
            });
        }
    }

    async endJudging() {
        const game = await Game.findById(this.gameId);
        if (!game) throw new Error("Game not found");

        const currentRound = await Round.findOne({
            gameId: this.gameId,
            roundNumber: this.roundNumber,
        }).populate("submissions.userId");

        if (!currentRound) throw new Error("Round not found");

        const submissionRankings = new Map();
        currentRound.submissions.forEach((submission) => {
            submissionRankings.set(submission._id.toString(), 0);
        });

        currentRound.judgements.forEach((judgement) => {
            judgement.submissionsRanked.forEach((submissionId, rank) => {
                submissionRankings.set(submissionId.toString(), (submissionRankings.get(submissionId.toString()) || 0) + rank);
            });
        });

        const sortedSubmissions = Array.from(submissionRankings.entries())
            .map(([submissionId, totalRank]) => ({
                submissionId,
                averageRank: totalRank / Math.max(1, currentRound.judgements.length),
            }))
            .sort((a, b) => a.averageRank - b.averageRank);

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

        game.leaderboard.sort((a, b) => b.score - a.score);

        const isGameFinished = game.currentRound >= game.settings.rounds;

        if (isGameFinished) {
            game.state = "finished";
            activeRounds.delete(currentRound._id.toString());

            this.io.to(this.gameId.toString()).emit("gameFinished", {
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
            this.io.to(this.gameId.toString()).emit("roundResults", {
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
            });
        }

        if (this.submissionTimer) clearTimeout(this.submissionTimer);
        if (this.judgingTimer) clearTimeout(this.judgingTimer);

        await game.save();
    }
}

module.exports = MemeRound;