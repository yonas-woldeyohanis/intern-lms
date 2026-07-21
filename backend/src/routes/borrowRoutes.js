const express = require('express');
const borrowController = require('../controllers/borrowController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { issueValidator, idParamValidator, listValidator } = require('../validators/borrowValidators');

const router = express.Router();

router.use(authenticate);

router.get('/', listValidator, validateRequest, borrowController.list);
router.post('/issue', authorize('admin', 'librarian'), issueValidator, validateRequest, borrowController.issue);
router.post('/:id/return', authorize('admin', 'librarian'), idParamValidator, validateRequest, borrowController.returnBook);
router.post('/:id/renew', authorize('admin', 'librarian'), idParamValidator, validateRequest, borrowController.renew);
router.post('/:id/lost', authorize('admin', 'librarian'), idParamValidator, validateRequest, borrowController.markLost);

module.exports = router;
