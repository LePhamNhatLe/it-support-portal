const { createResourceRouter } = require("./resource.routes");
const { requiredString, ipv4, enumValue, collect } = require("../utils/validators");

const TYPES = ["router", "switch", "access_point", "firewall", "server", "modem", "other"];
const STATUSES = ["online", "offline", "maintenance", "warning"];

async function validateCreate(body, store) {
  const errors = collect(
    requiredString(body.id, "Mã thiết bị", 40),
    requiredString(body.name, "Tên thiết bị", 120),
    enumValue(body.type, "Loại thiết bị", TYPES),
    enumValue(body.status, "Trạng thái", STATUSES),
    ipv4(body.ipAddress),
    ipv4(body.gateway, "Gateway")
  );
  const entries = await store.list("network");
  if (entries.some((item) => item.ipAddress === body.ipAddress)) errors.push("Địa chỉ IP đã tồn tại.");
  if (body.macAddress && entries.some((item) => String(item.macAddress).toLowerCase() === String(body.macAddress).toLowerCase())) errors.push("Địa chỉ MAC đã tồn tại.");
  return errors;
}

async function validateUpdate(body, current, store) {
  const merged = { ...current, ...body };
  const errors = collect(
    requiredString(merged.name, "Tên thiết bị", 120),
    enumValue(merged.type, "Loại thiết bị", TYPES),
    enumValue(merged.status, "Trạng thái", STATUSES),
    ipv4(merged.ipAddress),
    ipv4(merged.gateway, "Gateway")
  );
  const entries = (await store.list("network")).filter((item) => item.id !== current.id);
  if (entries.some((item) => item.ipAddress === merged.ipAddress)) errors.push("Địa chỉ IP đã tồn tại.");
  if (merged.macAddress && entries.some((item) => String(item.macAddress).toLowerCase() === String(merged.macAddress).toLowerCase())) errors.push("Địa chỉ MAC đã tồn tại.");
  return errors;
}

module.exports = createResourceRouter({ collection: "network", validateCreate, validateUpdate });
