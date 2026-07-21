const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const db = require('./config/database');
const startOverdueJob = require('./jobs/overdueJob');

async function start() {
  const connected = await db.testConnection();
  if (!connected) {
    logger.error('Could not connect to MySQL. Check backend/.env database credentials and that MySQL is running.');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    logger.info(`BMVEI LMS API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  startOverdueJob();

  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully.');
    server.close(() => process.exit(0));
  });
}

start();
