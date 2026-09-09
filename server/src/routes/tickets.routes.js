const express = require("express");
const store = require("../data/store");
const { ok, created, fail } = require("../utils/http");
const { requiredString, optionalEmail, enumValue, collect } = require("../utils/validators");

const router = express.Router();

const CATEGORIES = ["hardware", "software", "network", "account", "printer", "other"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "assigned", "in_progress", "pending", "resolved", "closed", "reopened"];
const TECHNICIAN_STATUS_TARGETS = ["in_progress", "pending", "resolved"];
const ASSIGNEE_ROLES = ["technical_lead", "technician"];
const CONTENT_FIELDS = ["title", "description", "category", "priority", "deviceId"];
const MUTABLE_FIELDS = new Set([
  ...CONTENT_FIELDS,
  "status",
  "requesterEmail",
  "assigneeEmail",
  "resolvedAt"
]);

const STATUS_TRANSITIONS = {
  open: ["assigned"],
  assigned: ["in_progress"],
  in_progress: ["pending", "resolved"],
  pending: ["in_progress", "resolved"],
  resolved: ["closed"],
  closed: ["reopened"],
  reopened: ["assigned"]
};

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function sameNullableEmail(a, b) {
  return normalizeEmail(a) === normalizeEmail(b);
}

function sameNullableValue(a, b) {
  return (a ?? null) === (b ?? null);
}

function isRequester(ticket, actor) {
  return normalizeEmail(ticket && ticket.requesterEmail) === normalizeEmail(actor && actor.email);
}

function isAssignee(ticket, actor) {
  return normalizeEmail(ticket && ticket.assigneeEmail) === normalizeEmail(actor && actor.email);
}

function canViewTicket(ticket, actor) {
  if (!ticket || !actor) return false;
  if (actor.role === "technical_lead") return true;
  if (actor.role === "technician") return isAssignee(ticket, actor);
  if (actor.role === "user") return isRequester(ticket, actor);
  return false;
}

function canEditContent(ticket, actor) {
  if (!ticket || !actor) return false;
  if (actor.role === "technical_lead") return true;
  if (actor.role === "technician") {
    return isAssignee(ticket, actor) && !["resolved", "closed"].includes(ticket.status);
  }
  if (actor.role === "user") {
    return isRequester(ticket, actor) && ["open", "reopened"].includes(ticket.status);
  }
  return false;
}

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

function forbidden(res, message = "Tài khoản hiện tại không có quyền thao tác phiếu này.") {
  return fail(res, 403, "TICKET_SCOPE_FORBIDDEN", message);
}

function hasUnknownFields(body) {
  return Object.keys(body || {}).some((field) => !MUTABLE_FIELDS.has(field));
}

async function getAssignableUser(email) {
  const target = normalizeEmail(email);
  if (!target) return null;
  const users = await store.list("users");
  return users.find((user) => user && normalizeEmail(user.email) === target) || null;
}

async function validateAssignee(email) {
  if (email === null || email === undefined || email === "") return true;
  const user = await getAssignableUser(email);
  return Boolean(user && user.status === "active" && ASSIGNEE_ROLES.includes(user.role));
}

function buildContentPatch(body) {
  const patch = {};
  CONTENT_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) patch[field] = body[field];
  });
  return patch;
}

function transitionAllowed(fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  return (STATUS_TRANSITIONS[fromStatus] || []).includes(toStatus);
}

