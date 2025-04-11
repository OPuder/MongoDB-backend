const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authenticateToken');

router.get('/profile', authenticateToken, userController.getProfile);
router.post('/reset-password', userController.resetPassword);

module.exports = router;
