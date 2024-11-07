export default function ProfilePage() {
    return (
        <div class="flex flex-col justify-center items-center mt-20">
            <div id="usernameContainer">
                <h1 class="text-xl">Username</h1>
            </div>
            <img class="rounded-lg mt-5" src="https://placehold.co/50" alt="Profile picture" id="profilePicture"></img>
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
    )
}