router.get("/", async (req, res, next) => {
  try {
    const tickets = await store.list("tickets");
    return ok(res, tickets.filter((ticket) => canViewTicket(ticket, req.user)));
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const ticket = await store.get("tickets", req.params.id);
    if (!ticket) return fail(res, 404, "NOT_FOUND", "Không tìm thấy dữ liệu.");
    if (!canViewTicket(ticket, req.user)) return forbidden(res);
    return ok(res, ticket);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = { ...(req.body || {}) };

    if (req.user.role !== "technical_lead") {
      if (normalizeEmail(body.requesterEmail) !== normalizeEmail(req.user.email)) {
        return forbidden(res, "Không được tạo phiếu thay cho người dùng khác.");
      }
      if (body.assigneeEmail !== null && body.assigneeEmail !== undefined && body.assigneeEmail !== "") {
        return forbidden(res, "Không được tự phân công người phụ trách khi tạo phiếu.");
      }
      if (body.status !== "open") {
        return forbidden(res, "Phiếu mới phải ở trạng thái open.");
      }
      body.requesterEmail = normalizeEmail(req.user.email);
      body.assigneeEmail = null;
      body.status = "open";
      body.resolvedAt = null;
    }

    const errors = validateCreate(body);
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
    if (await store.get("tickets", body.id)) return fail(res, 409, "DUPLICATE_ID", "Mã dữ liệu đã tồn tại.");

    if (body.assigneeEmail && !(await validateAssignee(body.assigneeEmail))) {
      return fail(res, 400, "INVALID_ASSIGNEE", "Người phụ trách phải là tài khoản kỹ thuật đang hoạt động.");
    }

    return created(res, await store.create("tickets", body));
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const body = req.body || {};
    const current = await store.get("tickets", req.params.id);

    if (!current) return fail(res, 404, "NOT_FOUND", "Không tìm thấy dữ liệu.");
    if (!canViewTicket(current, req.user)) return forbidden(res);
    if (hasUnknownFields(body)) {
      return fail(res, 400, "VALIDATION_ERROR", "Dữ liệu chứa trường không được phép cập nhật.");
    }

    const errors = validateUpdate(body, current);
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);

    const requesterChanged = Object.prototype.hasOwnProperty.call(body, "requesterEmail") &&
      !sameNullableEmail(body.requesterEmail, current.requesterEmail);
    const assigneeChanged = Object.prototype.hasOwnProperty.call(body, "assigneeEmail") &&
      !sameNullableEmail(body.assigneeEmail, current.assigneeEmail);
    const statusChanged = Object.prototype.hasOwnProperty.call(body, "status") && body.status !== current.status;
    const resolvedAtChanged = Object.prototype.hasOwnProperty.call(body, "resolvedAt") &&
      !sameNullableValue(body.resolvedAt, current.resolvedAt);
    const contentPatch = buildContentPatch(body);
    const hasContentChanges = Object.keys(contentPatch).length > 0;

    if (req.user.role === "user") {
      if (requesterChanged || assigneeChanged || statusChanged || resolvedAtChanged) {
        return forbidden(res, "Người dùng không được thay đổi requester, assignee hoặc workflow của phiếu.");
      }
      if (!canEditContent(current, req.user)) return forbidden(res);
      return ok(res, await store.update("tickets", req.params.id, contentPatch));
    }

    if (req.user.role === "technician") {
      if (requesterChanged || assigneeChanged || resolvedAtChanged) {
        return forbidden(res, "Kỹ thuật viên không được thay đổi requester hoặc assignee của phiếu.");
      }
      if (!isAssignee(current, req.user)) return forbidden(res);

      const patch = { ...contentPatch };

      if (hasContentChanges && !canEditContent(current, req.user)) return forbidden(res);

      if (statusChanged) {
        if (!transitionAllowed(current.status, body.status) || !TECHNICIAN_STATUS_TARGETS.includes(body.status)) {
          return forbidden(res, "Kỹ thuật viên không được thực hiện chuyển trạng thái này.");
        }
        patch.status = body.status;
        if (body.status === "resolved") patch.resolvedAt = new Date().toISOString();
      }

      if (!Object.keys(patch).length) return ok(res, current);
      return ok(res, await store.update("tickets", req.params.id, patch));
    }

    if (req.user.role !== "technical_lead") return forbidden(res);

    const patch = { ...contentPatch };

    if (requesterChanged) patch.requesterEmail = normalizeEmail(body.requesterEmail) || null;

    if (assigneeChanged) {
      if (body.assigneeEmail && !(await validateAssignee(body.assigneeEmail))) {
        return fail(res, 400, "INVALID_ASSIGNEE", "Người phụ trách phải là tài khoản kỹ thuật đang hoạt động.");
      }
      patch.assigneeEmail = normalizeEmail(body.assigneeEmail) || null;
    }

    if (statusChanged) {
      if (!transitionAllowed(current.status, body.status)) {
        return fail(res, 409, "INVALID_STATUS_TRANSITION", "Không thể chuyển sang trạng thái được yêu cầu từ trạng thái hiện tại.");
      }
      if (body.status === "assigned") {
        const effectiveAssignee = assigneeChanged ? patch.assigneeEmail : current.assigneeEmail;
        if (!effectiveAssignee) {
          return fail(res, 409, "ASSIGNEE_REQUIRED", "Phiếu phải có người phụ trách trước khi chuyển sang assigned.");
        }
      }
      patch.status = body.status;
      if (body.status === "resolved") patch.resolvedAt = new Date().toISOString();
      if (body.status === "reopened") patch.resolvedAt = null;
    }

    if (!Object.keys(patch).length) return ok(res, current);
    return ok(res, await store.update("tickets", req.params.id, patch));
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const current = await store.get("tickets", req.params.id);
    if (!current) return fail(res, 404, "NOT_FOUND", "Không tìm thấy dữ liệu.");
    if (req.user.role !== "technical_lead") return forbidden(res, "Chỉ Technical Lead được xóa phiếu hỗ trợ.");
    const deleted = await store.remove("tickets", req.params.id);
    return deleted ? res.status(204).end() : fail(res, 404, "NOT_FOUND", "Không tìm thấy dữ liệu.");
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
