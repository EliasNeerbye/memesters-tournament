import React, { useState, useEffect } from 'react';
import socketService from '../services/socketService';

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);

  useEffect(() => {
    const socket = socketService.connect();

    socketService.setupGameEventListeners({
      onPlayerJoined: (data) => setPlayers(data.players),
      onPlayerRejoined: (data) => setPlayers(data.players),
      onPlayerLeft: (data) => setPlayers(data.updatedPlayers),
      onPlayerRemoved: (data) => setPlayers(data.updatedPlayers),
      onGameStarted: (data) => setPlayers(data.players),
      onGameFinished: () => {
        setGameInfo(null);
        setPlayers([]);
      },
      onNewRound: () => {},
      onGameCreated: (data) => {
        setGameInfo(data);
        setPlayers([data.hostInfo]);
      },
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleCreateGame = () => {
    setError(null);

    socketService.createGame(
      (data) => {
        setGameInfo(data);
        setPlayers([data.hostInfo]);
      },
      (error) => {
        setError(error.message || 'Failed to create game');
        setGameInfo(null);
        setPlayers([]);
      }
    );
  };

  const handleLeaveGame = () => {
    socketService.leaveGame(() => {
      setGameInfo(null);
      setPlayers([]);
    });
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', padding: '10px', maxWidth: '600px' }}>
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={handleCreateGame}
          style={{
            padding: '10px 15px',
            marginRight: '10px',
            backgroundColor: '#007BFF',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Create New Game
        </button>
        {error && error.includes('already host') && (
          <button
            onClick={handleLeaveGame}
            style={{
              padding: '10px 15px',
              backgroundColor: '#FF4136',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Leave Current Game
          </button>
        )}
      </div>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      {gameInfo && (
        <div
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            marginBottom: '10px',
            backgroundColor: 'black',
          }}
        >
          <h2 style={{ margin: '0 0 10px' }}>Game Created!</h2>
          <div>
            <p>
              <strong>Game ID:</strong> {gameInfo.gameId}
            </p>
            <p>
              <strong>Host:</strong> {gameInfo.hostInfo.playerName}
            </p>
            <p>
              <strong>Game Code:</strong> {gameInfo.code}
            </p>
          </div>
        </div>
      )}
      {players.length > 0 && (
        <div
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            backgroundColor: 'black',
          }}
        >
          <h3 style={{ margin: '0 0 10px' }}>Players</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {players.map((player, index) => (
              <li
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '5px 0',
                  borderBottom: '1px solid #ddd',
                }}
              >
                {player.pfp ? (
                  <img
                    src={player.pfp}
                    alt={player.username || player.playerName}
                    style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                  />
                ) : (
                  <span style={{ marginRight: '10px' }}>No Profile Picture</span>
                )}
                <span>{player.username || player.playerName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlayerList;
