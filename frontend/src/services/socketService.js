// SocketService handles all socket-related operations.
// It provides an interface for:
// * Initializing the socket connection
// * Creating and joining games
// * Hosting games (adding/removing players, starting/finishing games, etc.)
// * Setting up event listeners for game events
// * Removing event listeners when no longer needed
// * Disconnecting from the socket
// * Checking if the socket is connected

import io from 'socket.io-client';

class SocketService {
  // Constructor initializes the socket instance and the event handler Map
  constructor() {
    this.socket = null;
    this.gameEventHandlers = new Map();
  }

  // Initialize the socket connection
  connect() {
    if (!this.socket) {
      // Set up the connection options
      const options = {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      };

      // Connect to the backend
      this.socket = io(process.env.BACKEND, options);

      // Set up the base event handlers
      this.setupBaseHandlers();
    }
    return this.socket;
  }

  // Set up basic event handlers for connection and reconnection
  setupBaseHandlers() {
    // Handle connection
    this.socket.on('connect', () => {
      console.log('Connected to game server');
    });

    // Handle connection errors
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Handle socket errors
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

// Game Creation and Joining
createGame(callback, errorCallback) {
  // Send the newGame event to the server
  this.socket.emit('newGame');
  
  // Handle successful game creation
  this.socket.once('gameCreated', (gameData) => {
    console.log('Game created:', gameData); // Log the game data to the console
    callback(gameData);
  });

  // Handle potential errors
  this.socket.once('error', (error) => {
    if (errorCallback) {
      errorCallback(error);
    }
  });
}
  joinGame(code, callback) {
    // Send the joinGame event to the server
    this.socket.emit('joinGame', code);
    // Handle successful joining
    this.socket.once('newPlayerJoined', (gameData) => {
      callback(gameData);
    });
  }

  rejoinGame(callback) {
    // Send the rejoinGame event to the server
    this.socket.emit('rejoinGame');
    // Handle successful rejoining
    this.socket.once('playerRejoined', (gameData) => {
      callback(gameData);
    });
  }

  leaveGame(callback) {
    // Send the leaveGame event to the server
    this.socket.emit('leaveGame');
    // Handle successful leaving
    this.socket.once('playerLeft', (gameData) => {
      callback(gameData);
    });
  }

  // Game Host Controls
  removePlayer(username, callback) {
    // Send the removeUser event to the server
    this.socket.emit('removeUser', username);
    // Handle successful removal
    this.socket.once('playerRemoved', (data) => {
      callback(data);
    });
  }

  startGame(callback) {
    // Send the startGame event to the server
    this.socket.emit('startGame');
    // Handle successful game start
    this.socket.once('gameStarted', (gameData) => {
      callback(gameData);
    });
  }

  finishGame(callback) {
    // Send the finishGame event to the server
    this.socket.emit('finishGame');
    // Handle successful game finish
    this.socket.once('gameFinished', (finalState) => {
      callback(finalState);
    });
  }

  startNewRound(callback) {
    // Send the nextRound event to the server
    this.socket.emit('nextRound');
    // Handle successful start of new round
    this.socket.once('newRound', (roundData) => {
      callback(roundData);
    });
  }

  // Event Listeners Setup
  setupGameEventListeners({
    onPlayerJoined,
    onPlayerRejoined,
    onPlayerLeft,
    onPlayerRemoved,
    onGameStarted,
    onGameFinished,
    onNewRound,
  }) {
    // Clear any existing handlers
    this.removeAllGameEventListeners();

    // Store new handlers in the Map for later cleanup
    this.gameEventHandlers.set('newPlayerJoined', onPlayerJoined);
    this.gameEventHandlers.set('playerRejoined', onPlayerRejoined);
    this.gameEventHandlers.set('playerLeft', onPlayerLeft);
    this.gameEventHandlers.set('playerRemoved', onPlayerRemoved);
    this.gameEventHandlers.set('gameStarted', onGameStarted);
    this.gameEventHandlers.set('gameFinished', onGameFinished);
    this.gameEventHandlers.set('newRound', onNewRound);

    // Set up new listeners
    this.socket.on('newPlayerJoined', onPlayerJoined);
    this.socket.on('playerRejoined', onPlayerRejoined);
    this.socket.on('playerLeft', onPlayerLeft);
    this.socket.on('playerRemoved', onPlayerRemoved);
    this.socket.on('gameStarted', onGameStarted);
    this.socket.on('gameFinished', onGameFinished);
    this.socket.on('newRound', onNewRound);
  }

  // Cleanup event listeners
  removeAllGameEventListeners() {
    if (this.socket) {
      this.gameEventHandlers.forEach((handler, event) => {
        this.socket.off(event, handler);
      });
      this.gameEventHandlers.clear();
    }
  }

  // Disconnect from the socket
  disconnect() {
    if (this.socket) {
      this.removeAllGameEventListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check if the socket is connected
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Create and export a singleton instance
const socketService = new SocketService();
export default socketService;
