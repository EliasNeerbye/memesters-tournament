const { jwtValidation, isTokenBlacklisted } = require('../../util/auth');
const { getCookieValue } = require('../../util/cookieUtils');

const authMiddleware = async (socket, next) => {
    try {
        const cookies = socket.handshake.headers.cookie || '';
        const token = getCookieValue(cookies, 'auth_token');

        if (!token || token == "") {
            return next(new Error('Authentication error: Token not provided'));
        }

        const isBlackListed = await isTokenBlacklisted(token);
        if (isBlackListed) {
            return next(new Error('Authentication error: Token is outdated / invalid'));
        }

        const decoded = await jwtValidation(token, process.env.JWT_SECRET);
        if (!decoded) {
            return next(new Error('Authentication error: Invalid token'));
        }

        socket.user = {
            id: decoded._id,
            username: decoded.username
        };
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
    }
};

module.exports = authMiddleware;
