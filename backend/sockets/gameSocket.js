const { jwtValidation, isTokenBlacklisted } = require('../util/auth');
const User = require('../models/User');
const Round = require('../models/Round');
const Game = require('../models/Game');

const GameSocket = (io) => {
    const activeGames = new Map();

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            
            if (!token) {
                return next(new Error('Authentication error: Token not provided'));
            }
            
            if (isTokenBlacklisted(token)) {
                return next(new Error('Authentication error: Token is outdated / invalid'));
            }
            
            const decoded = await jwtValidation(token);
            if (!decoded) {
                return next(new Error('Authentication error: Invalid token'));
            }
            
            socket.user = {
                id: decoded.id,
                username: decoded.username
            };
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    const verifyUser = async () => {
        const player = await User.findById(socket.user.id);
        if (!player) {
            socket.emit('error', { message: 'Player not found' });
            return null;
        }
        return player;
    };

    socket.on('newGame', async (data) => {
        try {
            const player = await verifyUser();
            if (!player) return;

            const gameCheckResult = await checkExistingGame(player);
            if (gameCheckResult.error) {
                socket.emit('error', { message: gameCheckResult.error });
                return;
            }

            const newGame = new Game({
                hostUserId: player._id,
            });

            // Add the player with their socket ID
            newGame.players.push({
                userId: player._id,
                socketId: socket.id
            });

            await newGame.save();
            
            // Update player's current game
            await User.updateOne(
                { _id: player._id },
                { currentGame: newGame._id }
            );

            // Add game to active games map
            activeGames.set(newGame._id.toString(), {
                game: newGame,
                sockets: new Set([socket.id])
            });

            // Emit success event
            socket.emit('gameCreated', {
                gameId: newGame._id,
                hostId: player._id
            });

            // Join socket room for this game
            socket.join(newGame._id.toString());
            
        } catch (error) {
            console.error('New game error:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    });

    async function checkExistingGame(player) {
        if (!player.currentGame) {
            return { error: null };
        }

        const game = await Game.findOne({
            _id: player.currentGame,
            state: { $in: ['waiting', 'playing'] }
        });

        if (!game) {
            // Clear stale game reference
            await User.updateOne(
                { _id: player._id },
                { $unset: { currentGame: 1 } }
            );
            return { error: null };
        }

        if (game.hostUserId.equals(player._id)) {
            return { error: 'Player already host of a game!' };
        }

        return { error: 'Player already in a game!' };
    }

    // Add disconnect handler
    socket.on('disconnect', async () => {
        try {
            const player = await User.findById(socket.user.id);
            if (player?.currentGame) {
            const gameId = player.currentGame.toString();
            const activeGame = activeGames.get(gameId);
            
            if (activeGame) {
                activeGame.sockets.delete(socket.id);
                if (activeGame.sockets.size === 0) {
                    activeGames.delete(gameId);
                }
            }
            }
        } catch (error) {
            console.error('Disconnect handler error:', error);
        }
        });
    });
};

module.exports = GameSocket;