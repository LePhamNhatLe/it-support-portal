(function () {
    const TICKET_CATEGORIES = [
        "hardware",
        "software",
        "network",
        "account",
        "printer",
        "other"
    ];

    const TICKET_PRIORITIES = ["low", "medium", "high", "critical"];
    const TICKET_STATUSES = [
        "open",
        "assigned",
        "in_progress",
        "pending",
        "resolved",
        "closed",
        "reopened"
    ];

    const STATUS_TRANSITIONS = {
        open: ["assigned"],
        assigned: ["in_progress"],
        in_progress: ["pending", "resolved"],
        pending: ["in_progress", "resolved"],
        resolved: ["closed"],
        closed: ["reopened"],
        reopened: ["assigned"]
    };

    const EDITABLE_FIELDS = [
        "title",
        "description",
        "category",
        "priority",
        "deviceId"
    ];

    const RESULT_MESSAGES = {
        unavailable: "Chức năng phiếu hỗ trợ chưa sẵn sàng.",
        unauthenticated: "Phiên đăng nhập không hợp lệ.",
        invalid_input: "Dữ liệu đầu vào không hợp lệ.",
        duplicate_id: "Mã phiếu đã tồn tại.",
        not_found: "Không tìm thấy phiếu hỗ trợ.",
        forbidden: "Tài khoản hiện tại không có quyền thực hiện thao tác này.",
        invalid_status: "Trạng thái phiếu không hợp lệ.",
        invalid_transition: "Không thể chuyển sang trạng thái được yêu cầu từ trạng thái hiện tại.",
        invalid_assignee: "Email người phụ trách không hợp lệ.",
        invalid_changes: "Thông tin cập nhật không hợp lệ.",
        save_failed: "Không thể lưu thay đổi phiếu hỗ trợ."
    };

    function success(data, message) {
        return {
            ok: true,
            reason: null,
            message: message || "Thao tác thành công.",
            data: data ?? null
        };
    }

    function failure(reason, details) {
        return {
            ok: false,
            reason,
            message: RESULT_MESSAGES[reason] || "Không thể thực hiện thao tác.",
            data: null,
            details: details || null
        };
    }

    function isReady() {
        return Boolean(
            window.TicketStorage &&
            window.TicketActionPermissions &&
            typeof window.TicketStorage.getTicketById === "function"
        );
    }

    function getActor() {
        if (
            !window.TicketActionPermissions ||
            typeof window.TicketActionPermissions.getCurrentActor !== "function"
        ) {
            return null;
        }

        return window.TicketActionPermissions.getCurrentActor();
    }

    function getTicket(id) {
        if (!isReady() || typeof id !== "string" || !id.trim()) {
            return null;
        }

        return window.TicketStorage.getTicketById(id.trim());
    }

    function isValidTicketId(id) {
        return typeof id === "string" && /^TKT-\d{4,}$/.test(id.trim());
    }

    function isNonEmptyString(value) {
        return typeof value === "string" && value.trim() !== "";
    }

    function isValidDateString(value) {
        return typeof value === "string" && !Number.isNaN(Date.parse(value));
    }

    function validateCreateTicket(ticket) {
        if (!ticket || typeof ticket !== "object" || Array.isArray(ticket)) {
            return failure("invalid_input");
        }

        if (
            !isValidTicketId(ticket.id) ||
            !isNonEmptyString(ticket.title) ||
            !isNonEmptyString(ticket.description) ||
            !TICKET_CATEGORIES.includes(ticket.category) ||
            !TICKET_PRIORITIES.includes(ticket.priority) ||
            ticket.status !== "open" ||
            !isNonEmptyString(ticket.requesterEmail) ||
            (ticket.assigneeEmail !== null && ticket.assigneeEmail !== undefined) ||
            (ticket.resolvedAt !== null && ticket.resolvedAt !== undefined) ||
            !isValidDateString(ticket.createdAt) ||
            !isValidDateString(ticket.updatedAt)
        ) {
            return failure("invalid_input");
        }

        if (
            ticket.deviceId !== null &&
            ticket.deviceId !== undefined &&
            typeof ticket.deviceId !== "string"
        ) {
            return failure("invalid_input");
        }

        return success(ticket);
    }

    function validateChanges(changes) {
        if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
            return failure("invalid_changes");
        }

        const fields = Object.keys(changes);

        if (fields.length === 0 || fields.some(function (field) {
            return !EDITABLE_FIELDS.includes(field);
        })) {
            return failure("invalid_changes");
        }

        if (
            Object.prototype.hasOwnProperty.call(changes, "title") &&
            !isNonEmptyString(changes.title)
        ) {
            return failure("invalid_changes", { field: "title" });
        }

        if (
            Object.prototype.hasOwnProperty.call(changes, "description") &&
            !isNonEmptyString(changes.description)
        ) {
            return failure("invalid_changes", { field: "description" });
        }

        if (
            Object.prototype.hasOwnProperty.call(changes, "category") &&
            !TICKET_CATEGORIES.includes(changes.category)
        ) {
            return failure("invalid_changes", { field: "category" });
        }

        if (
            Object.prototype.hasOwnProperty.call(changes, "priority") &&
            !TICKET_PRIORITIES.includes(changes.priority)
        ) {
            return failure("invalid_changes", { field: "priority" });
        }

        if (Object.prototype.hasOwnProperty.call(changes, "deviceId")) {
            if (
                changes.deviceId !== null &&
                typeof changes.deviceId !== "string"
            ) {
                return failure("invalid_changes", { field: "deviceId" });
            }
        }

        return success(changes);
    }

    function createTicket(ticket) {
        if (!isReady() || typeof window.TicketStorage.createTicket !== "function") {
            return failure("unavailable");
        }

        const actor = getActor();

        if (!actor) {
            return failure("unauthenticated");
        }

        const validation = validateCreateTicket(ticket);

        if (!validation.ok) {
            return validation;
        }

        if (getTicket(ticket.id)) {
            return failure("duplicate_id");
        }

        if (
            typeof window.TicketActionPermissions.canCreateTicket !== "function" ||
            !window.TicketActionPermissions.canCreateTicket(ticket, actor)
        ) {
            return failure("forbidden");
        }

        const saved = window.TicketStorage.createTicket(ticket);

        return saved
            ? success(getTicket(ticket.id), "Đã tạo phiếu hỗ trợ thành công.")
            : failure("save_failed");
    }

    function updateTicket(id, changes) {
        if (!isReady() || typeof window.TicketStorage.updateTicket !== "function") {
            return failure("unavailable");
        }

        if (!isValidTicketId(id)) {
            return failure("invalid_input", { field: "id" });
        }

        const actor = getActor();

        if (!actor) {
            return failure("unauthenticated");
        }

        const ticket = getTicket(id);

        if (!ticket) {
            return failure("not_found");
        }

        const validation = validateChanges(changes);

        if (!validation.ok) {
            return validation;
        }

        if (
            typeof window.TicketActionPermissions.canEditTicket !== "function" ||
            !window.TicketActionPermissions.canEditTicket(id, actor)
        ) {
            return failure("forbidden");
        }

        const updatedTicket = window.TicketStorage.updateTicket(id, changes);

        return updatedTicket
            ? success(updatedTicket, "Đã cập nhật phiếu hỗ trợ thành công.")
            : failure("save_failed");
    }

    function assignTicket(id, assigneeEmail) {
        if (!isReady() || typeof window.TicketStorage.assignTicket !== "function") {
            return failure("unavailable");
        }

        if (!isValidTicketId(id)) {
            return failure("invalid_input", { field: "id" });
        }

        const actor = getActor();

        if (!actor) {
            return failure("unauthenticated");
        }

        const ticket = getTicket(id);

        if (!ticket) {
            return failure("not_found");
        }

        if (
            typeof window.TicketStorage.isValidAssigneeEmail !== "function" ||
            !window.TicketStorage.isValidAssigneeEmail(assigneeEmail)
        ) {
            return failure("invalid_assignee");
        }

        if (
            typeof window.TicketActionPermissions.canAssignTicket !== "function" ||
            !window.TicketActionPermissions.canAssignTicket(id, assigneeEmail, actor)
        ) {
            return failure("forbidden");
        }

        const updatedTicket = window.TicketStorage.assignTicket(id, assigneeEmail);

        return updatedTicket
            ? success(updatedTicket, "Đã phân công người phụ trách thành công.")
            : failure("save_failed");
    }

    function changeTicketStatus(id, nextStatus) {
        if (!isReady() || typeof window.TicketStorage.updateTicketStatus !== "function") {
            return failure("unavailable");
        }

        if (!isValidTicketId(id)) {
            return failure("invalid_input", { field: "id" });
        }

        if (typeof nextStatus !== "string" || !TICKET_STATUSES.includes(nextStatus.trim())) {
            return failure("invalid_status");
        }

        const normalizedNextStatus = nextStatus.trim();
        const actor = getActor();

        if (!actor) {
            return failure("unauthenticated");
        }

        const ticket = getTicket(id);

        if (!ticket) {
            return failure("not_found");
        }

        const allowedTransitions = STATUS_TRANSITIONS[ticket.status] || [];

        if (!allowedTransitions.includes(normalizedNextStatus)) {
            return failure("invalid_transition", {
                fromStatus: ticket.status,
                toStatus: normalizedNextStatus
            });
        }

        if (
            normalizedNextStatus === "assigned" &&
            !isNonEmptyString(ticket.assigneeEmail)
        ) {
            return failure("invalid_transition", {
                fromStatus: ticket.status,
                toStatus: normalizedNextStatus,
                requirement: "assignee"
            });
        }

        if (
            typeof window.TicketActionPermissions.canChangeTicketStatus !== "function" ||
            !window.TicketActionPermissions.canChangeTicketStatus(
                id,
                normalizedNextStatus,
                actor
            )
        ) {
            return failure("forbidden");
        }

        const updatedTicket = window.TicketStorage.updateTicketStatus(
            id,
            normalizedNextStatus
        );

        return updatedTicket
            ? success(updatedTicket, "Đã thay đổi trạng thái phiếu hỗ trợ thành công.")
            : failure("save_failed");
    }

    function getMessage(reason) {
        return RESULT_MESSAGES[reason] || "Không thể thực hiện thao tác.";
    }

    window.TicketOperations = {
        validateCreateTicket,
        validateChanges,
        createTicket,
        updateTicket,
        assignTicket,
        changeTicketStatus,
        getMessage
    };
})();
