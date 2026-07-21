const AppError = require('../utils/AppError');
const bookRepository = require('../repositories/bookRepository');
const qrService = require('../services/qrService');
const auditService = require('../services/auditService');

async function createBook(payload, userId, req) {
  const existing = await bookRepository.findByIsbn(payload.isbn);
  if (existing) {
    throw AppError.conflict('A book with this ISBN already exists.');
  }

  const totalCopies = Number(payload.totalCopies) || 1;
  const book = await bookRepository.create({
    title: payload.title,
    isbn: payload.isbn,
    authorId: payload.authorId || null,
    publisherId: payload.publisherId || null,
    categoryId: payload.categoryId || null,
    shelfId: payload.shelfId || null,
    edition: payload.edition || null,
    publicationYear: payload.publicationYear || null,
    language: payload.language || 'English',
    description: payload.description || null,
    coverImageUrl: payload.coverImageUrl || null,
    totalCopies,
    availableCopies: totalCopies,
    status: 'available',
    addedBy: userId
  });

  // QR generation is best-effort — don't let a QR failure roll back the book
  try {
    const fullBook = await bookRepository.findById(book.id);
    const qrPath = await qrService.generateBookQr(fullBook);
    await bookRepository.setQrPath(book.id, qrPath);
  } catch (qrErr) {
    console.error(`[QR] Failed to generate QR for book ${book.id}:`, qrErr.message);
  }

  await auditService.record({ userId, action: 'BOOK_CREATED', entityType: 'book', entityId: book.id, description: book.title, req });

  return bookRepository.findById(book.id);
}

async function updateBook(id, payload, userId, req) {
  const book = await bookRepository.findById(id);
  if (!book) throw AppError.notFound('Book not found.');

  if (payload.isbn && payload.isbn !== book.isbn) {
    const existing = await bookRepository.findByIsbn(payload.isbn);
    if (existing) throw AppError.conflict('A book with this ISBN already exists.');
  }

  const fields = {};
  const map = {
    title: 'title', isbn: 'isbn', authorId: 'author_id', publisherId: 'publisher_id',
    categoryId: 'category_id', shelfId: 'shelf_id', edition: 'edition',
    publicationYear: 'publication_year', language: 'language', description: 'description',
    coverImageUrl: 'cover_image_url', status: 'status'
  };
  for (const key of Object.keys(map)) {
    if (payload[key] !== undefined) fields[map[key]] = payload[key];
  }

  // Adjust available_copies proportionally if total_copies changes
  if (payload.totalCopies !== undefined && Number(payload.totalCopies) !== book.total_copies) {
    const diff = Number(payload.totalCopies) - book.total_copies;
    const newAvailable = book.available_copies + diff;
    if (newAvailable < 0) {
      throw AppError.badRequest('Cannot reduce total copies below the number currently borrowed.');
    }
    fields.total_copies = Number(payload.totalCopies);
    fields.available_copies = newAvailable;
  }

  const updated = await bookRepository.update(id, fields);

  try {
    const fullUpdated = await bookRepository.findById(id);
    const qrPath = await qrService.generateBookQr(fullUpdated);
    await bookRepository.setQrPath(id, qrPath);
  } catch (qrErr) {
    console.error(`[QR] Failed to update QR for book ${id}:`, qrErr.message);
  }

  await auditService.record({ userId, action: 'BOOK_UPDATED', entityType: 'book', entityId: id, description: updated.title, req });
  return bookRepository.findById(id);
}

async function archiveBook(id, userId, req) {
  const book = await bookRepository.findById(id);
  if (!book) throw AppError.notFound('Book not found.');
  if (book.available_copies < book.total_copies) {
    throw AppError.badRequest('Cannot archive a book while copies are still on loan.');
  }
  await bookRepository.archive(id);
  await auditService.record({ userId, action: 'BOOK_ARCHIVED', entityType: 'book', entityId: id, description: book.title, req });
}

