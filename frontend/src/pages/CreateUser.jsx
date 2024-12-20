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
        navigate('/game'); // Redirect to profile page after successful registration
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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto space-y-8 pt-20">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-gray-400">Join the meme community</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          {!isCodeSent ? (
            <form className="space-y-6" onSubmit={handleRequestCode}>
              <input
                className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                type="email"
                name="email"
                id="registerEmail"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleCompleteRegistration}>
              <input
                className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                type="text"
                name="username"
                id="registerUsername"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                type="text"
                name="verificationCode"
                id="verificationCode"
                placeholder="Enter Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
              <button
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            </form>
          )}
          {errorMessage && (
            <p className="mt-4 text-red-400 text-sm text-center">{errorMessage}</p>
          )}
        </div>

        <p className="text-center text-gray-400">
          Already have an account?{" "}
          <a href="/login" className="text-purple-400 hover:text-purple-300 transition-colors duration-300">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}