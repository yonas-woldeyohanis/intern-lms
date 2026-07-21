const { body } = require('express-validator');

// Enforced password policy: min 8 chars, upper, lower, number, special char
const passwordRule = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
  .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
  .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
  .matches(/[0-9]/).withMessage('Password must contain at least one number.')
  .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.');

const loginValidator = [
  body('identifier').trim().notEmpty().withMessage('Username or email is required.'),
  body('password').notEmpty().withMessage('Password is required.')
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter.')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('New password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('New password must contain at least one special character.')
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('A valid email address is required.').normalizeEmail()
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter.')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('New password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('New password must contain at least one special character.')
];

module.exports = { passwordRule, loginValidator, changePasswordValidator, forgotPasswordValidator, resetPasswordValidator };
