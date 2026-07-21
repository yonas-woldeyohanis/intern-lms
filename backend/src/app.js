const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { cors, helmet, hpp, generalLimiter, sanitizeInput } = require('./middleware/security');

const app = express();

// Behind a reverse proxy (nginx) on the LAN server — needed for correct req.ip / rate limiting
app.set('trust proxy', 1);

// --- Security headers & CORS ------------------------------------------------
app.use(helmet);
app.use(cors);
app.use(hpp);

// --- Body parsing ------------------------------------------------------------
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(compression());

// --- Input sanitization (XSS defense) ----------------------------------------
app.use(sanitizeInput);

// --- Rate limiting -------------------------------------------------------------
app.use(env.apiBasePath, generalLimiter);

// --- HTTP request logging -------------------------------------------------------
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

// --- Static file serving for uploaded covers & generated QR codes -----------
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- API routes ------------------------------------------------------------------
app.use(env.apiBasePath, routes);

// --- 404 + centralized error handler --------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
