const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const auditService = require('../services/auditService');

/**
 * Builds a standard REST controller (list/get/create/update/delete) on top
 * of a generic repository. `label` is used for audit-log actions and error
 * messages (e.g. "Category").
 */
function createGenericController(repository, label, entityType) {
  const list = catchAsync(async (req, res) => {
    const { search, page, limit } = req.query;
    const result = await repository.findAll({ search, page, limit });
    res.status(200).json({ success: true, data: result });
  });

  const getOne = catchAsync(async (req, res) => {
    const item = await repository.findById(req.params.id);
    if (!item) throw AppError.notFound(`${label} not found.`);
    res.status(200).json({ success: true, data: { item } });
  });

  const create = catchAsync(async (req, res) => {
    const item = await repository.create(req.body);
    await auditService.record({
      userId: req.user.id, action: `${entityType.toUpperCase()}_CREATED`, entityType, entityId: item.id, req
    });
    res.status(201).json({ success: true, data: { item } });
  });

  const update = catchAsync(async (req, res) => {
    const existing = await repository.findById(req.params.id);
    if (!existing) throw AppError.notFound(`${label} not found.`);
    const item = await repository.update(req.params.id, req.body);
    await auditService.record({
      userId: req.user.id, action: `${entityType.toUpperCase()}_UPDATED`, entityType, entityId: item.id, req
    });
    res.status(200).json({ success: true, data: { item } });
  });

  const remove = catchAsync(async (req, res) => {
    const existing = await repository.findById(req.params.id);
    if (!existing) throw AppError.notFound(`${label} not found.`);
    await repository.remove(req.params.id);
    await auditService.record({
      userId: req.user.id, action: `${entityType.toUpperCase()}_DELETED`, entityType, entityId: req.params.id, req
    });
    res.status(200).json({ success: true, data: { message: `${label} deleted successfully.` } });
  });

  return { list, getOne, create, update, remove };
}

module.exports = createGenericController;
