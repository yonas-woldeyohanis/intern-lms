const { body, param, query } = require('express-validator');

const issueValidator = [
  body('bookId').isInt({ min: 1 }).withMessage('A valid book is required.'),
  body('userId').isInt({ min: 1 }).withMessage('A valid member is required.')
];

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid id.')];

const listValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['borrowed', 'returned', 'overdue', 'lost'])
];

module.exports = { issueValidator, idParamValidator, listValidator };
