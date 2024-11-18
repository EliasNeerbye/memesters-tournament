import React from "react";
import UserLobby from "../components/UserLobby";
import { useState, useEffect } from "react";

export default function LobbyPage() {
    const code = "123456";

  return (
    <div className="flex flex-col justify-center items-center mt-20 width-full">
      <div className="mb-10">
        {/* MAKE "CODE" REFLECT ACTUAL SERVER CODE */}
        <h1>{code}</h1>
      </div>

      <div className="width-full" id="host">
        <div className="flex justify-evenly items-center flex-row mb-20">
          <img
            className="rounded-lg"
            src="https://placehold.co/50"
            alt="Profile picture"
          />
          <h1>Lisan Al Gaib</h1>
        </div>
        <div className="flex justify-evenly items-center flex-row ">
          <button className="m-5">Start/Vote</button>
          <button className="m-5">Leave</button>
        </div>
      </div>
      <main>
        <UserLobby />
        <UserLobby />
        <UserLobby />
        <UserLobby />
        <UserLobby />
        <UserLobby />
        <UserLobby />
        <UserLobby />
        <UserLobby />
        <UserLobby />
      </main>
    </div>
  );
}
