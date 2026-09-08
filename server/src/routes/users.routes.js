const express = require("express");
const bcrypt = require("bcryptjs");
const env = require("../config/env");
const store = require("../data/store");
const { ok, created, fail } = require("../utils/http");
const { requiredString, optionalEmail, enumValue, collect } = require("../utils/validators");

const router = express.Router();
const ROLES = ["technical_lead", "technician", "user"];
const STATUSES = ["active", "disabled", "locked"];

function validatePassword(password, required) {
  const value = String(password || "");
  if (!value && !required) return null;
  if (value.length < 6 || value.length > 72) return "Mật khẩu phải từ 6 đến 72 ký tự.";
  return null;
}

async function validationErrors(body, current) {
  const merged = { ...(current || {}), ...(body || {}) };
  const errors = collect(
    requiredString(merged.name, "Họ tên", 120),
    requiredString(merged.email, "Email", 160),
    optionalEmail(merged.email, "Email"),
    enumValue(merged.role, "Vai trò", ROLES),
    enumValue(merged.status, "Trạng thái", STATUSES),
    validatePassword(body.password, !current)
  );
  if (!current) errors.push(...collect(requiredString(body.id, "Mã người dùng", 40)));
  const users = await store.list("users");
  if (users.some((item) => (!current || item.id !== current.id) && item.email.toLowerCase() === String(merged.email || "").toLowerCase())) {
    errors.push("Email đã tồn tại.");
  }
  return errors;
}

router.get("/", async (req, res, next) => {
  try { return ok(res, await store.list("users")); } catch (error) { return next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const item = await store.get("users", req.params.id);
    return item ? ok(res, item) : fail(res, 404, "NOT_FOUND", "Không tìm thấy người dùng.");
  } catch (error) { return next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = await validationErrors(body, null);
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
    if (await store.get("users", body.id)) return fail(res, 409, "DUPLICATE_ID", "Mã người dùng đã tồn tại.");
    if (typeof store.setUserPasswordHash !== "function") return fail(res, 503, "AUTH_STORE_UNAVAILABLE", "Nguồn dữ liệu chưa hỗ trợ thông tin đăng nhập.");

    const { password, ...userData } = body;
    const user = await store.create("users", userData);
    const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    await store.setUserPasswordHash(user.id, hash);
    return created(res, user);
  } catch (error) { return next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const current = await store.get("users", req.params.id);
    if (!current) return fail(res, 404, "NOT_FOUND", "Không tìm thấy người dùng.");
    const body = req.body || {};
    const errors = await validationErrors(body, current);
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);

    const { password, ...patch } = body;
    const user = await store.update("users", req.params.id, patch);
    if (password) {
      if (typeof store.setUserPasswordHash !== "function") return fail(res, 503, "AUTH_STORE_UNAVAILABLE", "Nguồn dữ liệu chưa hỗ trợ đổi mật khẩu.");
      await store.setUserPasswordHash(req.params.id, await bcrypt.hash(password, env.BCRYPT_ROUNDS));
    }
    return ok(res, user);
  } catch (error) { return next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await store.remove("users", req.params.id);
    return deleted ? res.status(204).end() : fail(res, 404, "NOT_FOUND", "Không tìm thấy người dùng.");
  } catch (error) { return next(error); }
});

module.exports = router;
