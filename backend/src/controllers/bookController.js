const catchAsync = require('../utils/catchAsync');
const bookService = require('../services/bookService');

const list = catchAsync(async (req, res) => {
  const result = await bookService.searchBooks({
    page: req.query.page || 1,
    limit: req.query.limit || 20,
    q: req.query.q,
    categoryId: req.query.categoryId,
    authorId: req.query.authorId,
    publisherId: req.query.publisherId,
    shelfId: req.query.shelfId,
    status: req.query.status,
    sortBy: req.query.sortBy,
    sortDir: req.query.sortDir
  });
  res.status(200).json({ success: true, data: result });
});

const getOne = catchAsync(async (req, res) => {
  const book = await bookService.getBook(req.params.id);
  res.status(200).json({ success: true, data: { book } });
});

const create = catchAsync(async (req, res) => {
  const coverImageUrl = req.file ? `/uploads/covers/${req.file.filename}` : undefined;
  const book = await bookService.createBook({ ...req.body, coverImageUrl }, req.user.id, req);
  res.status(201).json({ success: true, data: { book } });
});

const update = catchAsync(async (req, res) => {
  const coverImageUrl = req.file ? `/uploads/covers/${req.file.filename}` : undefined;
  const payload = coverImageUrl ? { ...req.body, coverImageUrl } : req.body;
  const book = await bookService.updateBook(req.params.id, payload, req.user.id, req);
  res.status(200).json({ success: true, data: { book } });
});

const archive = catchAsync(async (req, res) => {
  await bookService.archiveBook(req.params.id, req.user.id, req);
  res.status(200).json({ success: true, data: { message: 'Book archived successfully.' } });
});

const bulkCreate = catchAsync(async (req, res) => {
  const result = await bookService.bulkCreate(req.body, req.user.id, req);
  res.status(201).json({ success: true, data: result });
});

const exportCsv = catchAsync(async (req, res) => {
  await bookService.exportCsv(res);
});

module.exports = { list, getOne, create, update, archive, bulkCreate, exportCsv };
