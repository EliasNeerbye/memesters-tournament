import React from "react";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/users/profile/username", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
        } else {
          console.log("Failed to fetch username");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);
  return (
    <div class="flex flex-col justify-center items-center mt-20">
      <div id="usernameContainer">
        <h1 class="text-xl">
          {username ? (
            username
          ) : (
            <>
              <div class="flex justify-center flex-row gap-2">
                <div class="w-4 h-4 rounded-full bg-black animate-bounce"></div>
                <div class="w-4 h-4 rounded-full bg-black animate-bounce [animation-delay:-.3s]"></div>
                <div class="w-4 h-4 rounded-full bg-black animate-bounce [animation-delay:-.5s]"></div>
              </div>
            </>
          )}
        </h1>
      </div>
      <img
        class="rounded-lg mt-5"
        src="https://placehold.co/50"
        alt="Profile picture"
        id="profilePicture"
      ></img>
      <div class="flex flex-col justify-center items-center mt-5">
        <ul>
          <li>
            <label htmlFor="setting1">setting1:</label>
            <input type="checkbox" name="setting1" id="setting1"></input>
          </li>
          <li>
            <label htmlFor="setting2">setting2:</label>
            <input type="checkbox" name="setting2" id="setting2"></input>
          </li>
          <li>
            <label htmlFor="setting3">setting3:</label>
            <input type="checkbox" name="setting3" id="setting3"></input>
          </li>
        </ul>
      </div>
      <div class="flex flex-col justify-center items-center mt-5">
        <div class="flex flex-col justify-center items-center">
          <h1>Username</h1>
          <button>edit</button>
        </div>
        <div class="flex flex-col justify-center items-center">
          <h1>Email</h1>
          <button>edit</button>
        </div>
        <div class="flex flex-col justify-center items-center">
          <h1>Password</h1>
          <button>edit</button>
        </div>
      </div>
    </div>
  );
}