async function getBook(id) {
  const book = await bookRepository.findById(id);
  if (!book) throw AppError.notFound('Book not found.');
  return book;
}

async function searchBooks(query) {
  return bookRepository.search(query);
}

async function bulkCreate(booksPayload, userId, req) {
  const authorRepo = require('../repositories/lookupRepositories').authorRepository;
  const publisherRepo = require('../repositories/lookupRepositories').publisherRepository;
  const categoryRepo = require('../repositories/lookupRepositories').categoryRepository;
  const shelfRepo = require('../repositories/lookupRepositories').shelfRepository;

  let successCount = 0;
  const errors = [];

  for (const [index, row] of booksPayload.entries()) {
    try {
      if (!row.title || !row.isbn) {
        throw new Error('Title and ISBN are required.');
      }

      // Handle lookups (upsert by name)
      let authorId = null;
      if (row.author) {
        const author = await authorRepo.create({ full_name: row.author });
        authorId = author.id;
      }
      let publisherId = null;
      if (row.publisher) {
        const pub = await publisherRepo.create({ name: row.publisher });
        publisherId = pub.id;
      }
      let categoryId = null;
      if (row.category) {
        const cat = await categoryRepo.create({ name: row.category });
        categoryId = cat.id;
      }
      let shelfId = null;
      if (row.shelf) {
        const shelf = await shelfRepo.create({ code: row.shelf });
        shelfId = shelf.id;
      }

      // Check for existing book
      const existing = await bookRepository.findByIsbn(row.isbn);
      if (existing) {
        throw new Error(`ISBN ${row.isbn} already exists.`);
      }

      const totalCopies = Number(row.totalCopies) || 1;
      const book = await bookRepository.create({
        title: row.title,
        isbn: row.isbn,
        authorId,
        publisherId,
        categoryId,
        shelfId,
        edition: row.edition || null,
        publicationYear: row.publicationYear || null,
        language: row.language || 'English',
        description: row.description || null,
        coverImageUrl: null,
        totalCopies,
        availableCopies: totalCopies,
        status: 'available',
        addedBy: userId
      });

      // Background QR generation (best-effort)
      const fullBook = await bookRepository.findById(book.id);
      qrService.generateBookQr(fullBook)
        .then(path => bookRepository.setQrPath(book.id, path))
        .catch(err => console.error(`[QR] Bulk gen failed for ${book.id}:`, err.message));

      successCount++;
    } catch (err) {
      errors.push({ row: index + 2, title: row.title, isbn: row.isbn, error: err.message });
    }
  }

  await auditService.record({ userId, action: 'BOOKS_BULK_IMPORTED', entityType: 'book', description: `Imported ${successCount} books`, req });
  return { successCount, errors };
}

async function exportCsv(res) {
  const ExcelJS = require('exceljs');
  const result = await bookRepository.search({ limit: 100000 }); // get all
  const books = result.rows;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Books');

  worksheet.columns = [
    { header: 'Title', key: 'title', width: 40 },
    { header: 'ISBN', key: 'isbn', width: 20 },
    { header: 'Author', key: 'author_name', width: 30 },
    { header: 'Category', key: 'category_name', width: 20 },
    { header: 'Publisher', key: 'publisher_name', width: 20 },
    { header: 'Shelf', key: 'shelf_code', width: 15 },
    { header: 'Year', key: 'publication_year', width: 10 },
    { header: 'Copies', key: 'total_copies', width: 10 },
    { header: 'Edition', key: 'edition', width: 10 },
    { header: 'Language', key: 'language', width: 15 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Available', key: 'available_copies', width: 10 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  books.forEach(book => worksheet.addRow(book));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="library_catalog.csv"');

  await workbook.csv.write(res);
  res.end();
}

module.exports = { createBook, updateBook, archiveBook, getBook, searchBooks, bulkCreate, exportCsv };
