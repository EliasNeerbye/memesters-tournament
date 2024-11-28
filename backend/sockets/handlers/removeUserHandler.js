const User = require('../../models/User');
const Game = require('../../models/Game');
const { verifyUser } = require('../../util/userUtils');

const removeUserHandler = (io, socket, activeGames) => async (usernameToRemove) => {
    try {
        const owner = await verifyUser(socket);
        if (!owner) {
            socket.emit("error", { message: "Authentication required" });
            return;
        }

        // Find the game where the owner is currently playing
        const game = await Game.findOne({ "players.userId": owner._id }).populate("players.userId", "username pfp roles");
        if (!game) {
            socket.emit("error", { message: "Game not found" });
            return;
        }

        // Ensure the user trying to remove is the host
        if (game.hostUserId.toString() !== owner._id.toString()) {
            socket.emit("error", { message: "Only the game host can remove users" });
            return;
        }

        // Find the player to remove by username instead of userId
        const userToRemove = game.players.find((player) => player.userId.username === usernameToRemove);
        if (!userToRemove) {
            socket.emit("error", { message: "User not found in game" });
            return;
        }

        // Remove the player from the game
        game.players = game.players.filter((player) => player.userId.username !== usernameToRemove);
        await game.save();

        // Unset the current game reference for the user
        await User.updateOne({ _id: userToRemove.userId._id }, { $unset: { currentGame: 1 } });

        // Update the active games map if the game is still active
        const activeGame = activeGames.get(game._id.toString());
        if (activeGame) {
            activeGame.sockets.delete(userToRemove.socketId);
            activeGame.game = game;
        }

        const removedPlayerInfo = {
            username: userToRemove.userId.username,
            pfp: userToRemove.userId.pfp,
        };

        // Notify all other players that the player was removed
        socket.to(game._id.toString()).emit("playerRemoved", {
            removedPlayer: removedPlayerInfo,
            removedBy: {
                username: owner.username,
            },
            updatedPlayers: game.players.map((p) => ({
                username: p.userId.username,
                pfp: p.userId.pfp,
            })),
        });

        // Notify the removed player
        io.to(userToRemove.socketId).emit("youWereRemoved", {
            gameId: game._id,
            removedBy: {
                username: owner.username,
            },
        });

        // Disconnect the removed player from the game room
        const removedSocket = io.sockets.sockets.get(userToRemove.socketId);
        if (removedSocket) {
            removedSocket.leave(game._id.toString());
        }
    } catch (error) {
        console.error("Remove user error:", error);
        socket.emit("error", { message: "Internal server error" });
    }
};

module.exports = removeUserHandler;