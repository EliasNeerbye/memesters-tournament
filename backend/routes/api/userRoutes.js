const express = require('express');
const router = express.Router();
const validator = require('validator');
const User = require('../../models/User');
const AuthService = require('../../util/auth');
require('dotenv').config();

router.post('/register', async (req, res) => {
  const { email } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Email is not valid." });
  }

  const isUser = await User.findOne({ email });
  if (isUser) {
    return res.status(400).json({ message: "User already exists." });
  }

  try {
    if (await AuthService.generateLoginCode(email)) {
      return res.status(200).json({ message: "Code sent to email." });
    }
    return res.status(500).json({ message: "Code didn't get generated, or email didn't get sent." });
  } catch (error) {
    console.error('Code generation error:', error);
    return res.status(500).json({ message: 'Failed to generate verification code, or email was not sent' });
  }
});

router.post('/register/code', async (req, res) => {
  const { email, username, code } = req.body;

  if (!email || !username || !code){
    return res.status(400).json({message: "Something is missing"});
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Email is not valid." });
  }

  const isUser = await User.findOne({ $or: [{ email }, { username }] });
  if (isUser) {
    if (isUser.email === email) {
      return res.status(400).json({ message: "Email is already registered." });
    } else {
      return res.status(400).json({ message: "Username is already taken." });
    }
  }

  if (typeof username !== "string") {
    return res.status(400).json({ message: "Username needs to contain letters!" });
  }

  if (username.length < 3 || username.length > 16) {
    return res.status(400).json({ message: "Keep name between 3 and 16 characters long!" });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return res.status(400).json({ message: "Username can only contain letters, numbers, underscores, and hyphens!" });
  }

  if (!/[a-zA-Z]/.test(username)) {
    return res.status(400).json({ message: "Username must contain at least one letter!" });
  }

  if (/[-_]{2,}|[-_][-_]/.test(username)) {
    return res.status(400).json({ message: "Username cannot contain consecutive hyphens or underscores!" });
  }

  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "Code needs to be a 6-digit number!" });
  }

  try {
    const result = await AuthService.verifyLoginCode(email, code);
    if (result) {
      const isVerified = true;
      const lastLogin = Date.now();
      const user = new User({
        username: username.trim(),
        email,
        isVerified,
        lastLogin,
      });
  
      await user.save();
      const token = user.generateAuthToken();
      return res.status(200).json({
        message: "User registered!",
        token: token,
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(400).json({ message: error.message });
  }
  
});


router.post('/login', async (req, res) => {
  const {emailOrUsername} = req.body;

  const isUser = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
  if (!isUser){
    return res.status(400).json({message: "User does not exist!"})
  }

  try {
    if (await AuthService.generateLoginCode(isUser.email)) {
      return res.status(200).json({ message: "Code sent to email." });
    }
    return res.status(500).json({ message: "Code didn't get generated, or email didn't get sent." });
  } catch (error) {
    console.error('Code generation error:', error);
    return res.status(500).json({ message: 'Failed to generate verification code, or email was not sent' });
  }
});

router.post('/login/code', async (req, res) => {
  const {emailOrUsername, code} = req.body;

  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "Code needs to be a 6-digit number!" });
  }

  const isUser = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
  if (!isUser){
    return res.status(400).json({message: "User does not exist!"})
  }

  try {
    const result = await AuthService.verifyLoginCode(isUser.email, code);
    if (result) {
      const token = isUser.generateAuthToken();
      return res.status(200).json({
        message: "User logged in!",
        token: token,
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(400).json({ message: error.message });
  }
});


router.get('/profile', async (req, res) => {
  // TODO: Implement profile retrieval
  // 1. Verify JWT token
  // 2. Fetch user profile data
});


router.put('/profile/username', async (req, res) => {
  // TODO: Profile username update
  // 1. Verify JWT token
  // 2. Validate input
  // 3. Update user profile
});

router.put('/profile/email', async (req, res) => {
  // TODO: Profile username update
  // 1. Verify JWT token
  // 2. Validate input
  // 3. Update user profile
});

router.put('/profile/pfp', async (req, res) => {
  // TODO: Profile username update
  // 1. Verify JWT token
  // 2. Validate input
  // 3. Update user profile
});

router.delete('/delete-user', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const secret = process.env.JWT_SECRET;
  const result = await AuthService.jwtValidation(token, secret);

  if (result.error) {
      return res.status(401).json({ message: 'Authentication failed', error: result.error });
  }

  const user = result;

  const isUser = await User.findOne({email: user.email});
  if(!isUser){
    res.status(400).json({message:'User does not exist!'})
  }

  try {
    if (await AuthService.generateLoginCode(user.email)) {
      return res.status(200).json({ message: "Code sent to email." });
    }
    return res.status(500).json({ message: "Code didn't get generated, or email didn't get sent." });
  } catch (error) {
    console.error('Code generation error:', error);
    return res.status(500).json({ message: 'Failed to generate verification code, or email was not sent' });
  }
});

router.delete('/delete-user/code', async (req, res) => {
  const {code} = req.body;
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "Code needs to be a 6-digit number!" });
  }

  const token = req.header('Authorization')?.replace('Bearer ', '');
  const secret = process.env.JWT_SECRET;
  const result = await AuthService.jwtValidation(token, secret);

  if (result.error) {
      return res.status(401).json({ message: 'Authentication failed', error: result.error });
  }

  const user = result;

  const isUser = await User.findOne({email: user.email});
  if(!isUser){
    res.status(400).json({message:'User does not exist!'})
  }

  try {
    const result = await AuthService.verifyLoginCode(user.email, code);
    if (result) {
      try {
        await User.deleteOne({email:user.email});
        return res.status(200).json({message:"User has been deleted!"})
      } catch (error) {
        console.error('Deletion error:', error);
        return res.status(400).json({ message: error.message });
      }
    }
  } catch (error) {
    console.error('Deletion error:', error);
    return res.status(400).json({ message: error.message });
  }

})

module.exports = router;