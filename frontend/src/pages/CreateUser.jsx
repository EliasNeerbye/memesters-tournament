import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateUser() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCodeSent(true);
        setErrorMessage('Verification code sent to your email.');
      } else {
        setErrorMessage(data.message || 'Failed to send verification code.');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/users/register/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          code: verificationCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set JWT token in a cookie
        navigate('/profile'); // Redirect to profile page after successful registration
      } else {
        setErrorMessage(data.message || 'Registration failed.');
      }
    } catch (error) {
      setErrorMessage('An error occurred while registering.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center mt-40">
      <h1>Register a user</h1>
      {!isCodeSent ? (
        <form className="flex justify-center items-center flex-col w-full" onSubmit={handleRequestCode}>
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
          <button
            className="bg-secondaryColor text-white rounded-lg p-4 mt-5 text-center w-[200px]"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <form className="flex justify-center items-center flex-col w-full" onSubmit={handleCompleteRegistration}>
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
            type="text"
            name="verificationCode"
            id="verificationCode"
            placeholder="Enter Verification Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
          />
          <button
            className="bg-secondaryColor text-white rounded-lg p-4 mt-5 text-center w-[200px]"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>
      )}
      {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
      <p className="text-center text-xs mt-10">
        Already have an account?{" "}
        <a className="text-white underline" href="/login">
          Login here
        </a>
      </p>
    </div>
  );
}