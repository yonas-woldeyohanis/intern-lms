const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const { filterXSS } = require('xss');
const env = require('../config/env');
const AppError = require('../utils/AppError');

// --- CORS: only the configured frontend origin(s) may call the API ---------
const allowedOrigins = [env.clientUrl];
const corsOptions = {
  origin(origin, callback) {
    // Allow any origin in this LAN environment to support mobile/cross-device access
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// --- Helmet: secure HTTP headers -------------------------------------------
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  crossOriginResourcePolicy: { policy: 'same-site' }
});

// --- General API rate limiter ------------------------------------------------
const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } }
});

// --- Stricter limiter for auth endpoints (brute-force defense) -------------
const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts. Please try again later.' } }
});

// --- Recursive request-body/query/params sanitizer (XSS defense) -----------
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return filterXSS(value.trim(), { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] });
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = sanitizeValue(value[key]);
    }
    return out;
  }
  return value;
}

function sanitizeInput(req, res, next) {
  // Skip sanitization for multipart/form-data (file uploads) — multer handles field parsing
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) return next();

  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  // req.query is a getter-only in newer Express; mutate in place instead of reassigning
  if (req.query) {
    const cleaned = sanitizeValue(req.query);
    Object.keys(req.query).forEach((k) => delete req.query[k]);
    Object.assign(req.query, cleaned);
  }
  next();
}

module.exports = {
  cors: cors(corsOptions),
  helmet: helmetMiddleware,
  hpp: hpp(),
  generalLimiter,
  authLimiter,
  sanitizeInput
};
