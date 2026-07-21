const express = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest');
const { authLimiter } = require('../middleware/security');
const {
  loginValidator, changePasswordValidator, forgotPasswordValidator, resetPasswordValidator
} = require('../validators/authValidators');

const router = express.Router();

router.post('/login', authLimiter, loginValidator, validateRequest, authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, changePasswordValidator, validateRequest, authController.changePassword);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validateRequest, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, validateRequest, authController.resetPassword);

module.exports = router;
