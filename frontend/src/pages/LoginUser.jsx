import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginUser() {
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername }),
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

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
  
    try {
      const response = await fetch('/api/users/login/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername, code: verificationCode }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        navigate('/game'); // Redirect to profile page after successful login
      } else {
        setErrorMessage(data.message || 'Invalid verification code.');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="flex flex-col justify-center items-center mt-40">
      <h1>Login</h1>
      {!isCodeSent ? (
        <form className="flex justify-center items-center flex-col w-full" onSubmit={handleRequestCode}>
          <input
            className="text-center rounded-lg bg-secondaryColor p-4 pl-6 pr-6 mt-5 text-white placeholder-white"
            type="text"
            name="emailOrUsername"
            id="loginEmailOrUsername"
            placeholder="Email or Username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
          />
          <button
            className="bg-secondaryColor text-white rounded-lg p-4 mt-5 text-center w-[200px]"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </form>
      ) : (
        <form className="flex justify-center items-center flex-col w-full" onSubmit={handleVerifyCode}>
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
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      )}
      {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
      <p className="text-center text-xs mt-10">
        Don't have an account?{" "}
        <a className="text-white underline" href="/CreateUser">
          Register here
        </a>
      </p>
    </div>
  );
}