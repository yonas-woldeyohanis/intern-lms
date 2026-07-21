const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const QR_DIR = path.join(__dirname, '..', '..', 'uploads', 'qrcodes');

if (!fs.existsSync(QR_DIR)) {
  fs.mkdirSync(QR_DIR, { recursive: true });
}

/**
 * Generates a QR code PNG for a book. The QR payload includes the book's details
 * so that scanning it outside the app shows useful information.
 */
async function generateBookQr(book) {
  const payload = JSON.stringify({
    type: 'BMVEI_LMS_BOOK',
    bookId: book.id,
    title: book.title,
    isbn: book.isbn,
    author: book.author_name,
    publisher: book.publisher_name,
    category: book.category_name,
    year: book.publication_year,
    shelf: book.shelf_code
  });
  const filename = `book-${book.id}.png`;
  const filePath = path.join(QR_DIR, filename);
  await QRCode.toFile(filePath, payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320
  });
  return `/uploads/qrcodes/${filename}`;
}

module.exports = { generateBookQr };
