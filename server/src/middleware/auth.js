const jwt = require("jsonwebtoken");
const env = require("../config/env");
const store = require("../data/store");
const { fail } = require("../utils/http");

function getToken(req) {
  const header = req.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

async function authenticate(req, res, next) {
  if (!env.JWT_SECRET) {
    return fail(res, 500, "AUTH_NOT_CONFIGURED", "Backend chưa cấu hình khóa xác thực.");
  }

  const token = getToken(req);
  if (!token) return fail(res, 401, "AUTH_REQUIRED", "Cần đăng nhập để sử dụng API này.");

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    return fail(res, 401, "INVALID_TOKEN", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  }

  try {
    const current = await store.get("users", payload.sub);
    if (!current || current.status !== "active") {
      return fail(res, 401, "SESSION_REVOKED", "Tài khoản không còn hoạt động.");
    }

    req.user = {
      id: current.id,
      email: current.email,
      name: current.name,
      role: current.role
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

function authorize(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) return fail(res, 401, "AUTH_REQUIRED", "Cần đăng nhập để sử dụng API này.");
    if (!roles.includes(req.user.role)) {
      return fail(res, 403, "FORBIDDEN", "Tài khoản không có quyền thực hiện thao tác này.");
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
