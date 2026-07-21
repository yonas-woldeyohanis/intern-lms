const express = require('express');
const bookController = require('../controllers/bookController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { uploadCoverImage } = require('../middleware/upload');
const {
  createBookValidator, updateBookValidator, idParamValidator, searchBooksValidator
} = require('../validators/bookValidators');

const router = express.Router();

router.use(authenticate);

// Export must come before /:id to avoid matching export/csv as an ID
router.get('/export/csv', authorize('admin', 'librarian'), bookController.exportCsv);
router.post('/bulk', authorize('admin', 'librarian'), bookController.bulkCreate);

router.get('/', searchBooksValidator, validateRequest, bookController.list);
router.get('/:id', idParamValidator, validateRequest, bookController.getOne);

router.post(
  '/',
  authorize('admin', 'librarian'),
  uploadCoverImage.single('cover'),
  createBookValidator,
  validateRequest,
  bookController.create
);

router.put(
  '/:id',
  authorize('admin', 'librarian'),
  uploadCoverImage.single('cover'),
  updateBookValidator,
  validateRequest,
  bookController.update
);

router.delete('/:id', authorize('admin', 'librarian'), idParamValidator, validateRequest, bookController.archive);

module.exports = router;
