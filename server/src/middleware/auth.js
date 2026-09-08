const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { fail } = require("../utils/http");

function getToken(req) {
  const header = req.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

function authenticate(req, res, next) {
  if (!env.JWT_SECRET) {
    return fail(res, 500, "AUTH_NOT_CONFIGURED", "Backend chưa cấu hình khóa xác thực.");
  }

  const token = getToken(req);
  if (!token) return fail(res, 401, "AUTH_REQUIRED", "Cần đăng nhập để sử dụng API này.");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role
    };
    return next();
  } catch (error) {
    return fail(res, 401, "INVALID_TOKEN", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
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
