const express = require('express');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const authenticate = require('../middleware/authenticate');
const bookRepository = require('../repositories/bookRepository');

const router = express.Router();
const moment = require('moment'); // For date formatting if needed

// PUBLIC HTML endpoint for QR code scans
router.get('/public/book/:id', catchAsync(async (req, res) => {
  const book = await bookRepository.findById(req.params.id);
  if (!book) {
    return res.status(404).send('<h1>Book not found</h1>');
  }

  const isAvailable = book.available_copies > 0 && book.status === 'available';
  const statusColor = isAvailable ? 'bg-emerald-100 text-emerald-800' : book.status === 'archived' ? 'bg-slate-100 text-slate-800' : 'bg-rose-100 text-rose-800';
  const statusText = isAvailable ? 'Available' : book.status === 'archived' ? 'Archived' : 'Unavailable';
  const coverHtml = book.cover_image_url 
    ? `<img src="${book.cover_image_url}" alt="Cover" class="w-full h-64 object-cover rounded-xl shadow-md mb-6" />`
    : `<div class="w-full h-64 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md flex items-center justify-center mb-6">
         <svg class="w-20 h-20 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
       </div>`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${book.title} - BMVEI Library</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>body { font-family: 'Outfit', sans-serif; }</style>
    </head>
    <body class="bg-slate-50 min-h-screen p-4 sm:p-8">
      <div class="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-6">
          <div class="text-center mb-6">
            <h1 class="text-2xl font-bold text-slate-900 mb-2 leading-tight">${book.title}</h1>
            <span class="inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColor}">
              ${statusText} (${book.available_copies}/${book.total_copies})
            </span>
          </div>
          
          ${coverHtml}
          
          <div class="space-y-4">
            <div class="flex flex-col border-b border-slate-100 pb-3">
              <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Author</span>
              <span class="text-slate-800 font-medium">${book.author_name || 'Unknown'}</span>
            </div>
            
            <div class="flex flex-col border-b border-slate-100 pb-3">
              <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">ISBN</span>
              <span class="text-slate-800 font-mono">${book.isbn}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
              <div class="flex flex-col">
                <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Category</span>
                <span class="text-slate-800">${book.category_name || '-'}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Shelf</span>
                <span class="text-slate-800 font-medium text-indigo-600">${book.shelf_code || '-'}</span>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 pb-3">
              <div class="flex flex-col">
                <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Publisher</span>
                <span class="text-slate-800">${book.publisher_name || '-'}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Year</span>
                <span class="text-slate-800">${book.publication_year || '-'}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-indigo-50 p-4 text-center border-t border-indigo-100">
          <p class="text-sm text-indigo-800 font-medium">BMVEI Library System</p>
        </div>
      </div>
    </body>
    </html>
  `;
  res.send(html);
}));

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
