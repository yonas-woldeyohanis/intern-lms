const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const {
  createUserValidator, updateUserValidator, resetPasswordByAdminValidator, idParamValidator
} = require('../validators/userValidators');

const router = express.Router();

router.use(authenticate);

// Admin + librarian can view/search members; only admin manages accounts fully.
router.get('/', authorize('admin', 'librarian'), userController.list);
router.get('/:id', authorize('admin', 'librarian'), idParamValidator, validateRequest, userController.getOne);

// Librarians can create 'user' (member) accounts; admin can create any role.
router.post('/', authorize('admin', 'librarian'), createUserValidator, validateRequest, userController.create);
router.put('/:id', authorize('admin'), updateUserValidator, validateRequest, userController.update);
router.post('/:id/reset-password', authorize('admin'), resetPasswordByAdminValidator, validateRequest, userController.resetPassword);
router.delete('/:id', authorize('admin'), idParamValidator, validateRequest, userController.remove);

module.exports = router;
