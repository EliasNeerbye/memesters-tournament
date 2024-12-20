import React from "react";

const GameDesign = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          Meme Game
        </h1>
        <p className="text-gray-600 mt-2">Create, Share, Vote, Win!</p>
      </div>

      {/* Connection Status Bar */}
      <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              } animate-pulse`}
            ></div>
            <span className="font-medium text-gray-700">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="flex space-x-4">
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105
                ${
                  isConnected
                    ? "bg-gray-200 text-gray-500"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              onClick={() => !isConnected && setupSocket()}
              disabled={isConnected}
            >
              Connect
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105
                ${
                  !isConnected
                    ? "bg-gray-200 text-gray-500"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              onClick={() => socket?.close()}
              disabled={!isConnected}
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Game Management Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Game Management
        </h2>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <button
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg
                transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={handleCreateGame}
            >
              Create Game
            </button>
            <div className="flex-1 min-w-[200px] relative">
              <input
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 
    focus:border-transparent transition-all duration-300"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                placeholder="Enter Game Code"
              />
              <button
                className="absolute right-2 top-2 px-3 py-1 bg-indigo-600 text-white rounded-lg
    transform transition-all duration-300 hover:scale-105 hover:bg-indigo-700"
                onClick={() => {
                  navigator.clipboard.writeText(gameCode);
                  logEvent("buttonClick", "Copy Game Code button clicked");
                }}
              >
                Copy
              </button>
            </div>
            <button
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg
                transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={handleJoinGame}
            >
              Join Game
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg
                transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={handleRejoinGame}
            >
              Rejoin Game
            </button>
            <button
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg
                transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={handleLeaveGame}
            >
              Leave Game
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <input
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 
                focus:border-transparent transition-all duration-300"
              value={userToRemove}
              onChange={(e) => setUserToRemove(e.target.value)}
              placeholder="Username to Remove"
            />
            <button
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg
                transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={handleRemoveUser}
            >
              Remove User
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Player List ({players.length})
        </h2>
        {players.length > 0 ? (
          <ul className="space-y-2">
            {players.map((player, index) => (
              <li
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100"
              >
                {player.pfp && (
                  <img
                    src={player.pfp}
                    alt={player.username}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="font-medium text-gray-700">
                  {player.username}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No players have joined yet</p>
        )}
      </div>

      {/* Game Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Game Settings
        </h2>
        <div className="flex flex-wrap gap-4">
          <input
            type="number"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 
              focus:border-transparent transition-all duration-300"
            value={settings.rounds}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, rounds: e.target.value }))
            }
            placeholder="Number of Rounds"
          />
          <input
            type="number"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 
              focus:border-transparent transition-all duration-300"
            value={settings.timeLimit}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, timeLimit: e.target.value }))
            }
            placeholder="Time Limit (seconds)"
          />
          <button
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg
              transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onClick={handleUpdateSettings}
          >
            Update Settings
          </button>
        </div>
      </div>

      {/* Game Flow Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Game Flow
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
              transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onClick={handleStartGame}
          >
            Start Game
          </button>
          <button
            className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg
              transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onClick={handleFinishGame}
          >
            End Game
          </button>
          <button
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg
              transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onClick={handleStartNewRound}
          >
            Next Round
          </button>
        </div>
      </div>

      {/* Gameplay Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Create Your Meme
        </h2>
        <div className="space-y-6">
          <select
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 
              focus:border-transparent transition-all duration-300 appearance-none bg-white"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
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
            <div className="space-y-4 animate-fadeIn">
              {gameState.memeTemplates.find((t) => t.id === selectedTemplate)
                ?.lines > 0 &&
                Array.from({
                  length: gameState.memeTemplates.find(
                    (t) => t.id === selectedTemplate
                  ).lines,
                }).map((_, index) => (
                  <input
                    key={index}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 
                      focus:border-transparent transition-all duration-300"
                    value={captions[index] || ""}
                    onChange={(e) => {
                      const newCaptions = [...captions];
                      newCaptions[index] = e.target.value;
                      setCaptions(newCaptions);
                    }}
                    placeholder={`Caption ${index + 1}`}
                  />
                ))}
              <button
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg
                  transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={handleSubmitMeme}
              >
                Submit Meme
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Voting Section */}
      {gameState.submissions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Vote for Memes
          </h2>
          <div className="space-y-6">
            {gameState.submissions.map((submission, index) => (
              <div
                key={submission.id}
                className="p-4 border border-gray-100 rounded-lg hover:border-purple-200 transition-all duration-300"
              >
                <p className="font-medium text-gray-700">
                  Submission {index + 1}
                </p>
                <p className="text-gray-600">Meme: {submission.memeIndex}</p>
                <p className="text-gray-600 mb-3">
                  Captions: {submission.captions.join(", ")}
                </p>
                <input
                  type="number"
                  min="1"
                  max={gameState.submissions.length}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 
                    focus:border-transparent transition-all duration-300"
                  value={voteRankings[submission.id] || ""}
                  onChange={(e) =>
                    setVoteRankings((prev) => ({
                      ...prev,
                      [submission.id]: e.target.value,
                    }))
                  }
                  placeholder={`Rank (1-${gameState.submissions.length})`}
                />
              </div>
            ))}
            <button
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg
                transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={handleSubmitVote}
            >
              Submit Votes
            </button>
          </div>
        </div>
      )}

      {/* Event Log */}
      <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Event Log</h2>
          <button
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 
              transition-all duration-300"
            onClick={() => setEventLog([])}
          >
            Clear Log
          </button>
        </div>
        <div className="h-64 overflow-y-auto rounded-lg border border-gray-100 p-4 space-y-2">
          {eventLog.map((event, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100"
            >
              <span className="font-medium text-gray-700">
                {event.timestamp} - {event.type}:
              </span>
              <span className="ml-2 text-gray-600">{event.data}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
};


export default GameDesign;