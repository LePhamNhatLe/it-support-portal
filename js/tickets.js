(function () {
    const STATUS_LABELS = {
        open: "Mới",
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

    function getAllTickets() {
        if (
            !window.TicketStorage ||
            typeof window.TicketStorage.getTickets !== "function"
        ) {
            console.error("tickets.js: TicketStorage chưa được load.");
            return [];
        }

        const tickets = window.TicketStorage.getTickets();

        if (!Array.isArray(tickets)) {
            return [];
        }

        return tickets.slice().sort(function (a, b) {
            const timeA = Date.parse(a && a.createdAt ? a.createdAt : "") || 0;
            const timeB = Date.parse(b && b.createdAt ? b.createdAt : "") || 0;
            return timeB - timeA;
        });
    }

    function getStatusLabel(status) {
        return STATUS_LABELS[status] || "Không xác định";
    }

    function getPriorityLabel(priority) {
        return PRIORITY_LABELS[priority] || "Không xác định";
    }

    function getCategoryLabel(category) {
        return CATEGORY_LABELS[category] || "Khác";
    }

    function formatDateTime(value) {
        if (typeof value !== "string" || value.trim() === "") {
            return "Không xác định";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Không xác định";
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

    function createTextCell(text) {
        const cell = document.createElement("td");
        cell.textContent = text;
        return cell;
    }

    function createBadgeCell(text, baseClass, modifierClass) {
        const cell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = baseClass + (modifierClass ? " " + modifierClass : "");
        badge.textContent = text;
        cell.appendChild(badge);
        return cell;
    }

    function createActionCell(ticketId) {
        const cell = document.createElement("td");
        const link = document.createElement("a");
        link.className = "button button--ghost";
        link.href = "ticket-detail.html?id=" + encodeURIComponent(ticketId);
        link.textContent = "Xem";
        cell.appendChild(link);
        return cell;
    }

    function createTicketRow(ticket) {
        const row = document.createElement("tr");

        row.appendChild(createTextCell(ticket.id || "Không xác định"));
        row.appendChild(createTextCell(ticket.title || "Không có tiêu đề"));
        row.appendChild(createTextCell(ticket.requesterEmail || "Không xác định"));
        row.appendChild(createTextCell(getCategoryLabel(ticket.category)));
        row.appendChild(
            createBadgeCell(
                getPriorityLabel(ticket.priority),
                "badge",
                PRIORITY_CLASSES[ticket.priority] || ""
            )
        );
        row.appendChild(
            createBadgeCell(
                getStatusLabel(ticket.status),
                "status-badge",
                STATUS_CLASSES[ticket.status] || ""
            )
        );
        row.appendChild(createTextCell(ticket.assigneeEmail || "Chưa phân công"));
        row.appendChild(createTextCell(formatDateTime(ticket.createdAt)));
        row.appendChild(createActionCell(ticket.id || ""));

        return row;
    }

    function renderTicketList() {
        const tableBody = document.querySelector(".tickets-table tbody");
        const tableWrap = document.querySelector(".table-wrap");
        const emptyState = document.querySelector(".tickets__empty");

        if (!tableBody) {
            return;
        }

        const tickets = getAllTickets();
        tableBody.replaceChildren();

        if (tickets.length === 0) {
            if (tableWrap) {
                tableWrap.hidden = true;
            }

            if (emptyState) {
                emptyState.hidden = false;
                const message = emptyState.querySelector(".empty-state p");
                if (message) {
                    message.textContent = "Chưa có phiếu hỗ trợ.";
                }
            }

            return;
        }

        if (tableWrap) {
            tableWrap.hidden = false;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }

        const fragment = document.createDocumentFragment();

        tickets.forEach(function (ticket) {
            if (ticket && typeof ticket === "object") {
                fragment.appendChild(createTicketRow(ticket));
            }
        });

        tableBody.appendChild(fragment);
    }

    function generateNextTicketId() {
        const tickets = getAllTickets();

        const highestNumber = tickets.reduce(function (highest, ticket) {
            if (!ticket || typeof ticket.id !== "string") {
                return highest;
            }

            const match = /^TKT-(\d+)$/.exec(ticket.id.trim());

            if (!match) {
                return highest;
            }

            const ticketNumber = Number(match[1]);
            return Number.isFinite(ticketNumber)
                ? Math.max(highest, ticketNumber)
                : highest;
        }, 0);

        return "TKT-" + String(highestNumber + 1).padStart(4, "0");
    }

    function showFeedback(message) {
        const feedback = document.getElementById("ticket-feedback");

        if (!feedback) {
            return;
        }

        feedback.textContent = message;
        feedback.hidden = !message;
    }

    function showCreateError(message) {
        const errorElement = document.getElementById("create-ticket-error");

        if (!errorElement) {
            return;
        }

        errorElement.textContent = message;
        errorElement.hidden = !message;
    }

    function openCreateTicketPanel() {
        const panel = document.getElementById("create-ticket-panel");

        if (!panel) {
            return;
        }

        showFeedback("");
        showCreateError("");
        panel.hidden = false;

        const titleInput = document.getElementById("ticket-title");
        if (titleInput) {
            titleInput.focus();
        }
    }

    function closeCreateTicketPanel() {
        const panel = document.getElementById("create-ticket-panel");
        const form = document.getElementById("create-ticket-form");

        if (form) {
            form.reset();
        }

        showCreateError("");

        if (panel) {
            panel.hidden = true;
        }
    }

    function buildTicketFromForm(form) {
        if (!form) {
            return null;
        }

        if (typeof window.getCurrentUser !== "function") {
            return null;
        }

        const currentUser = window.getCurrentUser();

        if (!currentUser || typeof currentUser.email !== "string") {
            return null;
        }

        const title = (form.elements.title.value || "").trim();
        const description = (form.elements.description.value || "").trim();
        const category = (form.elements.category.value || "").trim();
        const priority = (form.elements.priority.value || "").trim();
        const deviceIdValue = (form.elements.deviceId.value || "").trim();

        if (!title || !description || !CATEGORY_LABELS[category] || !PRIORITY_LABELS[priority]) {
            return null;
        }

        const now = new Date().toISOString();

        return {
            id: generateNextTicketId(),
            title,
            description,
            category,
            priority,
            status: "open",
            requesterEmail: currentUser.email,
            assigneeEmail: null,
            deviceId: deviceIdValue || null,
            createdAt: now,
            updatedAt: now,
            resolvedAt: null
        };
    }

    function handleCreateTicketSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const ticket = buildTicketFromForm(form);

        if (!ticket) {
            showCreateError("Vui lòng nhập đầy đủ và đúng thông tin phiếu hỗ trợ.");
            return;
        }

        if (
            !window.TicketStorage ||
            typeof window.TicketStorage.createTicket !== "function"
        ) {
            showCreateError("Không thể truy cập bộ lưu trữ phiếu hỗ trợ.");
            return;
        }

        const saved = window.TicketStorage.createTicket(ticket);

        if (!saved) {
            showCreateError("Không thể lưu phiếu hỗ trợ. Vui lòng thử lại.");
            return;
        }

        closeCreateTicketPanel();
        renderTicketList();
        showFeedback("Đã tạo phiếu " + ticket.id + " thành công.");
    }

    function initCreateTicket() {
        const openButtons = document.querySelectorAll('[data-action="open-create-ticket"]');
        const cancelButton = document.getElementById("cancel-create-ticket");
        const form = document.getElementById("create-ticket-form");

        openButtons.forEach(function (button) {
            button.addEventListener("click", openCreateTicketPanel);
        });

        if (cancelButton) {
            cancelButton.addEventListener("click", closeCreateTicketPanel);
        }

        if (form) {
            form.addEventListener("submit", handleCreateTicketSubmit);
        }
    }

    function initTicketsPage() {
        renderTicketList();
        initCreateTicket();
    }

    window.TicketsPage = {
        getAllTickets,
        renderTicketList,
        getStatusLabel,
        getPriorityLabel,
        getCategoryLabel,
        formatDateTime,
        generateNextTicketId
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initTicketsPage);
    } else {
        initTicketsPage();
    }
})();
