const fs = require("node:fs/promises");
const path = require("node:path");
const { getPool, closeDatabase } = require("../src/config/database");

(async () => {
  try {
    const sql = await fs.readFile(path.resolve(process.cwd(), "server/database/schema.sql"), "utf8");
    const connection = await getPool().getConnection();
    try {
      for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map((item) => item.trim()).filter(Boolean)) {
        await connection.query(statement);
      }
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
