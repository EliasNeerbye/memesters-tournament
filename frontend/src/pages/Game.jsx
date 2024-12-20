import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const MemeGameApp = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({
    gameId: null,
    currentRound: null,
    memeTemplates: [],
    submissions: [],
  });
  const [eventLog, setEventLog] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [gameCode, setGameCode] = useState("");
  const [userToRemove, setUserToRemove] = useState("");
  const [settings, setSettings] = useState({ rounds: "", timeLimit: "" });
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [captions, setCaptions] = useState([]);
  const [voteRankings, setVoteRankings] = useState({});
  const [players, setPlayers] = useState([]);
  const [roundResults, setRoundResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Helper function to log events
  const logEvent = useCallback((type, data) => {
    const formatMessage = (type, data) => {
      switch (type) {
        case "newPlayerJoined":
          return `${data.username} joined the game`;
        case "playerLeft":
          return `${data.username} left the game`;
        case "playerRemoved":
          return `${data.username} was removed from the game`;
        case "gameStarted":
          return "Game has started!";
        case "gameFinished":
          return "Game finished - Thanks for playing!";
        case "newRound":
          return `Round ${data.roundNumber} started`;
        case "startJudging":
          return "Time to vote for the best memes!";
        default:
          return null; // Don't log other events
      }
    };

    const message = formatMessage(type, data);
    if (!message) return; // Skip if no message

    setEventLog((prev) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      },
      ...prev.slice(0, 9), // Keep only last 10 events
    ]);
  }, []);

  // Socket setup and listeners
  const setupSocket = useCallback(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      logEvent("Connection", "Connected to server");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      logEvent("Connection", "Disconnected from server");
    });

    // Game management events
    newSocket.on("gameCreated", (data) => {
      setGameState((prev) => ({ ...prev, gameId: data.gameId }));
      setGameCode(data.code);
      logEvent("gameCreated", data);
    });

    newSocket.on("newPlayerJoined", (data) =>
      logEvent("newPlayerJoined", data)
    );
    newSocket.on("playerRejoined", (data) => logEvent("playerRejoined", data));
    newSocket.on("playerLeft", (data) => logEvent("playerLeft", data));
    newSocket.on("playerRemoved", (data) => logEvent("playerRemoved", data));

    const updatePlayerList = (newPlayers) => {
      setPlayers(newPlayers);
      logEvent("updatePlayerList", { players: newPlayers });
    };

    // Game state events
    newSocket.on("gameStarted", (data) => {
      setGameState((prev) => ({ ...prev, currentRound: data.currentRound }));
      logEvent("gameStarted", data);
    });

    newSocket.on("roundResults", (data) => {
      setRoundResults(data);
      logEvent("roundResults", `Round ${data.roundNumber} results are in!`);
    });

    newSocket.on("gameFinished", (data) => {
      setLeaderboard(data.leaderboard);
      setRoundResults(data.roundResults);
      logEvent("gameFinished", "Game finished - Thanks for playing!");
    });

    newSocket.on("newRound", (data) => {
      setGameState((prev) => ({
        ...prev,
        currentRound: { ...data, status: "submitting" },
        memeTemplates: data.memes,
      }));
      logEvent("newRound", data);
    });

    newSocket.on("startJudging", (data) => {
      setGameState((prev) => ({
        ...prev,
        currentRound: { ...prev.currentRound, status: "judging" },
        submissions: data.submissions,
      }));
      logEvent("startJudging", data);
    });

    return newSocket;
  }, [logEvent]);

  useEffect(() => {
    const socket = setupSocket();
    return () => socket.close();
  }, [setupSocket]);

  // Fetch meme templates from the server
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/meme-templates");
        const data = await response.json();
        setGameState((prev) => ({ ...prev, memeTemplates: data }));
      } catch (error) {
        console.error("Error fetching meme templates:", error);
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/users/profile", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  // Reset game state
  const resetGameState = () => {
    setGameState({
      gameId: null,
      currentRound: null,
      memeTemplates: [],
      submissions: [],
    });
    setGameCode("");
    setSelectedTemplate("");
    setCaptions([]);
    setVoteRankings({});
    setRoundResults(null);
    setLeaderboard([]);
  };

  // Game management functions
  // ...existing code...
  const handleCreateGame = () => {
    logEvent("buttonClick", "Create Game button clicked");
    logEvent("newGame", "Creating new game");
    socket.emit("newGame", (response) => {
      logEvent("newGame Response", response);
    });
  };

  const handleJoinGame = () => {
    logEvent("buttonClick", "Join Game button clicked");
    socket.emit("joinGame", gameCode, (response) => {
      logEvent("joinGame Response", response);
    });
  };

  const handleRejoinGame = () => {
    logEvent("buttonClick", "Rejoin Game button clicked");
    socket.emit("rejoinGame", (response) => {
      logEvent("rejoinGame Response", response);
    });
  };

  const handleLeaveGame = () => {
    logEvent("buttonClick", "Leave Game button clicked");
    socket.emit("leaveGame", (response) => {
      logEvent("leaveGame Response", response);
      resetGameState();
    });
  };

  const handleRemoveUser = () => {
    logEvent("buttonClick", "Remove User button clicked");
    socket.emit("removeUser", userToRemove, (response) => {
      logEvent("removeUser Response", response);
    });
  };

  const handleUpdateSettings = async () => {
    logEvent("buttonClick", "Update Settings button clicked");
    try {
      const response = await fetch("/api/games/updateSettings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      logEvent("updateSettings Response", data);
    } catch (error) {
      logEvent("updateSettings Error", error);
    }
  };

  const handleStartGame = () => {
    logEvent("buttonClick", "Start Game button clicked");
    socket.emit("startGame", (response) => {
      logEvent("startGame Response", response);
    });
  };

  const handleFinishGame = () => {
    logEvent("buttonClick", "End Game button clicked");
    socket.emit("finishGame", (response) => {
      logEvent("finishGame Response", response);
      resetGameState();
    });
  };

  const handleStartNewRound = () => {
    logEvent("buttonClick", "Next Round button clicked");
    socket.emit("nextRound", (response) => {
      logEvent("nextRound Response", response);
    });
  };

  const handleSubmitMeme = async () => {
    logEvent("buttonClick", "Submit Meme button clicked");
    if (gameState.currentRound.status !== "submitting") {
      logEvent("submitMeme Error", "Game is not in submitting state");
      return;
    }
    try {
      const response = await fetch("/api/games/submit-memes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chosenTemplate: selectedTemplate,
          captions,
        }),
      });
      const data = await response.json();
      logEvent("submitMeme Response", data);
    } catch (error) {
      logEvent("submitMeme Error", error);
    }
  };

  const handleSubmitVote = async () => {
    console.log("buttonClick", "Submit Votes button clicked");

    if (gameState.currentRound.status !== "judging") {
      console.log("submitVote Error", "Game is not in judging state");
      return;
    }

    // Validate that all submissions have unique rankings
    const rankingsArray = Object.values(voteRankings);
    const uniqueRankings = new Set(rankingsArray);
    if (rankingsArray.length !== uniqueRankings.size) {
      console.log(
        "submitVote Error",
        "Each submission must have a unique ranking"
      );
      return;
    }

    // Validate that all submissions are ranked
    if (rankingsArray.length !== gameState.submissions.length) {
      console.log("submitVote Error", "All submissions must be ranked");
      return;
    }

    // Sort by ranking value and get submission IDs in ranked order
    const submissionsRanked = Object.entries(voteRankings)
      .sort(([, a], [, b]) => Number(a) - Number(b))
      .map(([id]) => id);

    try {
      const response = await fetch("/api/games/submit-vote", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionsRanked,
        }),
        credentials: "include", // Add this to ensure cookies are sent
      });

      if (!response.ok) {
        const error = await response.json();
        console.log("submitVote Error", error.error || "Failed to submit vote");
        return;
      }

      const data = await response.json();
      console.log("submitVote Response", data);

      // Clear rankings after successful submission
      setVoteRankings({});
    } catch (error) {
      console.log("submitVote Error", error.message);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "newPlayerJoined":
        return "👋";
      case "playerLeft":
      case "playerRemoved":
        return "🚪";
      case "gameStarted":
        return "🎮";
      case "gameFinished":
        return "🏆";
      case "newRound":
        return "🔄";
      case "startJudging":
        return "⭐";
      default:
        return "📢";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Meme Game
          </h1>
          <p className="text-gray-400">Create, Share, Vote, Win!</p>
        </div>

        {/* Connection Status Bar */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => !isConnected && setupSocket()}
                disabled={isConnected}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors duration-300 disabled:opacity-50"
              >
                Connect
              </button>
              <button
                onClick={() => socket?.close()}
                disabled={!isConnected}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-300 disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Game Management Section */}
        <div className="bg-gray-800 p-6 rounded-lg space-y-4">
          <h2 className="text-2xl font-semibold">Game Management</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <button
                onClick={handleCreateGame}
                className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors duration-300"
              >
                Create Game
              </button>
              <div className="flex space-x-2">
                <input
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value)}
                  placeholder="Enter Game Code"
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(gameCode);
                    logEvent("buttonClick", "Copy Game Code button clicked");
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors duration-300"
                >
                  Copy
                </button>
              </div>
              <button
                onClick={handleJoinGame}
                className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors duration-300"
              >
                Join Game
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleLeaveGame}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-300"
              >
                Leave Game
              </button>
              <div className="flex space-x-2">
                <input
                  value={userToRemove}
                  onChange={(e) => setUserToRemove(e.target.value)}
                  placeholder="Username to Remove"
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleRemoveUser}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-300"
                >
                  Remove User
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Game Flow Controls */}
        <div className="bg-gray-800 p-6 rounded-lg space-y-4">
          <h2 className="text-2xl font-semibold">Game Flow</h2>
          <div className="flex space-x-4">
            <button
              onClick={handleStartGame}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors duration-300"
            >
              Start Game
            </button>
            <button
              onClick={handleFinishGame}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-300"
            >
              End Game
            </button>
            <button
              onClick={handleStartNewRound}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors duration-300"
            >
              Next Round
            </button>
          </div>
        </div>

        {/* Gameplay Section */}
        <div className="bg-gray-800 p-6 rounded-lg space-y-4">
          <h2 className="text-2xl font-semibold">Create Your Meme</h2>
          <div className="space-y-4">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="" disabled>
                Select Meme Template
              </option>
              {gameState.memeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>

            {selectedTemplate && (
              <div className="space-y-4">
                <img
                  src={
                    gameState.memeTemplates.find(
                      (t) => t.id === selectedTemplate
                    )?.imageUrl
                  }
                  alt="Selected Meme Template"
                  className="max-w-md mx-auto rounded-lg"
                />
                {Array.from({
                  length:
                    gameState.memeTemplates.find(
                      (t) => t.id === selectedTemplate
                    )?.lines || 2,
                }).map((_, index) => (
                  <input
                    key={index}
                    value={captions[index] || ""}
                    onChange={(e) => {
                      const newCaptions = [...captions];
                      newCaptions[index] = e.target.value;
                      setCaptions(newCaptions);
                    }}
                    placeholder={`Caption ${index + 1}`}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                ))}
                <button
                  onClick={handleSubmitMeme}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors duration-300"
                >
                  Submit Meme
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Voting Section */}
        {gameState.submissions.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h2 className="text-2xl font-semibold">Vote for Memes</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {gameState.submissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className="p-4 bg-gray-700 rounded-lg space-y-2"
                >
                  <p className="font-semibold">Submission {index + 1}</p>
                  <p className="text-gray-400">Meme: {submission.memeIndex}</p>
                  <p className="text-gray-400">
                    Captions: {submission.captions.join(", ")}
                  </p>
                  <input
                    type="number"
                    min="1"
                    max={gameState.submissions.length}
                    value={voteRankings[submission.id] || ""}
                    onChange={(e) =>
                      setVoteRankings((prev) => ({
                        ...prev,
                        [submission.id]: e.target.value,
                      }))
                    }
                    placeholder={`Rank (1-${gameState.submissions.length})`}
                    className="w-full px-4 py-2 bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ))}
              <button
                onClick={handleSubmitVote}
                className="col-span-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors duration-300"
              >
                Submit Votes
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {(roundResults || leaderboard.length > 0) && (
          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h2 className="text-2xl font-semibold">
              {leaderboard.length > 0 ? "Final Results" : "Round Results"}
            </h2>

            {/* Submissions Results */}
            {roundResults && (
              <div className="space-y-4">
                <h3 className="text-xl text-purple-400">
                  Round {roundResults.roundNumber} Rankings
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {roundResults.submissions.map((submission) => (
                    <div
                      key={submission._id}
                      className="p-4 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold">
                          #{submission.position}
                        </span>
                        <span className="text-green-400">
                          Score:{" "}
                          {
                            roundResults.scores.find(
                              (s) => s.submissionId === submission._id
                            )?.score
                          }
                        </span>
                      </div>
                      <p className="text-gray-300 mt-2">
                        Captions: {submission.captions.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl text-purple-400 mb-4">
                  Final Leaderboard
                </h3>
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        index === 0
                          ? "bg-yellow-500/20"
                          : index === 1
                          ? "bg-gray-400/20"
                          : index === 2
                          ? "bg-amber-700/20"
                          : "bg-gray-700/20"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `#${index + 1}`}
                        </span>
                        <span className="font-semibold">{entry.username}</span>
                      </div>
                      <span className="text-green-400 font-bold">
                        {entry.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event Log */}
        <div className="bg-gray-800 p-6 rounded-lg space-y-4">
          <h2 className="text-2xl font-semibold">Game Feed</h2>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {eventLog.map((event, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-2 bg-gray-700/50 rounded-lg text-sm animate-fade-in"
              >
                <span className="text-xl">{getEventIcon(event.type)}</span>
                <span className="text-gray-400 text-xs">{event.timestamp}</span>
                <span className="text-gray-100">{event.message}</span>
              </div>
            ))}
            {eventLog.length === 0 && (
              <div className="text-center text-gray-500 p-4">
                Game events will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeGameApp;
