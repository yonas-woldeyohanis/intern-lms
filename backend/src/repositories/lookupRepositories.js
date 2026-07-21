const createGenericRepository = require('./genericRepository');

const authorRepository = createGenericRepository('authors', { searchableColumns: ['full_name', 'nationality'], orderBy: 'full_name ASC' });
const publisherRepository = createGenericRepository('publishers', { searchableColumns: ['name', 'contact_email'] });
const categoryRepository = createGenericRepository('categories', { searchableColumns: ['name'] });
const shelfRepository = createGenericRepository('shelves', { searchableColumns: ['code', 'location_description'], orderBy: 'code ASC' });
const departmentRepository = createGenericRepository('departments', { searchableColumns: ['name', 'code'] });

module.exports = { authorRepository, publisherRepository, categoryRepository, shelfRepository, departmentRepository };
