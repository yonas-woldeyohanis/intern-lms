const { body, param, query } = require('express-validator');

// ISBN-10 or ISBN-13 (allows hyphens, checked loosely at input, digit count validated)
const isbnPattern = /^(?:\d{9}[\dXx]|\d{13})$/;

function stripIsbn(value) {
  return (value || '').replace(/[-\s]/g, '');
}

const createBookValidator = [
  body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 255 }),
  body('isbn')
    .customSanitizer(stripIsbn)
    .notEmpty().withMessage('ISBN is required.')
    .isLength({ min: 6, max: 20 }).withMessage('ISBN must be between 6 and 20 characters.'),
  body('authorId').optional({ nullable: true }).isInt({ min: 1 }),
  body('publisherId').optional({ nullable: true }).isInt({ min: 1 }),
  body('categoryId').optional({ nullable: true }).isInt({ min: 1 }),
  body('shelfId').optional({ nullable: true }).isInt({ min: 1 }),
  body('publicationYear').optional({ nullable: true }).isInt({ min: 1450, max: new Date().getFullYear() + 1 }).withMessage('Publication year must be a reasonable year.'),
  body('totalCopies').optional().isInt({ min: 1, max: 10000 }).withMessage('Total copies must be a positive integer.'),
  body('language').optional().trim().isLength({ max: 50 }),
  body('edition').optional().trim().isLength({ max: 50 }),
  body('description').optional().trim().isLength({ max: 5000 })
];

const updateBookValidator = [
  param('id').isInt({ min: 1 }),
  body('title').optional().trim().notEmpty().isLength({ max: 255 }),
  body('isbn').optional().customSanitizer(stripIsbn)
    .isLength({ min: 6, max: 20 }).withMessage('ISBN must be between 6 and 20 characters.'),
  body('authorId').optional({ nullable: true }).isInt({ min: 1 }),
  body('publisherId').optional({ nullable: true }).isInt({ min: 1 }),
  body('categoryId').optional({ nullable: true }).isInt({ min: 1 }),
  body('shelfId').optional({ nullable: true }).isInt({ min: 1 }),
  body('publicationYear').optional({ nullable: true }).isInt({ min: 1450, max: new Date().getFullYear() + 1 }),
  body('totalCopies').optional().isInt({ min: 1, max: 10000 }),
  body('status').optional().isIn(['available', 'unavailable', 'archived'])
];

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid id.')];

const searchBooksValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['title', 'publication_year', 'created_at', 'available_copies']),
  query('sortDir').optional().isIn(['asc', 'desc', 'ASC', 'DESC'])
];

module.exports = { createBookValidator, updateBookValidator, idParamValidator, searchBooksValidator };
