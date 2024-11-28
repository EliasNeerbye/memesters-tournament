import React, { useState, useEffect } from "react";
import io from "socket.io-client";

export const PlayersList = () => {
  const [socket, setSocket] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_BACKEND_URL); // Correct environment variable usage
    setSocket(newSocket);  // Set the socket reference to newSocket
    return () => newSocket.close();  // Close the socket connection on cleanup
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("gameCreated", (data) => {
        console.log("Game created:", data);
        setGameInfo(data);
      });
    }
  }, [socket]);

  const handleCreateGame = () => {
    if (socket) {
      socket.emit('newGame');
    }
  };

  return (
    <div>
      <button onClick={handleCreateGame}>Create New Game</button>
      {gameInfo && (
        <div>
          <h2>Game Created!</h2>
          <p>Game ID: {gameInfo.gameId}</p>
          <p>Host: {gameInfo.hostInfo.playerName}</p>
          <p>Game Code: {gameInfo.code}</p>
        </div>
      )}
    </div>
  );
};
