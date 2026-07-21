const express = require('express');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const authenticate = require('../middleware/authenticate');
const bookRepository = require('../repositories/bookRepository');

const router = express.Router();
router.use(authenticate);

// Scanning a book's QR code hits this endpoint (frontend decodes the QR
// payload to get bookId, then calls this to fetch live info).
router.get('/book/:id', catchAsync(async (req, res) => {
  const book = await bookRepository.findById(req.params.id);
  if (!book) throw AppError.notFound('Book not found for this QR code.');
  res.status(200).json({
    success: true,
    data: {
      book: {
        id: book.id,
        title: book.title,
        isbn: book.isbn,
        author: book.author_name,
        shelf: book.shelf_code,
        availableCopies: book.available_copies,
        totalCopies: book.total_copies,
        status: book.status
      }
    }
  });
}));

module.exports = router;
