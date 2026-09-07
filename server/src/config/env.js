const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function toInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

module.exports = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: toInteger(process.env.PORT, 3000),
  API_PREFIX: process.env.API_PREFIX || "/api/v1",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://127.0.0.1:5500"
});
