const User = require('../../models/User');
const Game = require('../../models/Game');
const Round = require('../../models/Round');

const startGameHandler = (io, socket, activeGames) => async () => {
    // Double check everything
    // Get game settings
    // Set game state
    // Send game state to client
    // Other things that might be needed?
}

module.exports = startGameHandler;