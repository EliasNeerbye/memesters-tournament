import React, { useState } from 'react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [jwtToken, setJwtToken] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the JWT token and display it
        setJwtToken(data.token);
        localStorage.setItem('jwtToken', data.token);
        console.log('User logged in successfully:', data);
        // You may want to redirect the user after login
      } else {
        // Handle login errors
        setErrorMessage(data.message || 'Login failed.');
      }
    } catch (error) {
      setErrorMessage('An error occurred while logging in.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center mt-40">
      <h1>Login</h1>
      <form className="flex justify-center items-center flex-col w-full" onSubmit={handleLogin}>
        <input
          className="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white"
          type="email"
          name="email"
          id="loginEmail"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white"
          type="password"
          name="password"
          id="loginPassword"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="bg-secondaryColor text-white rounded-lg p-4 mt-5 text-center"
          type="submit"
          value="Log in"
        />
      </form>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <p className="text-center text-xs mt-10">
        Don't have an account?{" "}
        <a className="text-white underline" href="/CreateUser">
          Register here
        </a>
      </p>
    </div>
  );
}
