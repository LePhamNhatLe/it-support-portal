const express = require("express");
const bcrypt = require("bcryptjs");
const env = require("../config/env");
const store = require("../data/store");
const { ok, created, fail } = require("../utils/http");
const { requiredString, optionalEmail, enumValue, collect } = require("../utils/validators");

const router = express.Router();
const ROLES = ["technical_lead", "technician", "user"];
const STATUSES = ["active", "disabled", "locked"];

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

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
  if (users.some((item) => (!current || item.id !== current.id) && normalizeEmail(item.email) === normalizeEmail(merged.email))) {
    errors.push("Email đã tồn tại.");
  }
  return errors;
}

function selfUpdateError(req, current, body) {
  if (!req.user || String(req.user.id) !== String(current.id)) return null;
  if (Object.prototype.hasOwnProperty.call(body, "role") && body.role !== current.role) {
    return { code: "SELF_ROLE_CHANGE_FORBIDDEN", message: "Không thể tự thay đổi vai trò của tài khoản đang đăng nhập." };
  }
  if (Object.prototype.hasOwnProperty.call(body, "status") && body.status !== "active") {
    return { code: "SELF_STATUS_CHANGE_FORBIDDEN", message: "Không thể tự khóa hoặc vô hiệu tài khoản đang đăng nhập." };
  }
  return null;
}

async function getUserLinkCounts(user) {
  const email = normalizeEmail(user && user.email);
  const [tickets, devices] = await Promise.all([
    store.list("tickets"),
    store.list("devices")
  ]);
  return {
    tickets: tickets.filter((ticket) => ticket && (
      normalizeEmail(ticket.requesterEmail) === email ||
      normalizeEmail(ticket.assigneeEmail) === email
    )).length,
    devices: devices.filter((device) => device && normalizeEmail(device.userEmail) === email).length
  };
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
    const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const user = await store.create("users", userData);
    const credentialSaved = await store.setUserPasswordHash(user.id, hash);
    if (!credentialSaved) {
      await store.remove("users", user.id);
      return fail(res, 500, "CREDENTIAL_SAVE_FAILED", "Không thể tạo thông tin đăng nhập cho người dùng.");
    }
    return created(res, user);
  } catch (error) { return next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const current = await store.get("users", req.params.id);
    if (!current) return fail(res, 404, "NOT_FOUND", "Không tìm thấy người dùng.");
    const body = req.body || {};

    const selfProtection = selfUpdateError(req, current, body);
    if (selfProtection) return fail(res, 403, selfProtection.code, selfProtection.message);

    const errors = await validationErrors(body, current);
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);

    const { password, ...patch } = body;
    if (password && typeof store.setUserPasswordHash !== "function") {
      return fail(res, 503, "AUTH_STORE_UNAVAILABLE", "Nguồn dữ liệu chưa hỗ trợ đổi mật khẩu.");
    }

    const passwordHash = password ? await bcrypt.hash(password, env.BCRYPT_ROUNDS) : null;
    const user = await store.update("users", req.params.id, patch);
    if (passwordHash) {
      const credentialSaved = await store.setUserPasswordHash(req.params.id, passwordHash);
      if (!credentialSaved) return fail(res, 500, "CREDENTIAL_SAVE_FAILED", "Không thể cập nhật mật khẩu người dùng.");
    }
    return ok(res, user);
  } catch (error) { return next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const current = await store.get("users", req.params.id);
    if (!current) return fail(res, 404, "NOT_FOUND", "Không tìm thấy người dùng.");
    if (req.user && String(req.user.id) === String(current.id)) {
      return fail(res, 403, "SELF_DELETE_FORBIDDEN", "Không thể xóa chính tài khoản đang đăng nhập.");
    }

    const links = await getUserLinkCounts(current);
    if (links.tickets > 0 || links.devices > 0) {
      return fail(
        res,
        409,
        "USER_IN_USE",
        "Không thể xóa người dùng đang liên kết với phiếu hỗ trợ hoặc thiết bị.",
        links
      );
    }

    const deleted = await store.remove("users", req.params.id);
    return deleted ? res.status(204).end() : fail(res, 404, "NOT_FOUND", "Không tìm thấy người dùng.");
  } catch (error) { return next(error); }
});

module.exports = router;
