require('dotenv').config();

const required = [
  'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
  'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'
];

function assertRequiredEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    console.error('Copy backend/.env.example to backend/.env and fill in real values.');
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production') {
    if ((process.env.JWT_ACCESS_SECRET || '').length < 32) {
      console.error('[FATAL] JWT_ACCESS_SECRET must be at least 32 characters in production.');
      process.exit(1);
    }
    if ((process.env.JWT_REFRESH_SECRET || '').length < 32) {
      console.error('[FATAL] JWT_REFRESH_SECRET must be at least 32 characters in production.');
      process.exit(1);
    }
  }
}

assertRequiredEnv();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiBasePath: process.env.API_BASE_PATH || '/api/v1',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
    maxFailedLoginAttempts: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS, 10) || 5,
    accountLockMinutes: parseInt(process.env.ACCOUNT_LOCK_MINUTES, 10) || 15
  },

  rateLimit: {
    windowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || 15,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 300,
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 10
  },

  upload: {
    maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB, 10) || 5,
    uploadDir: process.env.UPLOAD_DIR || 'uploads'
  },

  logLevel: process.env.LOG_LEVEL || 'info'
};
