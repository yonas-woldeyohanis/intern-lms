const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Records an entry in the audit_logs table. Never throws — audit logging
 * failures must not break the primary request flow, but they are logged
 * to the application logger so they aren't silently lost.
 */
async function record({ userId = null, action, entityType = null, entityId = null, description = null, req = null }) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
       VALUES (:userId, :action, :entityType, :entityId, :description, :ip, :ua)`,
      {
        userId,
        action,
        entityType,
        entityId,
        description,
        ip: req ? req.ip : null,
        ua: req ? (req.headers['user-agent'] || null) : null
      }
    );
  } catch (err) {
    logger.error(`Failed to write audit log for action=${action}: ${err.message}`);
  }
}

async function list({ page = 1, limit = 25, action, userId, from, to, search }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = {};

  if (action) { conditions.push('a.action = :action'); params.action = action; }
  if (userId) { conditions.push('a.user_id = :userId'); params.userId = userId; }
  if (from) { conditions.push('a.created_at >= :from'); params.from = from; }
  if (to) { conditions.push('a.created_at <= :to'); params.to = to; }
  if (search) {
    conditions.push('(a.action LIKE :search OR a.description LIKE :search OR u.username LIKE :search OR u.first_name LIKE :search OR u.last_name LIKE :search)');
    params.search = `%${search}%`;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await db.query(
    `SELECT a.*, u.username, u.first_name, u.last_name
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT :limit OFFSET :offset`,
    { ...params, limit: Number(limit), offset: Number(offset) }
  );

  const [{ total }] = await db.query(
    `SELECT COUNT(*) AS total FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ${where}`,
    params
  );

  return { rows, total: Number(total), page: Number(page), limit: Number(limit) };
}

module.exports = { record, list };
