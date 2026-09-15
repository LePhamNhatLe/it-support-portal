const { pingDatabase, closeDatabase } = require("../src/config/database");

(async () => {
  try {
    const info = await pingDatabase();
    console.log("MySQL connection OK");
    console.log(`Database: ${info.databaseName}`);
    console.log(`Version: ${info.version}`);
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
})();
