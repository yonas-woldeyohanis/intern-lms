const express = require('express');
const reservationController = require('../controllers/reservationController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { createValidator, idParamValidator } = require('../validators/reservationValidators');

const router = express.Router();
router.use(authenticate);

router.get('/', reservationController.list);
router.post('/', createValidator, validateRequest, reservationController.create);
router.post('/:id/cancel', idParamValidator, validateRequest, reservationController.cancel);
router.post('/:id/fulfill', authorize('admin', 'librarian'), idParamValidator, validateRequest, reservationController.fulfill);

module.exports = router;
