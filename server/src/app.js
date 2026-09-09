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

function mapDatabaseError(error) {
  if (!error || typeof error !== "object") return null;
  if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
    return { status: 409, code: "DUPLICATE_VALUE", message: "Dữ liệu bị trùng với bản ghi đã tồn tại." };
  }
  if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
    return { status: 409, code: "RESOURCE_IN_USE", message: "Không thể xóa dữ liệu vì đang được bản ghi khác sử dụng." };
  }
  if (error.code === "ER_NO_REFERENCED_ROW_2" || error.errno === 1452) {
    return { status: 409, code: "INVALID_REFERENCE", message: "Dữ liệu tham chiếu không tồn tại hoặc không hợp lệ." };
  }
  return null;
}

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      const error = new Error("CORS origin không được phép.");
      error.code = "CORS_NOT_ALLOWED";
      return callback(error);
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

    if (error && error.code === "CORS_NOT_ALLOWED") {
      return fail(res, 403, "CORS_NOT_ALLOWED", "Nguồn truy cập không được phép.");
    }

    const mapped = mapDatabaseError(error);
    if (mapped) return fail(res, mapped.status, mapped.code, mapped.message);

    return fail(res, 500, "INTERNAL_ERROR", "Đã xảy ra lỗi phía máy chủ.");
  });

  return app;
}

module.exports = { createApp, mapDatabaseError };
