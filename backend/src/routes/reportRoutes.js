const express = require('express');
const { param } = require('express-validator');
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();
router.use(authenticate, authorize('admin', 'librarian'));

router.get('/', reportController.listReportTypes);
router.get(
  '/:type/:format',
  param('format').isIn(['pdf', 'excel']),
  validateRequest,
  reportController.generate
);

module.exports = router;
