(function () {
    const STATUS_LABELS = {
        open: "Mở",
        assigned: "Đã phân công",
        in_progress: "Đang xử lý",
        pending: "Đang chờ",
        resolved: "Đã giải quyết",
        closed: "Đã đóng",
        reopened: "Mở lại"
    };

    const STATUS_CLASSES = {
        open: "status-badge--open",
        assigned: "status-badge--pending",
        in_progress: "status-badge--in-progress",
        pending: "status-badge--pending",
        resolved: "status-badge--resolved",
        closed: "status-badge--resolved",
        reopened: "status-badge--open"
    };

    const PRIORITY_LABELS = {
        low: "Thấp",
        medium: "Trung bình",
        high: "Cao",
        critical: "Khẩn cấp"
    };

    const PRIORITY_CLASSES = {
        low: "badge--low",
        medium: "badge--medium",
        high: "badge--high",
        critical: "badge--critical"
    };

    const CATEGORY_LABELS = {
        hardware: "Phần cứng",
        software: "Phần mềm",
        network: "Mạng",
        account: "Tài khoản",
        printer: "Máy in",
        other: "Khác"
    };

    const ROLE_LABELS = {
        technical_lead: "Trưởng nhóm kỹ thuật",
        technician: "Nhân viên kỹ thuật",
        user: "Người dùng"
    };

    const DETAIL_ERROR_MESSAGES = {
        missing_id: "URL chưa có mã phiếu hỗ trợ.",
        invalid_id: "Mã phiếu hỗ trợ không đúng định dạng.",
        access_unavailable: "Không thể kiểm tra quyền truy cập phiếu hỗ trợ.",
        unauthenticated: "Phiên đăng nhập không hợp lệ.",
        not_found: "Không tìm thấy phiếu hỗ trợ.",
        forbidden: "Tài khoản hiện tại không có quyền xem phiếu hỗ trợ này."
    };

    function getTicketIdFromUrl() {
        try {
            const params = new URLSearchParams(window.location.search);
            const id = params.get("id");

            if (typeof id !== "string") {
                return null;
            }

            const normalizedId = id.trim();
            return normalizedId || null;
        } catch (error) {
            return null;
        }
    }

    function isValidTicketId(id) {
        return typeof id === "string" && /^TKT-\d{4,}$/.test(id.trim());
    }

    function getTicketById(id) {
        if (!isValidTicketId(id)) {
            return null;
        }

        if (
            !window.TicketAccess ||
            typeof window.TicketAccess.getVisibleTicketById !== "function"
        ) {
            return null;
        }

        return window.TicketAccess.getVisibleTicketById(id.trim());
    }

    function getCurrentTicket() {
        const id = getTicketIdFromUrl();

        if (!id) {
            return null;
        }

        return getTicketById(id);
    }

    function getTicketDetailState() {
        const id = getTicketIdFromUrl();

        if (!id) {
            return {
                ok: false,
                reason: "missing_id",
                ticket: null
            };
        }

        if (!isValidTicketId(id)) {
            return {
                ok: false,
                reason: "invalid_id",
                ticket: null
            };
        }

        if (
            !window.TicketAccess ||
            typeof window.TicketAccess.getTicketAccessState !== "function"
        ) {
            return {
                ok: false,
                reason: "access_unavailable",
                ticket: null
            };
        }

        return window.TicketAccess.getTicketAccessState(id);
    }

    function getCurrentTicketActivities() {
        const id = getTicketIdFromUrl();

        if (
            !id ||
            !window.TicketActivity ||
            typeof window.TicketActivity.getTicketActivities !== "function"
        ) {
            return [];
        }

        return window.TicketActivity.getTicketActivities(id);
    }

    function getCurrentTicketComments() {
        const id = getTicketIdFromUrl();

        if (
            !id ||
            !window.TicketActivity ||
            typeof window.TicketActivity.getComments !== "function"
        ) {
            return [];
        }

        return window.TicketActivity.getComments(id);
    }

    function getCurrentTicketWorkNotes() {
        const id = getTicketIdFromUrl();

        if (
            !id ||
            !window.TicketActivity ||
            typeof window.TicketActivity.getWorkNotes !== "function"
        ) {
            return [];
        }

        return window.TicketActivity.getWorkNotes(id);
    }

    function getCurrentTicketHistory() {
        const id = getTicketIdFromUrl();

        if (
            !id ||
            !window.TicketActivity ||
            typeof window.TicketActivity.getHistory !== "function"
        ) {
            return [];
        }

        return window.TicketActivity.getHistory(id);
    }

    function addCurrentTicketComment(message) {
        const id = getTicketIdFromUrl();

        if (
            !id ||
            !window.TicketActivity ||
            typeof window.TicketActivity.addComment !== "function"
        ) {
            return null;
        }

        return window.TicketActivity.addComment(id, message);
    }

    function addCurrentTicketWorkNote(message) {
        const id = getTicketIdFromUrl();

        if (
            !id ||
            !window.TicketActivity ||
            typeof window.TicketActivity.addWorkNote !== "function"
        ) {
            return null;
        }

        return window.TicketActivity.addWorkNote(id, message);
    }

    function formatDateTime(value) {
        if (typeof value !== "string" || !value.trim()) {
            return "Chưa có dữ liệu";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Chưa có dữ liệu";
        }

        const pad = function (number) {
            return String(number).padStart(2, "0");
        };

        return [
            pad(date.getDate()),
            pad(date.getMonth() + 1),
            date.getFullYear()
        ].join("/") + " " + [pad(date.getHours()), pad(date.getMinutes())].join(":");
    }

    function getCurrentUserNameForEmail(email) {
        if (typeof window.getCurrentUser !== "function" || typeof email !== "string") {
            return null;
        }

        const currentUser = window.getCurrentUser();

        if (
            !currentUser ||
            typeof currentUser.email !== "string" ||
            typeof currentUser.name !== "string"
        ) {
            return null;
        }

        return currentUser.email.trim().toLowerCase() === email.trim().toLowerCase()
            ? currentUser.name.trim()
            : null;
    }

    function getDisplayName(email, fallback) {
        if (typeof email !== "string" || !email.trim()) {
            return fallback || "Chưa phân công";
        }

        return getCurrentUserNameForEmail(email) || email.trim();
    }

    function setText(selector, value) {
        const element = document.querySelector(selector);

        if (element) {
            element.textContent = value;
        }
    }

    function setDetailContentVisibility(visible) {
        document.querySelectorAll("[data-ticket-content]").forEach(function (element) {
            element.hidden = !visible;
        });
    }

    function renderStateMessage(state) {
        const stateElement = document.getElementById("ticket-detail-state");

        if (!stateElement) {
            return;
        }

        if (state && state.ok) {
            stateElement.textContent = "";
            stateElement.hidden = true;
            return;
        }

        const reason = state && state.reason ? state.reason : "access_unavailable";
        stateElement.textContent =
            DETAIL_ERROR_MESSAGES[reason] || "Không thể tải chi tiết phiếu hỗ trợ.";
        stateElement.hidden = false;
    }

    function renderBadge(selector, label, baseClass, modifierClass) {
        const element = document.querySelector(selector);

        if (!element) {
            return;
        }

        element.textContent = label;
        element.className = baseClass + (modifierClass ? " " + modifierClass : "");
    }

    function createHistoryItem(activity) {
        const article = document.createElement("article");
        article.className = "timeline__item";

        const time = document.createElement("span");
        time.className = "timeline__time";
        time.textContent = formatDateTime(activity.createdAt);

        const body = document.createElement("div");
        const actor = document.createElement("p");
        actor.className = "timeline__actor";
        actor.textContent = activity.actorName || ROLE_LABELS[activity.actorRole] || "Hệ thống";

        const text = document.createElement("p");
        text.className = "timeline__text";
        text.textContent = activity.message || "Đã cập nhật phiếu hỗ trợ.";

        body.append(actor, text);
        article.append(time, body);
        return article;
    }

    function renderHistory() {
        const container = document.querySelector("[data-ticket-history]");

        if (!container) {
            return;
        }

        const history = getCurrentTicketHistory();
        container.replaceChildren();

        if (history.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "Chưa có lịch sử xử lý.";
            container.appendChild(empty);
            return;
        }

        const fragment = document.createDocumentFragment();
        history.forEach(function (activity) {
            fragment.appendChild(createHistoryItem(activity));
        });
        container.appendChild(fragment);
    }

    function createCommentItem(comment) {
        const article = document.createElement("article");
        article.className = "comment-item";

        const meta = document.createElement("p");
        meta.className = "comment-item__meta";
        meta.textContent =
            (comment.actorName || comment.actorEmail || "Người dùng") +
            " • " +
            formatDateTime(comment.createdAt);

        const message = document.createElement("p");
        message.textContent = comment.message || "";

        article.append(meta, message);
        return article;
    }

    function renderComments() {
        const container = document.querySelector("[data-ticket-comments-list]");

        if (!container) {
            return;
        }

        const comments = getCurrentTicketComments();
        container.replaceChildren();

        if (comments.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "Chưa có bình luận.";
            container.appendChild(empty);
            return;
        }

        const fragment = document.createDocumentFragment();
        comments.forEach(function (comment) {
            fragment.appendChild(createCommentItem(comment));
        });
        container.appendChild(fragment);
    }

    function renderTicket(ticket) {
        const requesterEmail = ticket.requesterEmail || "Chưa có dữ liệu";
        const assigneeEmail = ticket.assigneeEmail || null;

        document.title = ticket.id + " | Cổng IT Support";
        setText("[data-ticket-id]", ticket.id || "Không xác định");
        setText("[data-ticket-title]", ticket.title || "Không có tiêu đề");
        setText(
            "[data-ticket-requester-name]",
            getDisplayName(ticket.requesterEmail, "Chưa có dữ liệu")
        );
        setText("[data-ticket-requester-email]", requesterEmail);
        setText("[data-ticket-department]", "Chưa có dữ liệu");
        setText("[data-ticket-category]", CATEGORY_LABELS[ticket.category] || "Khác");
        setText("[data-ticket-device]", ticket.deviceId || "Không có thiết bị liên quan");
        setText(
            "[data-ticket-assignee]",
            getDisplayName(assigneeEmail, "Chưa phân công")
        );
        setText("[data-ticket-created-at]", formatDateTime(ticket.createdAt));
        setText("[data-ticket-updated-at]", formatDateTime(ticket.updatedAt));
        setText("[data-ticket-description]", ticket.description || "Không có mô tả.");
        setText("[data-ticket-workflow-status]", STATUS_LABELS[ticket.status] || "Không xác định");
        setText(
            "[data-ticket-workflow-assignee]",
            getDisplayName(assigneeEmail, "Chưa phân công")
        );

        renderBadge(
            "[data-ticket-status]",
            STATUS_LABELS[ticket.status] || "Không xác định",
            "status-badge",
            STATUS_CLASSES[ticket.status] || ""
        );
        renderBadge(
            "[data-ticket-priority]",
            PRIORITY_LABELS[ticket.priority] || "Không xác định",
            "badge",
            PRIORITY_CLASSES[ticket.priority] || ""
        );

        renderHistory();
        renderComments();
    }

    function renderTicketDetail() {
        const state = getTicketDetailState();
        renderStateMessage(state);

        if (!state.ok || !state.ticket) {
            setDetailContentVisibility(false);
            return state;
        }

        setDetailContentVisibility(true);
        renderTicket(state.ticket);
        return state;
    }

    function initTicketDetailPage() {
        renderTicketDetail();
    }

    window.TicketDetail = {
        getTicketIdFromUrl,
        isValidTicketId,
        getTicketById,
        getCurrentTicket,
        getTicketDetailState,
        getCurrentTicketActivities,
        getCurrentTicketComments,
        getCurrentTicketWorkNotes,
        getCurrentTicketHistory,
        addCurrentTicketComment,
        addCurrentTicketWorkNote,
        formatDateTime,
        renderHistory,
        renderComments,
        renderTicketDetail
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initTicketDetailPage);
    } else {
        initTicketDetailPage();
    }
})();
