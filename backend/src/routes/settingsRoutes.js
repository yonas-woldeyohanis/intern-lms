const express = require('express');
const { body } = require('express-validator');
const catchAsync = require('../utils/catchAsync');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const settingsRepository = require('../repositories/settingsRepository');
const auditService = require('../services/auditService');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('admin'), catchAsync(async (req, res) => {
  const settings = await settingsRepository.getAll();
  res.status(200).json({ success: true, data: { settings } });
}));

router.put(
  '/:key',
  authorize('admin'),
  body('value').notEmpty().withMessage('Value is required.'),
  validateRequest,
  catchAsync(async (req, res) => {
    await settingsRepository.setValue(req.params.key, req.body.value, req.user.id);
    await auditService.record({
      userId: req.user.id, action: 'SETTING_UPDATED', entityType: 'system_setting',
      description: `${req.params.key} = ${req.body.value}`, req
    });
    res.status(200).json({ success: true, data: { message: 'Setting updated successfully.' } });
  })
);

module.exports = router;
