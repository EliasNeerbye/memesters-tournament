const express = require('express');
const router = express.Router();
const validator = require('validator');
const User = require('../../models/User');
const AuthService = require('../../util/auth');
const TokenBlacklist = require('../../models/TokenBlacklist');
require('dotenv').config();
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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
  
          const token = await user.generateAuthToken(req.ip);
          await user.save();
          
          res.cookie('auth_token', token, AuthService.getCookieConfig());
          return res.status(200).json({ message: "User registered!" });
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
    if (await AuthService.generateLoginCode(isUser.email, isUser)) {
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

  const isUser = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
  if (!isUser){
      return res.status(400).json({message: "User does not exist!"})
  }

  try {
      const result = await AuthService.verifyLoginCode(isUser.email, code);
      if (result) {
          const token = await isUser.generateAuthToken(req.ip);
          res.cookie('auth_token', token, AuthService.getCookieConfig());
          return res.status(200).json({ message: "User logged in!" });
      }
  } catch (error) {
      console.error('Login error:', error);
      return res.status(400).json({ message: error.message });
  }
});

router.get('/profile', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const isBlacklisted = await AuthService.isTokenBlacklisted(token);
    if (isBlacklisted) {
        return res.status(401).json({ message: 'Token is no longer valid' });
    }
  } catch (error) {
      console.error('Token check error:', error);
      res.status(500).json({ message: 'Server error' });
  }

  const secret = process.env.JWT_SECRET;
  const result = await AuthService.jwtValidation(token, secret);

  if (result.error) {
      return res.status(401).json({ message: 'Authentication failed', error: result.error });
  }

  const user = result;

  const isUser = await User.findOne({_id: user._id});
  if(!isUser){
    res.status(400).json({message:'User does not exist!'})
  }

  return res.status(200).json({message:"User found!", user:{
    username: isUser.username,
    email: isUser.email,
    pfp: isUser.pfp,
    lastLogin: isUser.lastLogin,
    allLogins: isUser.allLogins
  }});
});

router.put('/profile/username', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const isBlacklisted = await AuthService.isTokenBlacklisted(token);
    if (isBlacklisted) {
        return res.status(401).json({ message: 'Token is no longer valid' });
    }
  } catch (error) {
      console.error('Token check error:', error);
      res.status(500).json({ message: 'Server error' });
  }

  const secret = process.env.JWT_SECRET;
  const result = await AuthService.jwtValidation(token, secret);

  if (result.error) {
      return res.status(401).json({ message: 'Authentication failed', error: result.error });
  }

  const user = result;

  const {username} = req.body;

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

  try {
    await User.findOneAndUpdate({email: user.email}, {username});
    return res.status(201).json({message:"Username has been updated!"});
  } catch (error) {
    console.log('Username update error: ', error)
    return res.status(400).json({message:error.message});
    
  }
});

router.post('/profile/email', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const isBlacklisted = await AuthService.isTokenBlacklisted(token);
    if (isBlacklisted) {
        return res.status(401).json({ message: 'Token is no longer valid' });
    }
  } catch (error) {
      console.error('Token check error:', error);
      res.status(500).json({ message: 'Server error' });
  }

  const secret = process.env.JWT_SECRET;
  const result = await AuthService.jwtValidation(token, secret);

  if (result.error) {
      return res.status(401).json({ message: 'Authentication failed', error: result.error });
  }

  const user = result;

  const isUser = await User.findOne({_id: user._id})
  if(!isUser){
    return res.status(400).json({message:"User does not exist!"});
  }

  try {
    await AuthService.generateLoginCode(user.email, isUser);
    return res.status(201).json({message:"Sent verification code."});
  } catch (error) {
    console.error("Error: ", error);
    return res.status(400).json({ message: error.message });
  }
});

router.put('/profile/email', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const isBlacklisted = await AuthService.isTokenBlacklisted(token);
    if (isBlacklisted) {
        return res.status(401).json({ message: 'Token is no longer valid' });
    }
  } catch (error) {
      console.error('Token check error:', error);
      res.status(500).json({ message: 'Server error' });
  }

  const secret = process.env.JWT_SECRET;
  const result = await AuthService.jwtValidation(token, secret);

  if (result.error) {
      return res.status(401).json({ message: 'Authentication failed', error: result.error });
  }

  const user = result;

  const {code, newEmail} = req.body;

  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "Code needs to be a 6-digit number!" });
  }

  if (!newEmail){
    return res.status(400).json({message:"You need to send a new email!"});
  }

  const alreadyExists = User.findOne({$or:[{email:newEmail},{tempEmail:newEmail}]});
  if(alreadyExists.length > 0) {
    return res.status(401).json({message: "Email is already in use!"})
  }

  const isUser = await User.findOne({_id: user._id})
  if(!isUser){
    return res.status(400).json({message:"User does not exist!"});
  }

  try {
    const result = await AuthService.verifyLoginCode(user.email, code);
    if (result) {
      try {
        await AuthService.generateLoginCode(newEmail, isUser);
      } catch (error) {
        console.error("Error: ", error);
        return res.status(400).json({ message: error.message });
      }
      await User.findOneAndUpdate({email:user.email}, {tempEmail:newEmail, isVerified:false});
      return res.status(201).json({message:"Sent verification code to new email."});
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(400).json({ message: error.message });
  }
});

