const express = require("express");
const router = express.Router();
const Round = require("../../models/Round");
const User = require("../../models/User");
const Game = require("../../models/Game");
const AuthService = require("../../util/auth");
require("dotenv").config();

const gameEvents = require("../../events/gameEvents");

router.put("/submit-memes", async (req, res) => {
    try {
        const token = req.cookies.auth_token;
        const isBlackListed = await AuthService.isTokenBlacklisted(token);
        if (isBlackListed) {
            return res.status(401).json({ error: "Token is blacklisted" });
        }

        const isUser = await AuthService.jwtValidation(token, process.env.JWT_SECRET);
        if (!isUser || isUser.length < 1) {
            return res.status(404).json({ error: "User not found!" });
        }

        const user = await User.findById(isUser._id);

        const game = await Game.findById(user.currentGame);
        if (!game || game.state !== "playing") {
            return res.status(403).json({ error: "Game is not available or active" });
        }

        const roundNumber = game.currentRound;
        const round = await Round.findOne({ gameId: game._id, roundNumber });
        if (!round || round.status !== "submitting") {
            return res.status(403).json({ error: "Round is not accepting submissions" });
        }

        if (round.endTime && new Date() > new Date(round.endTime)) {
            return res.status(403).json({ error: "Submission window has closed" });
        }

        const { chosenTemplate } = req.body;
        let { captions } = req.body;

        // Parse user's current memes
        let userMemes = [];
        try {
            userMemes = JSON.parse(user.currentMemes);
        } catch (error) {
            return res.status(500).json({ error: "Failed to parse user's current memes" });
        }

        const hasMemeWithId = userMemes.some(meme => meme.id === chosenTemplate);

        if (!hasMemeWithId) {
            return res.status(400).json({ error: "Invalid meme template chosen" });
        }

        // Normalize captions
        if (typeof captions === "string") {
            captions = [captions.trim()];
        } else if (Array.isArray(captions)) {
            captions = captions.map((c) => (typeof c === "string" ? c.trim() : "")).filter((c) => c);
        } else {
            return res.status(400).json({ error: "Invalid captions provided" });
        }

        if (captions.length === 0) {
            return res.status(400).json({ error: "Captions cannot be empty" });
        }

        const existingSubmission = round.submissions.find((sub) => sub.userId.toString() === user._id.toString());
        if (existingSubmission) {
            return res.status(400).json({ error: "User has already submitted a meme for this round" });
        }

        const newSubmission = {
            userId: user._id,
            memeIndex: userMemes.indexOf(chosenTemplate),
            captions,
        };

        round.submissions.push(newSubmission);

        await round.save();

        const io = req.app.get("io");
        
        if (round.submissions.length === game.players.length) {
            gameEvents.emit('allSubmissionsCompleted', { gameId: game._id });
            // Still keep the Socket.IO emit for clients
            io.to(game._id.toString()).emit("allSubmissionsCompleted", { gameId: game._id });
        }

        res.status(200).json({ message: "Meme submitted successfully", submission: newSubmission });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }

});

router.put("/updateSettings", async (req, res) => {
    try {
        const token = req.cookies.auth_token;
        const isBlackListed = await AuthService.isTokenBlacklisted(token);
        if (isBlackListed) {
            return res.status(401).json({ error: "Token is blacklisted" });
        }

        const isUser = await AuthService.jwtValidation(token, process.env.JWT_SECRET);
        if (!isUser || isUser.length < 1) {
            return res.status(404).json({ error: "User not found!" });
        }

        const user = await User.findById(isUser._id);

        const game = await Game.findById(user.currentGame);
        if (!game || game.state !== "waiting") {
            return res.status(403).json({ error: "Game is not available to changes" });
        }

        const { rounds, timeLimit } = req.body;
        if (game.hostUserId == user._id) {
            try {
                game.settings.rounds = rounds;
                game.settings.timeLimit = timeLimit;
                await game.save();

                return res.status(200).json({ message: "Updated settings" });
            } catch (error) {
                console.error(error);
                return res.status(500).json({ error: "Internal server error" });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/submit-vote", async (req, res) => {
    try {
        const token = req.cookies.auth_token;
        const isBlackListed = await AuthService.isTokenBlacklisted(token);
        if (isBlackListed) {
            return res.status(401).json({ error: "Token is blacklisted" });
        }

        const isUser = await AuthService.jwtValidation(token, process.env.JWT_SECRET);
        if (!isUser || isUser.length < 1) {
            return res.status(404).json({ error: "User not found!" });
        }

        const user = await User.findById(isUser._id);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        const game = await Game.findById(user.currentGame);
        if (!game || game.state !== "playing") {
            return res.status(403).json({ error: "Game is not available or active" });
        }

        const roundNumber = game.currentRound;
        const round = await Round.findOne({ gameId: game._id, roundNumber });

        if (!round || round.status !== "judging") {
            return res.status(403).json({ error: "Round is not in judging phase" });
        }

        // Validate the request body
        const { submissionsRanked } = req.body;

        if (!Array.isArray(submissionsRanked)) {
            return res.status(400).json({ error: "Invalid judgement format" });
        }

        // Verify all submission IDs exist in the round
        const validSubmissionIds = round.submissions.map((sub) => sub._id.toString());
        const allSubmissionsValid = submissionsRanked.every((subId) => validSubmissionIds.includes(subId.toString()));

        if (!allSubmissionsValid) {
            return res.status(400).json({ error: "Invalid submission IDs in judgement" });
        }

        // Check if user has already submitted a judgement
        const existingJudgement = round.judgements.find((judge) => judge.userId.toString() === user._id.toString());

        if (existingJudgement) {
            // Update existing judgement
            existingJudgement.submissionsRanked = submissionsRanked;
        } else {
            // Add new judgement
            round.judgements.push({
                userId: user._id,
                submissionsRanked,
            });
        }

        await round.save();

        const playersWhoCanJudge = game.players.length - 1;
        const remainingJudgements = playersWhoCanJudge - round.judgements.length;

        const io = req.app.get("io");

        if (remainingJudgements === 0) {
            gameEvents.emit('allJudgementsCompleted', { gameId: game._id });
            io.to(game._id.toString()).emit("allJudgementsCompleted", { gameId: game._id });
        }

        res.status(200).json({
            message: "Judgement submitted successfully",
            remainingJudgements,
            totalPlayers: playersWhoCanJudge,
        });
    } catch (error) {
        console.error("Error in submit-judgement:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;