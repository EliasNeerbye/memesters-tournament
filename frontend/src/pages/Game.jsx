import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import ChooseMeme from '../components/ChooseMeme';
import EditMeme from '../components/EditMeme';
import Leaderboard from '../components/Leaderboard';
import UserLobby from '../components/UserLobby';
import Voting from '../components/Voting';

const GameStates = {
  CONNECTING: 'connecting',
  WAITING: 'waiting',
  CHOOSING: 'choosing',
  EDITING: 'editing',
  VOTING: 'voting',
  FINISHED: 'finished'
};

const Game = () => {
  const { socket, isConnected } = useSocket();
  const [gameState, setGameState] = useState(GameStates.CONNECTING);
  const [gameData, setGameData] = useState({
    gameId: null,
    players: [],
    host: null,
    currentPlayer: null,
    code: null
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('gameCreated', (data) => {
      setGameData(prev => ({
        ...prev,
        gameId: data.gameId,
        host: data.hostInfo,
        code: data.code
      }));
      setGameState(GameStates.WAITING);
    });

    socket.on('newPlayerJoined', (data) => {
      setGameData(prev => ({
        ...prev,
        players: [...prev.players, data.playerInfo]
      }));
    });

    socket.on('playerLeft', (data) => {
      setGameData(prev => ({
        ...prev,
        players: data.updatedPlayers,
        host: data.host
      }));
    });

    socket.on('gameStarted', (data) => {
      setGameState(GameStates.CHOOSING);
    });

    socket.on('gameFinished', (data) => {
      setGameState(GameStates.FINISHED);
    });

    socket.on('error', (error) => {
      setError(error.message);
    });

    // Update game state when connection is established
    if (isConnected) {
      setGameState(GameStates.WAITING);
    }

    return () => {
      socket.off('gameCreated');
      socket.off('newPlayerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('gameFinished');
      socket.off('error');
    };
  }, [socket, isConnected]);

  const createGame = () => {
    if (socket && isConnected) {
      socket.emit('newGame');
    } else {
      setError('Socket not connected');
    }
  };

  const joinGame = (code) => {
    if (socket && isConnected) {
      socket.emit('joinGame', code);
    } else {
      setError('Socket not connected');
    }
  };

  const leaveGame = () => {
    if (socket && isConnected) {
      socket.emit('leaveGame');
    }
  };

  const startGame = () => {
    if (socket && isConnected && gameData.host?.playerId === gameData.currentPlayer?.id) {
      socket.emit('startGame');
    } else {
      setError('Cannot start game: ' + (!isConnected ? 'Not connected' : 'Not host'));
    }
  };

  const submitMeme = async (chosenTemplate, captions) => {
    try {
      const response = await fetch('/api/games/submit-memes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ chosenTemplate, captions })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit meme');
      }
      
      setGameState(GameStates.VOTING);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderGameState = () => {
    if (!isConnected) {
      return (
        <div className="text-center p-4">
          <p>Connecting to server...</p>
        </div>
      );
    }

    switch (gameState) {
      case GameStates.CONNECTING:
        return (
          <div className="text-center p-4">
            <p>Connecting to server...</p>
          </div>
        );
      
      case GameStates.WAITING:
        return (
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {gameData.players.map(player => (
                <UserLobby
                  key={player.id}
                  userName={player.username}
                  userPicture={player.pfp}
                />
              ))}
            </div>
            {!gameData.gameId && (
              <div className="flex gap-4 justify-center">
                <button
                  onClick={createGame}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Create Game
                </button>
                <button
                  onClick={() => {
                    const code = prompt('Enter game code:');
                    if (code) joinGame(code);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Join Game
                </button>
              </div>
            )}
            {gameData.host?.playerId === gameData.currentPlayer?.id && (
              <button
                onClick={startGame}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Start Game
              </button>
            )}
          </div>
        );
      
      case GameStates.CHOOSING:
        return <ChooseMeme onSubmit={(template) => setGameState(GameStates.EDITING)} />;
      
      case GameStates.EDITING:
        return <EditMeme onSubmit={(captions) => submitMeme(gameData.selectedTemplate, captions)} />;
      
      case GameStates.VOTING:
        return <Voting />;
      
      case GameStates.FINISHED:
        return <Leaderboard />;
      
      default:
        return <div>Unknown game state</div>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right"
          >
            ×
          </button>
        </div>
      )}
      {gameData.code && (
        <div className="mb-4 text-center">
          Game Code: <span className="font-bold">{gameData.code}</span>
        </div>
      )}
      {renderGameState()}
    </div>
  );
};

export default Game;