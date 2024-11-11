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
            const isBlackList = await isTokenBlacklisted(token);
            if (isBlackList) {
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
    });

    io.on('connection', (socket) => {
        const verifyUser = async () => {
            try {
                const player = await User.findById(socket.user.id);
                if (!player) {
                    socket.emit('error', { message: 'Player not found' });
                    return null;
                }
                return player;
            } catch (error) {
                console.error('User verification error:', error);
                socket.emit('error', { message: 'Error verifying user' });
                return null;
            }
        };

        socket.on('newGame', async () => {
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

                newGame.players.push({
                    userId: player._id,
                    socketId: socket.id
                });

                await newGame.save();
                
                await User.updateOne(
                    { _id: player._id },
                    { currentGame: newGame._id }
                );

                if (!activeGames.has(newGame._id.toString())) {
                    activeGames.set(newGame._id.toString(), {
                        game: newGame,
                        sockets: new Set([socket.id])
                    });
                } else {
                    console.warn(`Game ${newGame._id} already exists in activeGames`);
                    activeGames.get(newGame._id.toString()).sockets.add(socket.id);
                }

                socket.emit('gameCreated', {
                    gameId: newGame._id,
                    hostId: player._id,
                    code: newGame.code
                });

                socket.join(newGame._id.toString());
                
            } catch (error) {
                console.error('New game error:', error);
                socket.emit('error', { message: 'Internal server error' });
            }
        });

        socket.on('joinGame', async (code) => {
            try {
                const player = await verifyUser();
                if (!player) return;

                const gameCheckResult = await checkExistingGame(player);
                if (gameCheckResult.error) {
                    socket.emit('error', { message: gameCheckResult.error });
                    return;
                }
                
                const game = await Game.findOne({code});
                if(!game){
                    socket.emit('error', {message: "Game not found!"});
                    return;
                }

                if (game.isFull()){
                    socket.emit('error', {message: "Game is full!"});
                    return;
                }

                game.players.push({ userId: player._id, socketId: socket.id });
                await game.save();

                await User.updateOne({ _id: player._id }, { currentGame: game._id });

                if (!activeGames.has(game._id.toString())) {
                    console.warn(`Game ${game._id} not found in activeGames, creating new entry`);
                    activeGames.set(game._id.toString(), {
                        game: game,
                        sockets: new Set([socket.id])
                    });
                } else {
                    activeGames.get(game._id.toString()).sockets.add(socket.id);
                }

                socket.emit('gameJoined', { gameId: game._id, playerId: player._id });

                socket.join(game._id.toString());

                socket.to(game._id.toString()).emit('newPlayerJoined', { playerId: player._id });
            } catch (error) {
                console.error('Join game error:', error);
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
    });
};

module.exports = GameSocket;