router.post('/profile/email/code', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const isBlacklisted = await AuthService.isTokenBlacklisted(token);
    if (isBlacklisted) {
        return res.status(401).json({ message: 'Token is no longer valid' });
    }
  } catch (error) {
      console.error('Token check error:', error);
      res.status(500).json({ message: 'Server error' });
  }

  const secret = process.env.JWT_SECRET;
  const result = await AuthService.jwtValidation(token, secret);

  if (result.error) {
      return res.status(401).json({ message: 'Authentication failed', error: result.error });
  }

  const user = result;

  const {newCode} = req.body;
  if (typeof newCode !== "string" || !/^\d{6}$/.test(newCode)) {
    return res.status(400).json({ message: "Code needs to be a 6-digit number!" });
  }

  const isUser = await User.findOne({_id: user._id});
  if(!isUser){
    return res.status(400).json({message:"User does not exist!"});
  }
  const newEmail = isUser.tempEmail;

  try {
    const result = await AuthService.verifyLoginCode(newEmail, newCode);
    if (result) {
      const updateQuery = {
        $set: { email: newEmail, isVerified: true },
        $unset: { tempEmail: "" }
      };
      
      const userBefore = await User.findById(isUser._id);
      console.log('User before update:', userBefore);

      await User.updateOne({ _id: isUser._id }, updateQuery);

      const userAfter = await User.findById(isUser._id);
      console.log('User after update:', userAfter);

      
      const newToken = await isUser.generateAuthToken(req.ip);
      await isUser.save();
      return res.status(201).json({message: "Email has been updated!", token: newToken});
    } else {
      return res.status(400).json({message: "Code validation failed!"});
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(400).json({ message: error.message });
  }  

})

router.put('/profile/pfp', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const isBlacklisted = await AuthService.isTokenBlacklisted(token);
    if (isBlacklisted) {
        return res.status(401).json({ message: 'Token is no longer valid' });
    }
  } catch (error) {
      console.error('Token check error:', error);
      res.status(500).json({ message: 'Server error' });
  }

  const secret = process.env.JWT_SECRET;
  const result = await AuthService.jwtValidation(token, secret);

  if (result.error) {
    return res.status(401).json({ message: 'Authentication failed', error: result.error });
  }

  const user = result;

  const isUser = await User.findOne({_id: user._id});
  if(!isUser){
    return res.status(400).json({message:'User does not exist!'});
  }

  // Check if file was uploaded
  if (!req.files || !req.files.pfp) {
    return res.status(400).json({ message: 'No file was uploaded.' });
  }

  const file = req.files.pfp;

  // Validate file type (still a good idea to check this server-side)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed.' });
  }

  // Generate unique filename
  const fileExtension = path.extname(file.name);
  const fileName = `${uuidv4()}${fileExtension}`;

  // Define upload path
  const uploadPath = path.join(__dirname, '../../../frontend/public/uploads', fileName);

  try {
    // Move the file to the upload directory
    await file.mv(uploadPath);

    // Delete old profile picture if it exists
    if (isUser.pfp) {
      const oldFilePath = path.join(__dirname, '../../../frontend/public', isUser.pfp);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update user's pfp in the database
    const pfpUrl = `/uploads/${fileName}`;
    await User.findOneAndUpdate({ email: user.email }, { pfp: pfpUrl });

    res.status(200).json({ message: 'Profile picture updated successfully', pfpUrl });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Error updating profile picture', error: error.message });
  }
});

router.get('/logout', async (req, res) => {
  try {
      const token = req.cookies.auth_token;
      if (!token) {
          return res.status(401).json({ message: 'No token, authorization denied' });
      }

      const isBlacklisted = await AuthService.isTokenBlacklisted(token);
      if (isBlacklisted) {
          return res.status(401).json({ message: 'Token is no longer valid' });
      }

      await TokenBlacklist.create({ token });
      res.clearCookie('auth_token', AuthService.getCookieConfig(true));
      res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'An error occurred during logout' });
  }
});

router.delete('/delete-user', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const isBlacklisted = await AuthService.isTokenBlacklisted(token);
    if (isBlacklisted) {
        return res.status(401).json({ message: 'Token is no longer valid' });
    }
  } catch (error) {
      console.error('Token check error:', error);
      res.status(500).json({ message: 'Server error' });
  }

  const secret = process.env.JWT_SECRET;
  const result = await AuthService.jwtValidation(token, secret);

  if (result.error) {
      return res.status(401).json({ message: 'Authentication failed', error: result.error });
  }

  const user = result;

  const isUser = await User.findOne({_id: user._id});
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

  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const isBlacklisted = await AuthService.isTokenBlacklisted(token);
    if (isBlacklisted) {
        return res.status(401).json({ message: 'Token is no longer valid' });
    }
  } catch (error) {
      console.error('Token check error:', error);
      res.status(500).json({ message: 'Server error' });
  }

  const secret = process.env.JWT_SECRET;
  const result = await AuthService.jwtValidation(token, secret);

  if (result.error) {
      return res.status(401).json({ message: 'Authentication failed', error: result.error });
  }

  const user = result;

  try {
    const result = await AuthService.verifyLoginCode(user.email, code);
    if (result) {
      try {
        await User.findOneAndDelete({email:user.email});
        res.clearCookie('auth_token', AuthService.getCookieConfig(true));
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