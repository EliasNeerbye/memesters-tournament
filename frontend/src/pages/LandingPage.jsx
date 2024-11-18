import React, { useEffect, useState } from 'react';

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        credentials: 'include',
      });
      
      setIsAuthenticated(response.ok);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/users/logout', {
        method: 'GET',
        credentials: 'include', // Important for cookies
      });

      if (response.ok) {
        setIsAuthenticated(false);
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div>
      <nav>
        <ul className="flex justify-between items-center m-5">
          <li>
            <img
              className="rounded-full"
              src="https://placehold.co/50"
              alt="Profile picture"
            />
          </li>
          <li>
            <h1 className="text-2xl">Memesters</h1>
          </li>
          <li>
            {isAuthenticated ? (
              <button 
                onClick={handleLogout}
                className="bg-secondaryColor text-black drop-shadow-2xl rounded-md pl-4 pr-4 py-1"
              >
                Logout
              </button>
            ) : (
              <a href="/login">
                <button className="bg-secondaryColor text-black drop-shadow-2xl rounded-md pl-4 pr-4 py-1">
                  Login
                </button>
              </a>
            )}
          </li>
        </ul>
      </nav>
      <main>
        <div className="flex flex-col justify-center items-center text-center mt-20 mx-20">
          <h1 className="text-lg font-bold">The Memesters' tournament</h1>
          <p className="text-xs mt-4">
            Compete in making the best meme! Chat with your friends!
          </p>
        </div>
        <div className="flex flex-col justify-center items-center text-center mt-20">
          <form className="flex flex-col justify-center w-1/2" action="">
            <input
              className="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white"
              type="text"
              placeholder="party code..."
            />
            <div className="flex flex-col justify-center items-center w-full mt-5">
              <button className="flex justify-center w-1/3">Join</button>
              <button className="flex justify-center w-1/3">Make lobby</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}