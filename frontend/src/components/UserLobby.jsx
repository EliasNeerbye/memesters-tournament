import React from "react";

export default function UserLobby() {
    const userPicture = "https://placehold.co/50";
    const userName = "Lisan Al Gaib";

    return (
        <div className="flex justify-between items-center flex-row py-3 border-b border-gray-200 last:border-b-0">
            <div className="flex items-center">
                <img className="rounded-full w-12 h-12 mr-4 border-2 border-[#516BAE]" src={userPicture} alt="Profile picture" />
                <h1 className="text-lg font-medium text-gray-800">{userName}</h1>
            </div>
            <button className="ml-5 mt-0" >Leave/Kick</button>
        </div>
    );
}