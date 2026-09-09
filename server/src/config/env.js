const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function toInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET || (nodeEnv === "production" ? "" : "it-support-portal-dev-secret-change-me");

module.exports = Object.freeze({
  NODE_ENV: nodeEnv,
  PORT: toInteger(process.env.PORT, 3000),
  API_PREFIX: process.env.API_PREFIX || "/api/v1",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://127.0.0.1:5500",
  DATA_SOURCE: process.env.DATA_SOURCE || "memory",
  DB_HOST: process.env.DB_HOST || "",
  DB_PORT: toInteger(process.env.DB_PORT, 3306),
  DB_USER: process.env.DB_USER || "",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "it_support_portal",
  DB_SSL: toBoolean(process.env.DB_SSL, true),
  DB_CA_PATH: process.env.DB_CA_PATH || "",
  DB_CONNECTION_LIMIT: toInteger(process.env.DB_CONNECTION_LIMIT, 4),
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
  BCRYPT_ROUNDS: Math.min(Math.max(toInteger(process.env.BCRYPT_ROUNDS, 12), 10), 14)
});
