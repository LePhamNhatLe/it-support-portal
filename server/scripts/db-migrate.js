const fs = require("node:fs/promises");
const path = require("node:path");
const { getPool, closeDatabase } = require("../src/config/database");

async function hasColumn(connection, table, column) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(connection, table, column, definition) {
  if (await hasColumn(connection, table, column)) return false;
  await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  return true;
}

(async () => {
  try {
    const sql = await fs.readFile(path.resolve(process.cwd(), "server/database/schema.sql"), "utf8");
    const connection = await getPool().getConnection();
    try {
      for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map((item) => item.trim()).filter(Boolean)) {
        await connection.query(statement);
      }

      await addColumnIfMissing(connection, "users", "phone", "VARCHAR(32) NULL AFTER `department`");
      await addColumnIfMissing(
        connection,
        "users",
        "updated_at",
        "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER `created_at`"
      );
      await addColumnIfMissing(connection, "tickets", "resolved_at", "DATETIME(3) NULL AFTER `updated_at`");
    } finally {
      connection.release();
    }
    console.log("MySQL schema migration completed.");
  } catch (error) {
    console.error("MySQL migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
})();
