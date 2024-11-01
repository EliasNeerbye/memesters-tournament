const User = require('../models/User');

const startGame = async (req, res) => {
    try {
        res.status(201).json({game:"StartingGame"});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { startGame };
