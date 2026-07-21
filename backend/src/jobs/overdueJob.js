const logger = require('../config/logger');
const borrowRepository = require('../repositories/borrowRepository');

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/**
 * Periodically flips 'borrowed' loans past their due_date to 'overdue'.
 * Runs once at startup, then every 6 hours. For a production deployment
 * with process managers (pm2/systemd), this in-process interval is fine
 * for a single-instance LAN deployment; a real cron/task-scheduler entry
 * calling the same repository function is a drop-in alternative.
 */
function startOverdueJob() {
  const run = async () => {
    try {
      await borrowRepository.markOverdueRecords();
      logger.info('Overdue job: borrow records refreshed.');
    } catch (err) {
      logger.error(`Overdue job failed: ${err.message}`);
    }
  };
  run();
  setInterval(run, SIX_HOURS_MS);
}

module.exports = startOverdueJob;
