const User = require("../../models/User");
const Game = require("../../models/Game");
const Round = require("../../models/Round");
const { getRandomMemeTemplates } = require("../../util/memeUtils");
const { activeGames, activeRounds } = require("./gameState");
class MemeRound {
    constructor(gameId, players, io) {
        this.gameId = gameId;
        this.players = players;
        this.io = io;
        this.roundNumber = null;
        this.memeTemplates;
    }

    // Start the round timer using the timeLimit from game settings
    async startTimer(duration) {
        return new Promise((resolve, reject) => {
            try {
                setTimeout(async () => {
                    try {
                        const result = await this.endRound();
                        this.io.to(this.gameId.toString()).emit("roundEnded", {
                            round: result.round,
                            leaderboard: result.leaderboard,
                        });
                        resolve(result); // Resolve the promise with the round results
                    } catch (error) {
                        console.error("Error ending round:", error);
                        this.io.to(this.gameId.toString()).emit("error", { message: "An error occurred while ending the round" });
                        reject(error);
                    }
                }, duration);
            } catch (error) {
                console.error("Error starting timer:", error);
                reject(error);
            }
        });
    }

    // Function to start the round, using the timeLimit from game settings
    async startRound() {
        const game = await Game.findById(this.gameId);
        if (!game) {
            throw new Error("Game not found");
        }

        // Get round settings from Game.settings
        const roundDuration = game.settings.timeLimit || 60000;

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

        // Start the round timer using the round duration from game settings
        console.log(`Starting timer for ${roundDuration} ms`);
        await this.startTimer(roundDuration);

        return currentRound;
    }

    // Fetch additional information about the round (e.g., meme templates)
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

        // Fetch meme templates
        this.memeTemplates = await getRandomMemeTemplates(12);

        const newRound = new Round({
            gameId: this.gameId,
            roundNumber: this.roundNumber,
            memeTemplates: this.memeTemplates,
        });

        await newRound.save();
        return newRound;
    }

    // End the current round, calculate scores, and check if the game ends
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

        // Calculate scores
        const sortedSubmissions = currentRound.submissions.sort((a, b) => b.score - a.score);

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

        // Check if the game should end
        if (game.currentRound >= game.settings[0].rounds) {
            game.state = "finished"; // Set game to "finished"
            await game.save();
            this.io.to(game.code.toString()).emit("gameFinished", {
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

    async saveRound(roundId, submission) {
        const round = await Round.findById(roundId);
        if (!round) {
            throw new Error("Round not found");
        }

        // Parse the memeTemplates field (since it's stored as a JSON string in the database)
        let memeTemplates = [];
        try {
            memeTemplates = JSON.parse(round.memeTemplates);
        } catch (error) {
            throw new Error("Error parsing meme templates");
        }

        // Validate that the memeId exists in the round's memeTemplates
        const validMeme = memeTemplates.memes.some((meme) => meme.id === submission.memeId);
        if (!validMeme) {
            throw new Error("Invalid meme template");
        }

        // Validate that captions are between 1 and 6
        if (submission.captions.length < 1 || submission.captions.length > 6) {
            throw new Error("Captions must be between 1 and 6");
        }

        // Add a single submission to the round
        round.submissions.push({
            userId: submission.userId,
            memeId: submission.memeId,
            captions: submission.captions, // Now using captions[] instead of a single caption
        });

        await round.save();
        return round;
    }
}

module.exports = MemeRound;