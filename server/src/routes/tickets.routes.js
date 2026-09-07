const { createResourceRouter } = require("./resource.routes");
const { requiredString, optionalEmail, enumValue, collect } = require("../utils/validators");

const CATEGORIES = ["hardware", "software", "network", "account", "printer", "other"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "assigned", "in_progress", "pending", "resolved", "closed", "reopened"];

function validateCreate(body) {
  return collect(
    requiredString(body.id, "Mã phiếu", 40),
    requiredString(body.title, "Tiêu đề", 120),
    requiredString(body.description, "Mô tả", 1000),
    enumValue(body.category, "Danh mục", CATEGORIES),
    enumValue(body.priority, "Ưu tiên", PRIORITIES),
    enumValue(body.status, "Trạng thái", STATUSES),
    optionalEmail(body.requesterEmail, "Email người yêu cầu"),
    optionalEmail(body.assigneeEmail, "Email người phụ trách")
  );
}

function validateUpdate(body, current) {
  const merged = { ...current, ...body };
  return collect(
    requiredString(merged.title, "Tiêu đề", 120),
    requiredString(merged.description, "Mô tả", 1000),
    enumValue(merged.category, "Danh mục", CATEGORIES),
    enumValue(merged.priority, "Ưu tiên", PRIORITIES),
    enumValue(merged.status, "Trạng thái", STATUSES),
    optionalEmail(merged.requesterEmail, "Email người yêu cầu"),
    optionalEmail(merged.assigneeEmail, "Email người phụ trách")
  );
}

module.exports = createResourceRouter({ collection: "tickets", validateCreate, validateUpdate });
