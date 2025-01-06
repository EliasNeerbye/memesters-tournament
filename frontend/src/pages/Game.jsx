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
  const [showFAQ, setShowFAQ] = useState(false);
  const backgroundAudio = new Audio("/baroque-summer-loop-244274.mp3");
  const playingAudio = new Audio("/happy-pop-2-185287.mp3");
  const winningAudio = new Audio("/you-win-sequence-2-183949.mp3");



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
      setTimeout(() => {        
        backgroundAudio.volume = 0.025;
        backgroundAudio.loop = true;
        backgroundAudio.play();
      }, 1000);
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
      setGameState((prev) => ({
        ...prev,
        currentRound: { ...prev.currentRound, status: "results" },
      }));
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
      // Clear inputs on new round
      setSelectedTemplate("");
      setCaptions([]);
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

  useEffect(() => {
    const handleUnload = () => {
      if (socket && isConnected) {
        socket.emit("leaveGame");
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [socket, isConnected]);

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
    if (gameState.currentRound.status !== "judging") {
      return;
    }

    // Validate that all submissions have unique rankings
    const rankingsArray = Object.values(voteRankings);
    const uniqueRankings = new Set(rankingsArray);
    if (rankingsArray.length !== uniqueRankings.size) {
      return;
    }

    // Validate that all submissions are ranked
    if (rankingsArray.length !== gameState.submissions.length) {
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

        {/* Game Status */}
        {gameState.currentRound && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              {/* Game Status */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-purple-400">Game Status</h3>
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-gray-400">Players:</span>{" "}
                    <span className="font-medium">{players.length+1}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Round:</span>{" "}
                    <span className="font-medium">
                      {gameState.currentRound?.roundNumber || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>{" "}
                    <span className="font-medium capitalize">
                      {gameState.currentRound?.status || "waiting"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Game Progress */}
              <div className="flex items-center space-x-2">
                {["Share", "Vote", "Results"].map((stage, index) => (
                  <React.Fragment key={stage}>
                    <div
                      className={`px-3 py-1 rounded ${
                        (gameState.currentRound?.status === "submitting" && stage === "Share") ||
                        (gameState.currentRound?.status === "judging" && stage === "Vote") ||
                        (gameState.currentRound?.status === "results" && stage === "Results")
                          ? "bg-purple-500 text-white"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {stage}
                    </div>
                    {index < 2 && (
                      <div className="w-4 h-px bg-gray-600"/>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game Management Section */}
        {!gameState.currentRound && (
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
        )}

        {/* Game Flow Controls */}
        <div className="bg-gray-800 p-6 rounded-lg space-y-4">
          <h2 className="text-2xl font-semibold">Game Flow</h2>
          <div className="flex space-x-4">
            {!gameState.currentRound && (
              <button
                onClick={handleStartGame}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors duration-300"
              >
                Start Game
              </button>
            )}

            <button
              onClick={handleFinishGame}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-300"
            >
              End Game
            </button>

            {gameState.currentRound?.status === "results" && (
              <button
                onClick={handleStartNewRound}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors duration-300"
              >
                Next Round
              </button>
            )}
          </div>
        </div>

        {/* Gameplay Section */}
        {gameState.currentRound?.status === "submitting" && (
          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h2 className="text-2xl font-semibold">Create Your Meme</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gameState.memeTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                      selectedTemplate === template.id
                        ? "ring-4 ring-purple-500 scale-105"
                        : "hover:ring-2 hover:ring-purple-400 hover:scale-105"
                    }`}
                  >
                    <img
                      src={template.imageUrl}
                      alt={template.name}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                      <p className="text-sm text-white text-center truncate">
                        {template.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTemplate && (
                <div className="space-y-4">
                  {/* Generate meme URL dynamically based on captions */}
                  <img
                    src={`https://api.memegen.link/images/${selectedTemplate}/${captions
                      .slice(0, gameState.memeTemplates.find(t => t.id === selectedTemplate)?.lines || 2)
                      .map(caption => encodeURIComponent(caption || "_"))
                      .join("/")}.png`}
                    alt="Generated Meme"
                    className="max-w-md mx-auto rounded-lg"
                  />
                  
                  {/* Generate caption inputs based on the template's line count */}
                  {Array.from({
                    length:
                      gameState.memeTemplates.find((t) => t.id === selectedTemplate)
                        ?.lines || 2,
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
        )}



        {/* Voting Section */}
        {gameState.currentRound?.status === "judging" &&
          gameState.submissions.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-lg space-y-4">
              <h2 className="text-2xl font-semibold">Vote for Memes</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {gameState.submissions.map((submission, index) => {
                  const extension = submission.memeIndex.split(".")[3];
                  const path = submission.memeIndex.split(".")[2];
                  const template = path.split("/")[2];
                  return (
                    <div
                      key={submission.id}
                      className="p-4 bg-gray-700 rounded-lg space-y-4"
                    >
                      <div className="space-y-2">
                        <p className="font-semibold">Submission {index + 1}</p>
                        <img
                          src={`https://api.memegen.link/images/${template}/${submission.captions
                            .map((caption) => encodeURIComponent(caption || "_"))
                            .join("/")}.${extension}`}
                          alt={`Submission ${index + 1}`}
                          className="w-full rounded-lg"
                        />

                      </div>
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
                  );
                })}
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
        {(gameState.currentRound?.status === "results" ||
          leaderboard.length > 0) && (
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
                  {roundResults.submissions.map((submission, index) => {
                    console.log("submission: ", submission);
                    const extension = submission.memeUrl.split(".")[3];
                    const path = submission.memeUrl.split(".")[2];
                    console.log("path: ", path);
                    const template = path.split("/")[2];;
                    return (
                      <div
                        key={submission._id}
                        className="p-4 bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold">
                            #{submission.position}
                          </span>
                          <span className="text-green-400">
                            Score: {roundResults.scores.find(
                              (s) => s.submissionId === submission.id
                            )?.score}
                          </span>
                        </div>
                        <img
                          src={`https://api.memegen.link/images/${template}/${submission.captions.map(caption => encodeURIComponent(caption || "_")).join("/")}.${extension}`}
                          alt={`Meme ${submission.position}`}
                          className="w-full rounded-lg mt-2"
                        />
                        <p className="text-gray-300 mt-2">
                          Captions: {submission.captions.join(", ")}
                        </p>
                      </div>
                    );
                  })}
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
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowFAQ(true)}
          className="bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
          title="Help & FAQ"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {showFAQ && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-purple-400">
                  Help & FAQ
                </h2>
                <button
                  onClick={() => setShowFAQ(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-300">
                  <strong>Common Issues</strong>
                  <br />
                  <p>
                    If you are unable to join or create a game try pressing
                    leave and then join or create
                  </p>
                  <p></p>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemeGameApp;
