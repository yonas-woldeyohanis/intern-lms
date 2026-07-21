const { body, param } = require('express-validator');

const createValidator = [
  body('bookId').isInt({ min: 1 }).withMessage('A valid book is required.'),
  body('userId').optional().isInt({ min: 1 })
];
const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid id.')];

module.exports = { createValidator, idParamValidator };
