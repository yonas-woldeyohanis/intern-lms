const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const createGenericController = require('../controllers/genericCrudController');
const {
  authorRepository, publisherRepository, categoryRepository, shelfRepository, departmentRepository
} = require('../repositories/lookupRepositories');
const {
  idParamValidator, authorValidator, publisherValidator, categoryValidator, shelfValidator, departmentValidator
} = require('../validators/lookupValidators');

function buildLookupRouter(repository, label, entityType, createValidator) {
  const router = express.Router();
  const controller = createGenericController(repository, label, entityType);

  router.use(authenticate);
  router.get('/', controller.list);
  router.get('/:id', idParamValidator, validateRequest, controller.getOne);
  router.post('/', authorize('admin', 'librarian'), createValidator, validateRequest, controller.create);
  router.put('/:id', authorize('admin', 'librarian'), idParamValidator, createValidator, validateRequest, controller.update);
  router.delete('/:id', authorize('admin'), idParamValidator, validateRequest, controller.remove);

  return router;
}

module.exports = {
  authorsRouter: buildLookupRouter(authorRepository, 'Author', 'author', authorValidator),
  publishersRouter: buildLookupRouter(publisherRepository, 'Publisher', 'publisher', publisherValidator),
  categoriesRouter: buildLookupRouter(categoryRepository, 'Category', 'category', categoryValidator),
  shelvesRouter: buildLookupRouter(shelfRepository, 'Shelf', 'shelf', shelfValidator),
  departmentsRouter: buildLookupRouter(departmentRepository, 'Department', 'department', departmentValidator)
};
