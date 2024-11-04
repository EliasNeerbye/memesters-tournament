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
            <button class="bg-secondaryColor text-black drop-shadow-2xl rounded-md pl-4 pr-4 py-1">Login</button>
          </li>
        </ul>
      </nav>
      <main>
        <div class="flex flex-col justify-center items-center text-center mt-20 mx-20">
          <h1 class="text-lg font-bold">The Memesters’ tournament</h1>
          <p class="text-xs mt-4">Compete in making the best meme!
          Chat with your friends!</p>
        </div>
        <div class="flex flex-col justify-center items-center text-center mt-20">
          <form action="">
            <input type="number" placeholder="party code..." class="bg-secondaryColor text-center text-black"/>
            <button class=""></button>
            <button class=""></button>
          </form>
        </div>
      </main>
    </div>
  );
}