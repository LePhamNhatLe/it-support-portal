const express = require("express");
const cors = require("cors");
const crypto = require("node:crypto");
const env = require("./config/env");
const apiRoutes = require("./routes");
const { fail } = require("./utils/http");

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === env.CORS_ORIGIN) return true;

  if (env.NODE_ENV === "development") {
    try {
      const url = new URL(origin);
      return ["localhost", "127.0.0.1"].includes(url.hostname);
    } catch (error) {
      return false;
    }
  }

  return false;
}

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("CORS origin không được phép."));
    },
    credentials: false
  }));
  app.use(express.json({ limit: "1mb" }));

  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    next();
  });

  app.use(env.API_PREFIX, apiRoutes);

  app.use((req, res) => fail(res, 404, "ROUTE_NOT_FOUND", "API endpoint không tồn tại."));

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    console.error(`[${req.requestId || "no-request-id"}]`, error);
    return fail(res, 500, "INTERNAL_ERROR", "Đã xảy ra lỗi phía máy chủ.");
  });

  return app;
}

module.exports = { createApp };
