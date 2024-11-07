export default function LandingPage() {
  return (
    <div>
      <nav>
        <ul class="flex justify-between items-center m-5">
          <li>
            <img
              class="rounded-full"
              src="https://placehold.co/50"
              alt="Profile picture"
            />
          </li>
          <li>
            <h1 class="text-2xl">Memesters</h1>
          </li>
          <li>
            <a href="/login">
              <button class="bg-secondaryColor text-black drop-shadow-2xl rounded-md pl-4 pr-4 py-1">
                Login
              </button>
            </a>{" "}
          </li>
        </ul>
      </nav>
      <main>
        <div class="flex flex-col justify-center items-center text-center mt-20 mx-20">
          <h1 class="text-lg font-bold">The Memesters’ tournament</h1>
          <p class="text-xs mt-4">
            Compete in making the best meme! Chat with your friends!
          </p>
        </div>
        <div class="flex flex-col justify-center items-center text-center mt-20">
          <form class="flex flex-col justify-center w-1/2" action="">
            <input
              class="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white"
              type="text"
              placeholder="party code..."
            />
            <div class="flex flex-col justify-center items-center w-full mt-5">
            <button class="flex justify-center w-1/3">Join</button>
            <button class="flex justify-center w-1/3">Make lobby</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
