(function () {
    const SUMMARY_LABEL_MAP = {
        "Phiếu mở": "open",
        "Đang xử lý": "inProgress",
        "Đang chờ": "pending",
        "Đã giải quyết": "resolved"
    };

    function getVisibleTickets() {
        if (
            !window.TicketAccess ||
            typeof window.TicketAccess.getVisibleTickets !== "function"
        ) {
            return [];
        }

        const tickets = window.TicketAccess.getVisibleTickets();
        return Array.isArray(tickets) ? tickets : [];
    }

    function getTicketSummary(tickets) {
        const source = Array.isArray(tickets) ? tickets : getVisibleTickets();

        return source.reduce(
            function (summary, ticket) {
                if (!ticket || typeof ticket !== "object") {
                    return summary;
                }

                if (ticket.status === "open") {
                    summary.open += 1;
                }

                if (ticket.status === "in_progress") {
                    summary.inProgress += 1;
                }

                if (ticket.status === "pending") {
                    summary.pending += 1;
                }

                if (ticket.status === "resolved") {
                    summary.resolved += 1;
                }

                return summary;
            },
            {
                open: 0,
                inProgress: 0,
                pending: 0,
                resolved: 0
            }
        );
    }

    function renderTicketSummary() {
        const summary = getTicketSummary();
        const cards = document.querySelectorAll(".tickets__summary .metric-card");

        cards.forEach(function (card) {
            const labelElement = card.querySelector(".metric-card__label");
            const valueElement = card.querySelector(".metric-card__value");
            const deltaElement = card.querySelector(".metric-card__delta");

            if (!labelElement || !valueElement) {
                return;
            }

            const key = SUMMARY_LABEL_MAP[labelElement.textContent.trim()];

            if (!key) {
                return;
            }

            valueElement.textContent = String(summary[key]);

            if (deltaElement) {
                deltaElement.textContent = "Theo quyền hiện tại";
                deltaElement.className = "metric-card__delta metric-card__delta--neutral";
            }
        });

        return summary;
    }

    function showCreateError(message) {
        const element = document.getElementById("create-ticket-error");

        if (!element) {
            return;
        }

        element.textContent = message || "";
        element.hidden = !message;
    }

    function showFeedback(message) {
        const element = document.getElementById("ticket-feedback");

        if (!element) {
            return;
        }

        element.textContent = message || "";
        element.hidden = !message;
    }

    function generateNextTicketId() {
        if (
            window.TicketsPage &&
            typeof window.TicketsPage.generateNextTicketId === "function"
        ) {
            return window.TicketsPage.generateNextTicketId();
        }

        if (
            !window.TicketStorage ||
            typeof window.TicketStorage.getTickets !== "function"
        ) {
            return null;
        }

        const tickets = window.TicketStorage.getTickets();

        if (!Array.isArray(tickets)) {
            return null;
        }

        const highestNumber = tickets.reduce(function (highest, ticket) {
            if (!ticket || typeof ticket.id !== "string") {
                return highest;
            }

            const match = /^TKT-(\d+)$/.exec(ticket.id.trim());

            if (!match) {
                return highest;
            }

            const number = Number(match[1]);
            return Number.isFinite(number) ? Math.max(highest, number) : highest;
        }, 0);

        return "TKT-" + String(highestNumber + 1).padStart(4, "0");
    }

    function buildTicketFromForm(form) {
        if (!form || typeof window.getCurrentUser !== "function") {
            return null;
        }

        const user = window.getCurrentUser();
        const id = generateNextTicketId();

        if (
            !user ||
            typeof user.email !== "string" ||
            !user.email.trim() ||
            typeof id !== "string"
        ) {
            return null;
        }

        const title = (form.elements.title.value || "").trim();
        const description = (form.elements.description.value || "").trim();
        const category = (form.elements.category.value || "").trim();
        const priority = (form.elements.priority.value || "").trim();
        const deviceId = (form.elements.deviceId.value || "").trim();
        const now = new Date().toISOString();

        return {
            id,
            title,
            description,
            category,
            priority,
            status: "open",
            requesterEmail: user.email.trim().toLowerCase(),
            assigneeEmail: null,
            deviceId: deviceId || null,
            createdAt: now,
            updatedAt: now,
            resolvedAt: null
        };
    }

    function closeCreatePanel(form) {
        const panel = document.getElementById("create-ticket-panel");

        if (form) {
            form.reset();
        }

        showCreateError("");

        if (panel) {
            panel.hidden = true;
        }
    }

    function handleCreateSubmit(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const form = event.currentTarget;

        if (
            !window.TicketOperations ||
            typeof window.TicketOperations.createTicket !== "function"
        ) {
            showCreateError("Chức năng tạo phiếu hỗ trợ chưa sẵn sàng.");
            return;
        }

        const ticket = buildTicketFromForm(form);

        if (!ticket) {
            showCreateError("Không thể tạo dữ liệu phiếu hỗ trợ từ biểu mẫu.");
            return;
        }

        const result = window.TicketOperations.createTicket(ticket);

        if (!result.ok) {
            showCreateError(result.message);
            return;
        }

        closeCreatePanel(form);

        if (
            window.TicketsPage &&
            typeof window.TicketsPage.renderTicketList === "function"
        ) {
            window.TicketsPage.renderTicketList();
        }

        renderTicketSummary();
        showFeedback("Đã tạo phiếu " + ticket.id + " thành công.");
    }

    function initTicketsIntegration() {
        const form = document.getElementById("create-ticket-form");

        if (form) {
            form.addEventListener("submit", handleCreateSubmit, true);
        }

        renderTicketSummary();
    }

    window.TicketsIntegration = {
        getVisibleTickets,
        getTicketSummary,
        renderTicketSummary,
        buildTicketFromForm
    };

    initTicketsIntegration();
})();
