const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const store = require("../data/store");
const { authenticate } = require("../middleware/auth");
const { ok, fail } = require("../utils/http");

const router = express.Router();

function publicSessionUser(user) {
  return {
    email: String(user.email || "").toLowerCase(),
    name: user.name,
    role: user.role
  };
}

function signToken(user) {
  if (!env.JWT_SECRET) throw new Error("JWT_SECRET is required.");
  return jwt.sign(
    { email: user.email, name: user.name, role: user.role },
    env.JWT_SECRET,
    { algorithm: "HS256", subject: String(user.id), expiresIn: env.JWT_EXPIRES_IN }
  );
}

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return fail(res, 400, "VALIDATION_ERROR", "Email và mật khẩu không được để trống.");
    }

    if (typeof store.findUserAuthByEmail !== "function") {
      return fail(res, 503, "AUTH_STORE_UNAVAILABLE", "Nguồn dữ liệu hiện tại chưa hỗ trợ đăng nhập backend.");
    }

    const user = await store.findUserAuthByEmail(email);
    if (!user || !user.passwordHash) {
      return fail(res, 401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không chính xác.");
    }
    if (user.status === "locked") {
      return fail(res, 423, "ACCOUNT_LOCKED", "Tài khoản đang bị khóa.");
    }
    if (user.status !== "active") {
      return fail(res, 403, "ACCOUNT_DISABLED", "Tài khoản đã bị vô hiệu hóa.");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return fail(res, 401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không chính xác.");

    return ok(res, { token: signToken(user), user: publicSessionUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await store.get("users", req.user.id);
    if (!user || user.status !== "active") {
      return fail(res, 401, "SESSION_REVOKED", "Tài khoản không còn hoạt động.");
    }
    return ok(res, publicSessionUser(user));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
