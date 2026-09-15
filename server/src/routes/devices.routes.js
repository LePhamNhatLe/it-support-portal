const { createResourceRouter } = require("./resource.routes");
const { requiredString, optionalEmail, ipv4, enumValue, collect } = require("../utils/validators");

const TYPES = ["desktop", "laptop", "printer", "router", "switch", "access_point", "server", "other"];
const STATUSES = ["in_use", "maintenance", "storage", "broken", "retired"];

function validateCreate(body) {
  return collect(
    requiredString(body.id, "Mã thiết bị", 40),
    requiredString(body.name, "Tên thiết bị", 120),
    enumValue(body.type, "Loại thiết bị", TYPES),
    enumValue(body.status, "Trạng thái", STATUSES),
    optionalEmail(body.userEmail, "Email người sử dụng"),
    ipv4(body.ipAddress)
  );
}

function validateUpdate(body, current) {
  const merged = { ...current, ...body };
  return collect(
    requiredString(merged.name, "Tên thiết bị", 120),
    enumValue(merged.type, "Loại thiết bị", TYPES),
    enumValue(merged.status, "Trạng thái", STATUSES),
    optionalEmail(merged.userEmail, "Email người sử dụng"),
    ipv4(merged.ipAddress)
  );
}

module.exports = createResourceRouter({ collection: "devices", validateCreate, validateUpdate });
