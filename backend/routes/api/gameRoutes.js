const express = require('express');
const { startGame } = require('../../controllers/gameController');
const router = express.Router();

router.get('/', startGame);

module.exports = router;
