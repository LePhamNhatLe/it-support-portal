const fs = require("node:fs/promises");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const env = require("../src/config/env");
const { getPool, closeDatabase } = require("../src/config/database");

(async () => {
  try {
    const sql = await fs.readFile(path.resolve(process.cwd(), "server/database/seed.sql"), "utf8");
    const connection = await getPool().getConnection();
    try {
      for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map((item) => item.trim()).filter(Boolean)) {
        await connection.query(statement);
      }

      const passwordHash = await bcrypt.hash("123456", env.BCRYPT_ROUNDS);
      await connection.execute(
        "UPDATE users SET password_hash = ? WHERE email IN (?, ?, ?) AND (password_hash IS NULL OR password_hash = '')",
        [passwordHash, "lead@itsupport.local", "technician@itsupport.local", "user@itsupport.local"]
      );
    } finally {
      connection.release();
    }
    console.log("MySQL demo seed completed with backend login credentials.");
  } catch (error) {
    console.error("MySQL seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
})();
