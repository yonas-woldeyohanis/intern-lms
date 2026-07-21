const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);
router.get('/summary', dashboardController.summary);

module.exports = router;
