const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token for the given user ID.
 * @param {string} userId - The ID of the user for whom the token is generated.
 * @param {string} [username] - Optional: Username of the user.
 * @returns {string} - The signed JWT token.
 */
const generateToken = (userId, username = '') => {
    return jwt.sign(
        { id: userId, username },  // Payload with user data
        process.env.JWT_SECRET,    // Secret key from .env file
        { expiresIn: '1h' }        // Token expiration time (1 hour)
    );
};

module.exports = generateToken;
