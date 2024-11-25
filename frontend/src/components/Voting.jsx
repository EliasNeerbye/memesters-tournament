import React from 'react';

function Voting() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Voting</h1>
      <main className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="border rounded-lg p-2 bg-gray-100 shadow-md flex flex-col items-center"
          >
            <img
              src="https://placehold.co/600x400"
              alt={`Meme ${index + 1}`}
              className="rounded-md mb-4"
            />
            <div id="votingButtons" className="flex justify-between w-full">
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Upvote
              </button>
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Downvote
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default Voting;
