const { body, param } = require('express-validator');

// Relaxed name rule: allows letters, digits, spaces, and common punctuation
const nameRule = (field, max = 150) => body(field)
  .trim().notEmpty().withMessage(`${field} is required.`)
  .isLength({ max }).withMessage(`${field} must be at most ${max} characters.`);

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid id.')];

const authorValidator = [
  body('full_name').trim().notEmpty().withMessage('Author name is required.')
    .isLength({ max: 200 }).withMessage('Author name must be at most 200 characters.'),
  body('nationality').optional({ nullable: true }).trim().isLength({ max: 80 }),
  body('bio').optional({ nullable: true }).trim().isLength({ max: 2000 })
];

const publisherValidator = [
  nameRule('name'),
  body('website').optional({ nullable: true }).trim().isLength({ max: 255 }),
  body('contact_email').optional({ nullable: true }).trim().isEmail().withMessage('Contact email must be valid.')
];

const categoryValidator = [
  nameRule('name', 100),
  body('parent_id').optional({ nullable: true }).isInt({ min: 1 })
];

const shelfValidator = [
  body('code').trim().notEmpty().withMessage('Shelf code is required.').isLength({ max: 50 }),
  body('location_description').optional({ nullable: true }).trim().isLength({ max: 255 }),
  body('capacity').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Capacity must be a positive integer.')
];

const departmentValidator = [
  nameRule('name'),
  body('code').optional({ nullable: true }).trim().isLength({ max: 20 })
];

module.exports = { idParamValidator, authorValidator, publisherValidator, categoryValidator, shelfValidator, departmentValidator };
