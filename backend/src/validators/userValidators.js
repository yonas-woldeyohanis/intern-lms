const { body, param } = require('express-validator');

const namePattern = /^[A-Za-z À-ÿ'\-]+$/;
const phonePattern = /^\+?[0-9]{7,15}$/;

const createUserValidator = [
  body('firstName').trim().notEmpty().matches(namePattern).withMessage('First name may only contain letters, spaces, hyphens, and apostrophes.'),
  body('lastName').trim().notEmpty().matches(namePattern).withMessage('Last name may only contain letters, spaces, hyphens, and apostrophes.'),
  body('email').trim().isEmail().withMessage('A valid email address is required.').normalizeEmail(),
  body('phone').optional({ nullable: true }).trim().matches(phonePattern).withMessage('Phone number must contain only digits and an optional leading +.'),
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters.')
    .matches(/^[A-Za-z0-9_.]+$/).withMessage('Username may only contain letters, numbers, dots, and underscores.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character.'),
  body('role').isIn(['admin', 'librarian', 'user']).withMessage('Role must be admin, librarian, or user.'),
  body('departmentId').optional({ nullable: true }).isInt({ min: 1 }),
  body('employeeId').optional({ nullable: true }).trim().isLength({ max: 50 })
];

const updateUserValidator = [
  param('id').isInt({ min: 1 }),
  body('firstName').optional().trim().matches(namePattern),
  body('lastName').optional().trim().matches(namePattern),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('phone').optional({ nullable: true }).trim().matches(phonePattern),
  body('role').optional().isIn(['admin', 'librarian', 'user']),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
  body('departmentId').optional({ nullable: true }).isInt({ min: 1 })
];

const resetPasswordByAdminValidator = [
  param('id').isInt({ min: 1 }),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character.')
];

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid id.')];

module.exports = { createUserValidator, updateUserValidator, resetPasswordByAdminValidator, idParamValidator };
