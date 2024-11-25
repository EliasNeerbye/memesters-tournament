const express = require("express");
const router = express.Router();
const Round = require("../../models/Round");
const Game = require("../../models/Game");
const AuthService = require("../../util/auth");
require("dotenv").config();

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

        const game = await Game.findById(isUser.currentGame);
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

        // Parse and validate chosenTemplate
        const memeTemplates = round.memeTemplates.map((template) => {
            try {
                return JSON.parse(template);
            } catch {
                return template;
            }
        });

        const memeIndex = memeTemplates.indexOf(chosenTemplate);
        if (memeIndex === -1) {
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

        const existingSubmission = round.submissions.find((sub) => sub.userId.toString() === isUser._id);
        if (existingSubmission) {
            return res.status(400).json({ error: "User has already submitted a meme for this round" });
        }

        const newSubmission = {
            userId: isUser._id,
            memeIndex,
            captions,
        };

        round.submissions.push(newSubmission);
        await round.save();

        res.status(200).json({ message: "Meme submitted successfully", submission: newSubmission });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
