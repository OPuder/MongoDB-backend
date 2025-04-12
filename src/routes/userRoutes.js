const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authenticateToken');
const verifySecurityAnswer = require('../middlewares/verifySecurityAnswer');

router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.post('/check-email', userController.checkEmail);
router.get('/get-security-question', userController.getSecurityQuestion);
router.post('/verify-security-answer', verifySecurityAnswer, userController.verifySecurityAnswer);
router.post('/reset-password', verifySecurityAnswer, userController.resetPassword);
module.exports = router;
