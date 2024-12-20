import React, { useEffect, useState } from "react";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/users/profile", {
        method: "GET",
        credentials: "include",
      });

      setIsAuthenticated(response.ok);
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/users/logout", {
        method: "GET",
        credentials: "include", // Important for cookies
      });

      if (response.ok) {
        setIsAuthenticated(false);
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div>
            <div className="min-h-screen bg-gray-900 text-white">
            <nav className="border-b border-gray-800">
              <ul className="flex items-center justify-between px-6 py-4">
                <li>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Memesters</h1>
                </li>
                <li>
                  {isAuthenticated ? (
                    <button onClick={handleLogout} 
                      className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-300">
                      Logout
                    </button>
                  ) : (
                    <a href="/login">
                      <button className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors duration-300">
                        Login
                      </button>
                    </a>
                  )}
                </li>
              </ul>
            </nav>
            <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
              <div className="text-center space-y-8">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  The Memesters' Tournament
                </h1>
                <p className="text-xl text-gray-400">
                  Compete in making the best meme! Chat with your friends!
                </p>
                <div className="mt-8">
                  {isAuthenticated ? (
                    <button 
                      onClick={() => (window.location.href = "/game")}
                      className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-lg font-semibold transition-all duration-300 hover:scale-105"
                    >
                      Go to Game
                    </button>
                  ) : (
                    <button 
                      onClick={() => (window.location.href = "/login")}
                      className="px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-lg font-semibold transition-all duration-300 hover:scale-105"
                    >
                      Log in
                    </button>
                  )}
                </div>
              </div>
            </main>
          </div>
    </div>
  );
}
