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

    window.TicketsPage = {
        getAllTickets,
        renderTicketList,
        getStatusLabel,
        getPriorityLabel,
        getCategoryLabel,
        formatDateTime
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderTicketList);
    } else {
        renderTicketList();
    }
})();
