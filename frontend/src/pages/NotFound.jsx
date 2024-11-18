import React from "react";
import { useState, useEffect } from "react";

const NotFound = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 flex items-center justify-center p-4">
      <div className={`text-center transform ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      } transition-all duration-700`}>
        <div className="relative">
          <h1 className="text-[12rem] font-black text-white mb-4 animate-pulse font-mono tracking-tighter">
            4
            <span className="inline-block animate-bounce text-purple-400">0</span>
            4
          </h1>
          
          {/* Glitch effect background text */}
          <h1 className="absolute -top-2 left-0 right-0 text-[12rem] font-black text-purple-500/30 mb-4 font-mono tracking-tighter blur-sm">
            404
          </h1>
        </div>
        
        <div className={`space-y-4 transform ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        } transition-all duration-700 delay-300`}>
          <div className="relative">
            <p className="text-gray-300 text-2xl mb-8 font-mono tracking-wide">
              ERROR: PAGE_NOT_FOUND
            </p>
            <p className="text-gray-400 text-lg mb-12 font-mono">
              The page you're looking for has been lost in the matrix...
            </p>
          </div>
          
          <a
            href="/"
            className="inline-flex items-center px-8 py-4 text-lg font-mono text-white bg-purple-600 rounded-lg 
            hover:bg-purple-500 transition-all duration-300 hover:scale-105 transform active:scale-95
            hover:shadow-lg hover:shadow-purple-500/30 border border-purple-400/30"
          >
            <svg 
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            RETURN_HOME
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;