const db = require('../config/database');

/**
 * Factory for straightforward lookup-table repositories (categories, authors,
 * publishers, shelves, departments). Centralizes the CRUD SQL so each entity
 * doesn't need a hand-rolled, near-identical repository file.
 *
 * All queries are parameterized — table/column names are developer-supplied
 * constants (never user input), so this remains injection-safe.
 */
function createGenericRepository(table, { searchableColumns = ['name'], orderBy = 'name ASC' } = {}) {
  return {
    async findAll({ search, page, limit } = {}) {
      const conditions = [];
      const params = {};
      if (search && searchableColumns.length) {
        conditions.push(`(${searchableColumns.map((c) => `${c} LIKE :search`).join(' OR ')})`);
        params.search = `%${search}%`;
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      if (page && limit) {
        const offset = (page - 1) * limit;
        const rows = await db.query(
          `SELECT * FROM ${table} ${where} ORDER BY ${orderBy} LIMIT :limit OFFSET :offset`,
          { ...params, limit: Number(limit), offset: Number(offset) }
        );
        const [{ total }] = await db.query(`SELECT COUNT(*) AS total FROM ${table} ${where}`, params);
        return { rows, total: Number(total), page: Number(page), limit: Number(limit) };
      }

      return db.query(`SELECT * FROM ${table} ${where} ORDER BY ${orderBy}`, params);
    },

    async findById(id) {
      const rows = await db.query(`SELECT * FROM ${table} WHERE id = :id`, { id });
      return rows[0] || null;
    },

    async create(fields) {
      const columns = Object.keys(fields);
      const placeholders = columns.map((c) => `:${c}`);
      const result = await db.query(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        fields
      );
      return this.findById(result.insertId);
    },

    async update(id, fields) {
      const columns = Object.keys(fields);
      if (columns.length === 0) return this.findById(id);
      const sets = columns.map((c) => `${c} = :${c}`).join(', ');
      await db.query(`UPDATE ${table} SET ${sets} WHERE id = :id`, { ...fields, id });
      return this.findById(id);
    },

    async remove(id) {
      await db.query(`DELETE FROM ${table} WHERE id = :id`, { id });
    }
  };
}

module.exports = createGenericRepository;
