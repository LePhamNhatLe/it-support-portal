const { createResourceRouter } = require("./resource.routes");
const { requiredString, optionalEmail, enumValue, collect } = require("../utils/validators");

const ROLES = ["technical_lead", "technician", "user"];
const STATUSES = ["active", "disabled", "locked"];

async function validateCreate(body, store) {
  const errors = collect(
    requiredString(body.id, "Mã người dùng", 40),
    requiredString(body.name, "Họ tên", 120),
    requiredString(body.email, "Email", 160),
    optionalEmail(body.email, "Email"),
    enumValue(body.role, "Vai trò", ROLES),
    enumValue(body.status, "Trạng thái", STATUSES)
  );
  const users = await store.list("users");
  if (users.some((item) => item.email.toLowerCase() === String(body.email || "").toLowerCase())) {
    errors.push("Email đã tồn tại.");
  }
  return errors;
}

async function validateUpdate(body, current, store) {
  const merged = { ...current, ...body };
  const errors = collect(
    requiredString(merged.name, "Họ tên", 120),
    requiredString(merged.email, "Email", 160),
    optionalEmail(merged.email, "Email"),
    enumValue(merged.role, "Vai trò", ROLES),
    enumValue(merged.status, "Trạng thái", STATUSES)
  );
  const users = await store.list("users");
  if (users.some((item) => item.id !== current.id && item.email.toLowerCase() === String(merged.email).toLowerCase())) {
    errors.push("Email đã tồn tại.");
  }
  return errors;
}

module.exports = createResourceRouter({ collection: "users", validateCreate, validateUpdate });
