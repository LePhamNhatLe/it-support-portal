(function () {
    const TICKETS_STORAGE_KEY = "tickets";

    const TICKET_CATEGORIES = [
        "hardware",
        "software",
        "network",
        "account",
        "printer",
        "other"
    ];

    const TICKET_PRIORITIES = [
        "low",
        "medium",
        "high",
        "critical"
    ];

    const TICKET_STATUSES = [
        "open",
        "assigned",
        "in_progress",
        "pending",
        "resolved",
        "closed",
        "reopened"
    ];

    const TICKET_STATUS_TRANSITIONS = {
        open: ["assigned"],
        assigned: ["in_progress"],
        in_progress: ["pending", "resolved"],
        pending: ["in_progress", "resolved"],
        resolved: ["closed"],
        closed: ["reopened"],
        reopened: ["assigned"]
    };

    const AppStorage = {
        get(key, fallbackValue = null) {
            if (typeof key !== "string" || key.trim() === "") {
                return fallbackValue;
            }

            try {
                const rawValue = window.localStorage.getItem(key);

                if (rawValue === null) {
                    return fallbackValue;
                }

                return JSON.parse(rawValue);
            } catch (error) {
                return fallbackValue;
            }
        },

        set(key, value) {
            if (typeof key !== "string" || key.trim() === "") {
                return false;
            }

            try {
                window.localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                return false;
            }
        },

        remove(key) {
            if (typeof key !== "string" || key.trim() === "") {
                return false;
            }

            try {
                window.localStorage.removeItem(key);
                return true;
            } catch (error) {
                return false;
            }
        },

        has(key) {
            if (typeof key !== "string" || key.trim() === "") {
                return false;
            }

            try {
                return window.localStorage.getItem(key) !== null;
            } catch (error) {
                return false;
            }
        }
    };

    window.AppStorage = AppStorage;

    function getTickets() {
        const tickets = AppStorage.get(TICKETS_STORAGE_KEY, []);
        return Array.isArray(tickets) ? tickets : [];
    }

    function saveTickets(tickets) {
        if (!Array.isArray(tickets)) {
            return false;
        }

        return AppStorage.set(TICKETS_STORAGE_KEY, tickets);
    }

    function getTicketById(id) {
        if (typeof id !== "string" || id.trim() === "") {
            return null;
        }

        const normalizedId = id.trim();
        const tickets = getTickets();

        return tickets.find(
            (ticket) => ticket && ticket.id === normalizedId
        ) || null;
    }

    function createTicket(ticket) {
        if (!ticket || typeof ticket !== "object" || Array.isArray(ticket)) {
            return false;
        }

        if (typeof ticket.id !== "string" || ticket.id.trim() === "") {
            return false;
        }

        const normalizedId = ticket.id.trim();
        const tickets = getTickets();

        const idExists = tickets.some(function (existingTicket) {
            return existingTicket && existingTicket.id === normalizedId;
        });

        if (idExists) {
            return false;
        }

        const ticketToSave = {
            ...ticket,
            id: normalizedId
        };

        return saveTickets([...tickets, ticketToSave]);
    }

    function updateTicket(id, changes) {
        if (typeof id !== "string" || id.trim() === "") {
            return null;
        }

        if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
            return null;
        }

        const normalizedId = id.trim();
        const tickets = getTickets();
        const ticketIndex = tickets.findIndex(function (ticket) {
            return ticket && ticket.id === normalizedId;
        });

        if (ticketIndex === -1) {
            return null;
        }

        const allowedChanges = {};

        if (Object.prototype.hasOwnProperty.call(changes, "title")) {
            if (typeof changes.title !== "string" || changes.title.trim() === "") {
                return null;
            }

            allowedChanges.title = changes.title.trim();
        }

        if (Object.prototype.hasOwnProperty.call(changes, "description")) {
            if (
                typeof changes.description !== "string" ||
                changes.description.trim() === ""
            ) {
                return null;
            }

            allowedChanges.description = changes.description.trim();
        }

        if (Object.prototype.hasOwnProperty.call(changes, "category")) {
            if (!TICKET_CATEGORIES.includes(changes.category)) {
                return null;
            }

            allowedChanges.category = changes.category;
        }

        if (Object.prototype.hasOwnProperty.call(changes, "priority")) {
            if (!TICKET_PRIORITIES.includes(changes.priority)) {
                return null;
            }

            allowedChanges.priority = changes.priority;
        }

        if (Object.prototype.hasOwnProperty.call(changes, "deviceId")) {
            if (changes.deviceId === null) {
                allowedChanges.deviceId = null;
            } else if (typeof changes.deviceId === "string") {
                const normalizedDeviceId = changes.deviceId.trim();
                allowedChanges.deviceId = normalizedDeviceId || null;
            } else {
                return null;
            }
        }

        if (Object.keys(allowedChanges).length === 0) {
            return null;
        }

        const currentTicket = tickets[ticketIndex];
        const updatedTicket = {
            ...currentTicket,
            ...allowedChanges,
            id: currentTicket.id,
            requesterEmail: currentTicket.requesterEmail,
            status: currentTicket.status,
            assigneeEmail: currentTicket.assigneeEmail,
            createdAt: currentTicket.createdAt,
            resolvedAt: currentTicket.resolvedAt,
            updatedAt: new Date().toISOString()
        };

        const nextTickets = tickets.slice();
        nextTickets[ticketIndex] = updatedTicket;

        if (!saveTickets(nextTickets)) {
            return null;
        }

        return updatedTicket;
    }

    function isValidTicketStatus(status) {
        return typeof status === "string" && TICKET_STATUSES.includes(status.trim());
    }

    function canTransitionTicketStatus(id, nextStatus) {
        if (typeof id !== "string" || id.trim() === "") {
            return false;
        }

        if (!isValidTicketStatus(nextStatus)) {
            return false;
        }

        const ticket = getTicketById(id);

        if (!ticket || !isValidTicketStatus(ticket.status)) {
            return false;
        }

        const normalizedNextStatus = nextStatus.trim();
        const allowedNextStatuses = TICKET_STATUS_TRANSITIONS[ticket.status] || [];

        if (!allowedNextStatuses.includes(normalizedNextStatus)) {
            return false;
        }

        if (
            normalizedNextStatus === "assigned" &&
            (typeof ticket.assigneeEmail !== "string" || ticket.assigneeEmail.trim() === "")
        ) {
            return false;
        }

        return true;
    }

    function updateTicketStatus(id, nextStatus) {
        if (!canTransitionTicketStatus(id, nextStatus)) {
            return null;
        }

        const normalizedId = id.trim();
        const normalizedNextStatus = nextStatus.trim();
        const tickets = getTickets();
        const ticketIndex = tickets.findIndex(function (ticket) {
            return ticket && ticket.id === normalizedId;
        });

        if (ticketIndex === -1) {
            return null;
        }

        const currentTicket = tickets[ticketIndex];
        const now = new Date().toISOString();
        let resolvedAt = currentTicket.resolvedAt || null;

        if (normalizedNextStatus === "resolved") {
            resolvedAt = now;
        }

        if (normalizedNextStatus === "reopened") {
            resolvedAt = null;
        }

        const updatedTicket = {
            ...currentTicket,
            status: normalizedNextStatus,
            updatedAt: now,
            resolvedAt
        };

        const nextTickets = tickets.slice();
        nextTickets[ticketIndex] = updatedTicket;

        if (!saveTickets(nextTickets)) {
            return null;
        }

        return updatedTicket;
    }

    function isValidAssigneeEmail(email) {
        if (typeof email !== "string") {
            return false;
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            return false;
        }

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    }

    function assignTicket(id, assigneeEmail) {
        if (typeof id !== "string" || id.trim() === "") {
            return null;
        }

        if (!isValidAssigneeEmail(assigneeEmail)) {
            return null;
        }

        const normalizedId = id.trim();
        const normalizedAssigneeEmail = assigneeEmail.trim().toLowerCase();
        const tickets = getTickets();
        const ticketIndex = tickets.findIndex(function (ticket) {
            return ticket && ticket.id === normalizedId;
        });

        if (ticketIndex === -1) {
            return null;
        }

        const currentTicket = tickets[ticketIndex];

        if (!isValidTicketStatus(currentTicket.status)) {
            return null;
        }

        if (["resolved", "closed"].includes(currentTicket.status)) {
            return null;
        }

        let nextStatus = currentTicket.status;

        if (["open", "reopened"].includes(currentTicket.status)) {
            nextStatus = "assigned";
        }

        const updatedTicket = {
            ...currentTicket,
            assigneeEmail: normalizedAssigneeEmail,
            status: nextStatus,
            updatedAt: new Date().toISOString()
        };

        const nextTickets = tickets.slice();
        nextTickets[ticketIndex] = updatedTicket;

        if (!saveTickets(nextTickets)) {
            return null;
        }

        return updatedTicket;
    }

    window.TicketStorage = {
        getTickets,
        saveTickets,
        getTicketById,
        createTicket,
        updateTicket,
        isValidTicketStatus,
        canTransitionTicketStatus,
        updateTicketStatus,
        isValidAssigneeEmail,
        assignTicket
    };
})();
