export default function LandingPage() {
    return (
        <div class="flex flex-col justify-center items-center mt-40">
            <h1>Register a user</h1>
            <form class="flex justify-center items-center flex-col w-full">
                <input class="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white" type="text" placeholder="Username" />            
                <input class="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white" type="email" placeholder="Email" />            
                <input class="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white" type="password" placeholder="Password" />
                <input class="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white" type="password" placeholder="Repeat Password" /> 
                <input class="bg-secondaryColor text-white rounded-lg p-4 mt-5 text-center" type="submit"  value="Register" />
            </form>
            <p class="text-center text-xs mt-10">Already have an account? <a class="text-white underline" href="/login">Login here</a></p>
        </div>
    );
}
