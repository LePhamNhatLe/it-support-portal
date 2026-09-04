(function () {
    const TICKETS_STORAGE_KEY = "tickets";
    const TICKET_ACTIVITY_STORAGE_KEY = "ticketActivities";

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

    const SUPPORTED_TICKET_ROLES = ["technical_lead", "technician", "user"];

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

    function normalizeEmail(email) {
        return typeof email === "string" ? email.trim().toLowerCase() : "";
    }

    function getAuditActor() {
        if (typeof window.getCurrentUser !== "function") {
            return null;
        }

        const user = window.getCurrentUser();

        if (
            !user ||
            typeof user !== "object" ||
            !normalizeEmail(user.email) ||
            typeof user.name !== "string" ||
            !user.name.trim() ||
            typeof user.role !== "string" ||
            !user.role.trim()
        ) {
            return null;
        }

        return {
            email: normalizeEmail(user.email),
            name: user.name.trim(),
            role: user.role.trim()
        };
    }

    function createSystemActivityId(ticketId, activities) {
        const highestNumber = activities.reduce(function (highest, activity) {
            if (!activity || typeof activity.id !== "string") {
                return highest;
            }

            const match = /-(\d{4,})$/.exec(activity.id.trim());

            if (!match) {
                return highest;
            }

            const activityNumber = Number(match[1]);
            return Number.isFinite(activityNumber)
                ? Math.max(highest, activityNumber)
                : highest;
        }, 0);

        return "ACT-" + ticketId + "-" + String(highestNumber + 1).padStart(4, "0");
    }

    function recordSystemActivity(ticketId, message, metadata) {
        if (
            typeof ticketId !== "string" ||
            !ticketId.trim() ||
            typeof message !== "string" ||
            !message.trim()
        ) {
            return false;
        }

        const actor = getAuditActor();

        if (!actor) {
            return false;
        }

        const normalizedTicketId = ticketId.trim();
        const stored = AppStorage.get(TICKET_ACTIVITY_STORAGE_KEY, {});
        const activityStore =
            stored && typeof stored === "object" && !Array.isArray(stored)
                ? stored
                : {};
        const currentActivities = Array.isArray(activityStore[normalizedTicketId])
            ? activityStore[normalizedTicketId].slice()
            : [];

        const activity = {
            id: createSystemActivityId(normalizedTicketId, currentActivities),
            ticketId: normalizedTicketId,
            type: "system",
            message: message.trim(),
            actorEmail: actor.email,
            actorName: actor.name,
            actorRole: actor.role,
            createdAt: new Date().toISOString(),
            metadata:
                metadata && typeof metadata === "object" && !Array.isArray(metadata)
                    ? { ...metadata }
                    : null
        };

        return AppStorage.set(TICKET_ACTIVITY_STORAGE_KEY, {
            ...activityStore,
            [normalizedTicketId]: [...currentActivities, activity]
        });
    }

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

        if (!saveTickets([...tickets, ticketToSave])) {
            return false;
        }

        recordSystemActivity(
            normalizedId,
            "Đã tạo phiếu hỗ trợ.",
            {
                action: "created"
            }
        );

        return true;
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

        const changeDetails = {};

        Object.keys(allowedChanges).forEach(function (field) {
            changeDetails[field] = {
                from: currentTicket[field] ?? null,
                to: updatedTicket[field] ?? null
            };
        });

        recordSystemActivity(
            normalizedId,
            "Đã cập nhật thông tin phiếu hỗ trợ.",
            {
                action: "updated",
                changes: changeDetails
            }
        );

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

        recordSystemActivity(
            normalizedId,
            "Đã thay đổi trạng thái phiếu hỗ trợ.",
            {
                action: "status_changed",
                fromStatus: currentTicket.status,
                toStatus: normalizedNextStatus
            }
        );

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

        const previousAssigneeEmail = normalizeEmail(currentTicket.assigneeEmail) || null;
        const assignmentAction = previousAssigneeEmail ? "reassigned" : "assigned";

        recordSystemActivity(
            normalizedId,
            previousAssigneeEmail
                ? "Đã thay đổi người phụ trách phiếu hỗ trợ."
                : "Đã phân công người phụ trách phiếu hỗ trợ.",
            {
                action: assignmentAction,
                fromAssigneeEmail: previousAssigneeEmail,
                toAssigneeEmail: normalizedAssigneeEmail,
                fromStatus: currentTicket.status,
                toStatus: nextStatus
            }
        );

        return updatedTicket;
    }

    function getTicketAccessUser() {
        if (typeof window.getCurrentUser !== "function") {
            return null;
        }

        const user = window.getCurrentUser();

        if (
            !user ||
            typeof user !== "object" ||
            !SUPPORTED_TICKET_ROLES.includes(user.role) ||
            !normalizeEmail(user.email)
        ) {
            return null;
        }

        return user;
    }

    function canViewTicket(ticket, user) {
        if (!ticket || typeof ticket !== "object") {
            return false;
        }

        const currentUser = user || getTicketAccessUser();

        if (!currentUser) {
            return false;
        }

        if (currentUser.role === "technical_lead") {
            return true;
        }

        const currentEmail = normalizeEmail(currentUser.email);

        if (currentUser.role === "technician") {
            return normalizeEmail(ticket.assigneeEmail) === currentEmail;
        }

        if (currentUser.role === "user") {
            return normalizeEmail(ticket.requesterEmail) === currentEmail;
        }

        return false;
    }

    function getVisibleTickets() {
        const currentUser = getTicketAccessUser();

        if (!currentUser) {
            return [];
        }

        return getTickets().filter(function (ticket) {
            return canViewTicket(ticket, currentUser);
        });
    }

    function getVisibleTicketById(id) {
        const ticket = getTicketById(id);
        return ticket && canViewTicket(ticket) ? ticket : null;
    }

    function getTicketAccessState(id) {
        if (typeof id !== "string" || id.trim() === "") {
            return { ok: false, reason: "invalid_id", ticket: null };
        }

        const currentUser = getTicketAccessUser();

        if (!currentUser) {
            return { ok: false, reason: "unauthenticated", ticket: null };
        }

        const ticket = getTicketById(id.trim());

        if (!ticket) {
            return { ok: false, reason: "not_found", ticket: null };
        }

        if (!canViewTicket(ticket, currentUser)) {
            return { ok: false, reason: "forbidden", ticket: null };
        }

        return { ok: true, reason: null, ticket };
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

    window.TicketAccess = {
        getCurrentUser: getTicketAccessUser,
        canViewTicket,
        getVisibleTickets,
        getVisibleTicketById,
        getTicketAccessState
    };
})();
