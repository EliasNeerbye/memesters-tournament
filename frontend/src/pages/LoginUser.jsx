export default function LandingPage() {
    return (
        <div class="flex flex-col justify-center items-center mt-40">
            <h1>Login</h1>
            <form class="flex justify-center items-center flex-col w-full">
                <input class="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white" type="email" placeholder="Email" />            
                <input class="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white" type="password" placeholder="Password" />
                <input class="bg-secondaryColor text-white rounded-lg p-4 mt-5 text-center" type="submit"  value="Log in" />
            </form>
            <p class="text-center text-xs mt-10">Don't have an account? <a class="text-white underline" href="/CreateUser">Register here</a></p>
        </div>
    );
}
