const User = require('../models/User');

const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(201).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getUsers };
