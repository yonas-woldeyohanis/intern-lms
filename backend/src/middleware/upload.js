const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const COVER_DIR = path.join(__dirname, '..', '..', 'uploads', 'covers');
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, COVER_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(AppError.badRequest('Only JPEG, PNG, or WEBP images are allowed for book covers.'));
  }
  cb(null, true);
}

const uploadCoverImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.upload.maxUploadMb * 1024 * 1024 }
});

module.exports = { uploadCoverImage };
