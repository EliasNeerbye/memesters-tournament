import React from "react";

function ChooseMeme() {
  const amountOfMemes = 6;

  return (
    <div>
      <h1>Choose Meme</h1>
      <div className="flex flex-col justify-center items-center mt-5">
        <div className="flex justify-center items-center">
          <img
            className="rounded-lg"
            src="https://placehold.co/600x400"
            alt="Meme"
          ></img>
        </div>
        <div className="flex justify-center items-center">
          <img
            className="rounded-lg"
            src="https://placehold.co/600x400"
            alt="Meme"
          ></img>
        </div>
        {[...Array(amountOfMemes - 2)].map((_, index) => (
          <div className="flex justify-center items-center">
            {/* Add a random image here */}
            <img
              className="rounded-lg"
              src="https://placehold.co/600x400"
              alt="Meme"
            ></img>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChooseMeme;
