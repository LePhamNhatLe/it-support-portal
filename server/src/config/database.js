const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const env = require("./env");

let pool;

function buildSslOptions() {
  if (!env.DB_SSL) return undefined;
  if (!env.DB_CA_PATH) {
    throw new Error("DB_SSL=true nhưng chưa cấu hình DB_CA_PATH trong .env.");
  }

  const caPath = path.resolve(process.cwd(), env.DB_CA_PATH);
  if (!fs.existsSync(caPath)) {
    throw new Error(`Không tìm thấy CA certificate tại: ${caPath}`);
  }

  return {
    ca: fs.readFileSync(caPath, "utf8"),
    rejectUnauthorized: true
  };
}

function getPool() {
  if (pool) return pool;

  if (!env.DB_HOST || !env.DB_USER || !env.DB_NAME) {
    throw new Error("Thiếu cấu hình MySQL. Kiểm tra DB_HOST, DB_USER và DB_NAME trong .env.");
  }

  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Math.max(1, Math.min(env.DB_CONNECTION_LIMIT, 10)),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: buildSslOptions(),
    timezone: "Z",
    charset: "utf8mb4"
  });

  return pool;
}

async function pingDatabase() {
  const connection = await getPool().getConnection();
  try {
    await connection.ping();
    const [rows] = await connection.query("SELECT DATABASE() AS databaseName, VERSION() AS version");
    return rows[0];
  } finally {
    connection.release();
  }
}

async function closeDatabase() {
  if (!pool) return;
  const current = pool;
  pool = undefined;
  await current.end();
}

module.exports = { getPool, pingDatabase, closeDatabase };
