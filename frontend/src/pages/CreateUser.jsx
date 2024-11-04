import React, { useState } from 'react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate password matching
    if (password !== repeatPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle successful registration (e.g., redirect to login page)
        console.log('User registered successfully:', data);
      } else {
        // Handle registration errors
        setErrorMessage(data.message || 'Registration failed.');
      }
    } catch (error) {
      setErrorMessage('An error occurred while registering.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center mt-40">
      <h1>Register a user</h1>
      <form className="flex justify-center items-center flex-col w-full" onSubmit={handleSubmit}>
        <input
          className="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white"
          type="email"
          name="email"
          id="registerEmail"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white"
          type="text"
          name="username"
          id="registerUsername"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white"
          type="password"
          name="password"
          id="registerPassword"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white"
          type="password"
          name="repeatPassword"
          id="repeatPassword"
          placeholder="Repeat Password"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          required
        />
        <input
          className="bg-secondaryColor text-white rounded-lg p-4 mt-5 text-center"
          type="submit"
          value="Register"
        />
      </form>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <p className="text-center text-xs mt-10">
        Already have an account?{" "}
        <a className="text-white underline" href="/login">
          Login here
        </a>
      </p>
    </div>
  );
}
