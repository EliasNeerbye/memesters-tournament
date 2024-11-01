const express = require('express');
const router = express.Router();

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  // TODO: Implement user registration
  // 1. Validate input
  // 2. Check if user already exists
  // 3. Hash password
  // 4. Create new user
  // 5. Generate JWT token
});

// @route   POST /api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  // TODO: Implement user login
  // 1. Validate credentials
  // 2. Compare hashed password
  // 3. Generate JWT token
});

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', async (req, res) => {
  // TODO: Implement profile retrieval
  // 1. Verify JWT token
  // 2. Fetch user profile data
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res) => {
  // TODO: Implement profile update
  // 1. Verify JWT token
  // 2. Validate input
  // 3. Update user profile
});

module.exports = router;