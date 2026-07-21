const db = require('../config/database');

const BASE_SELECT = `
  SELECT u.id, u.employee_id, u.first_name, u.last_name, u.email, u.phone, u.username,
         u.password_hash, u.role_id, r.name AS role_name, u.department_id, d.name AS department_name,
         u.status, u.avatar_url, u.failed_login_attempts, u.locked_until, u.last_login_at,
         u.password_changed_at, u.created_at, u.updated_at
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN departments d ON d.id = u.department_id
`;

async function findById(id) {
  const rows = await db.query(`${BASE_SELECT} WHERE u.id = :id`, { id });
  return rows[0] || null;
}

async function findByUsernameOrEmail(identifier) {
  const rows = await db.query(
    `${BASE_SELECT} WHERE u.username = :identifier OR u.email = :identifier LIMIT 1`,
    { identifier }
  );
  return rows[0] || null;
}

async function existsByUsernameOrEmail(username, email) {
  const rows = await db.query(
    `SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1`,
    { username, email }
  );
  return rows.length > 0;
}

async function create(user) {
  const result = await db.query(
    `INSERT INTO users (employee_id, first_name, last_name, email, phone, username, password_hash, role_id, department_id, status, password_changed_at)
     VALUES (:employeeId, :firstName, :lastName, :email, :phone, :username, :passwordHash, :roleId, :departmentId, :status, NOW())`,
    user
  );
  return findById(result.insertId);
}

async function update(id, fields) {
  const allowed = ['first_name', 'last_name', 'email', 'phone', 'department_id', 'role_id', 'status', 'avatar_url'];
  const sets = [];
  const params = { id };
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) {
      sets.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (sets.length === 0) return findById(id);
  await db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = :id`, params);
  return findById(id);
}

async function updatePassword(id, passwordHash) {
  await db.query(
    `UPDATE users SET password_hash = :passwordHash, password_changed_at = NOW(),
     reset_password_token = NULL, reset_password_expires = NULL WHERE id = :id`,
    { id, passwordHash }
  );
}

async function recordLoginSuccess(id) {
  await db.query(
    `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = :id`,
    { id }
  );
}

async function recordLoginFailure(id, attempts, lockedUntil) {
  await db.query(
    `UPDATE users SET failed_login_attempts = :attempts, locked_until = :lockedUntil WHERE id = :id`,
    { id, attempts, lockedUntil }
  );
}

async function setResetToken(id, token, expires) {
  await db.query(
    `UPDATE users SET reset_password_token = :token, reset_password_expires = :expires WHERE id = :id`,
    { id, token, expires }
  );
}

async function findByResetToken(token) {
  const rows = await db.query(
    `${BASE_SELECT} WHERE u.reset_password_token = :token AND u.reset_password_expires > NOW()`,
    { token }
  );
  return rows[0] || null;
}

async function list({ page = 1, limit = 20, search, role, status, departmentId }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = {};

  if (search) {
    conditions.push('(u.first_name LIKE :search OR u.last_name LIKE :search OR u.email LIKE :search OR u.username LIKE :search OR u.employee_id LIKE :search)');
    params.search = `%${search}%`;
  }
  if (role) { conditions.push('r.name = :role'); params.role = role; }
  if (status) { conditions.push('u.status = :status'); params.status = status; }
  if (departmentId) { conditions.push('u.department_id = :departmentId'); params.departmentId = departmentId; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await db.query(
    `${BASE_SELECT} ${where} ORDER BY u.created_at DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit: Number(limit), offset: Number(offset) }
  );
  const [{ total }] = await db.query(
    `SELECT COUNT(*) AS total FROM users u JOIN roles r ON r.id = u.role_id ${where}`,
    params
  );

  return { rows: rows.map(stripHash), total: Number(total), page: Number(page), limit: Number(limit) };
}

function stripHash(user) {
  if (!user) return user;
  const { password_hash, reset_password_token, ...safe } = user;
  if (safe.role_name) { safe.role = safe.role_name; }
  return safe;
}

async function remove(id) {
  await db.query(`DELETE FROM users WHERE id = :id`, { id });
}

module.exports = {
  findById,
  findByUsernameOrEmail,
  existsByUsernameOrEmail,
  create,
  update,
  updatePassword,
  recordLoginSuccess,
  recordLoginFailure,
  setResetToken,
  findByResetToken,
  list,
  remove,
  stripHash
};
