import React from "react";
import { useState, useEffect } from 'react';

const scrambleLetters = "!@#$%^&*()_+-=[]{}|;:,.<>?/abcdefghijklmnopqrstuvwxyz";

export default function NotFound() {
  const [scrambledText, setScrambledText] = useState("404");
  const originalText = "404 - Page Not Found";
  const message = "Oops! Looks like hackers have taken this page hostage 👾🔒";

  useEffect(() => {
    let interval;
    let currentIndex = 0;
    let finalText = "";

    const startScrambling = () => {
      interval = setInterval(() => {
        finalText = originalText.split('').map((char, idx) => {
          if (idx < currentIndex) return char;
          return scrambleLetters[Math.floor(Math.random() * scrambleLetters.length)];
        }).join('');
        
        setScrambledText(finalText);
        
        if (currentIndex >= originalText.length) {
          clearInterval(interval);
        }
        currentIndex += 1/2;
      }, 50);
    };

    startScrambling();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-6xl font-mono mb-4 font-bold tracking-wider">
        {scrambledText}
      </h1>
      <p className="text-xl text-gray-400 mt-4">
        {message}
      </p>
      <a 
        href="/"
        className="mt-8 px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Take Me Back to Safety
      </a>
    </div>
  );
}
