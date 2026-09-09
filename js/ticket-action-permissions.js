(function () {
    const SUPPORTED_ROLES = ["technical_lead", "technician", "user"];
    const ASSIGNEE_ROLES = ["technical_lead", "technician"];
    const TECHNICIAN_STATUS_TARGETS = ["in_progress", "pending", "resolved"];

    if (!window.TicketStorage) {
        console.error("ticket-action-permissions.js: TicketStorage chưa sẵn sàng.");
        return;
    }

    const original = {
        createTicket: window.TicketStorage.createTicket,
        updateTicket: window.TicketStorage.updateTicket,
        assignTicket: window.TicketStorage.assignTicket,
        canTransitionTicketStatus: window.TicketStorage.canTransitionTicketStatus,
        updateTicketStatus: window.TicketStorage.updateTicketStatus
    };

    function normalizeEmail(email) {
        return typeof email === "string" ? email.trim().toLowerCase() : "";
    }

    function getDirectoryUser(email) {
        if (!window.AppStorage || typeof window.AppStorage.get !== "function") {
            return null;
        }
        const users = window.AppStorage.get("users", []);
        const target = normalizeEmail(email);
        if (!Array.isArray(users) || !target) {
            return null;
        }
        return users.find(function (user) {
            return user && normalizeEmail(user.email) === target;
        }) || null;
    }

    function isAssignableUser(email) {
        const user = getDirectoryUser(email);
        return Boolean(
            user &&
            user.status === "active" &&
            ASSIGNEE_ROLES.includes(user.role)
        );
    }

    function getCurrentActor() {
        if (typeof window.getCurrentUser !== "function") {
            return null;
        }

        const user = window.getCurrentUser();

        if (
            !user ||
            typeof user !== "object" ||
            !SUPPORTED_ROLES.includes(user.role) ||
            !normalizeEmail(user.email)
        ) {
            return null;
        }

        return {
            email: normalizeEmail(user.email),
            name: typeof user.name === "string" ? user.name.trim() : "",
            role: user.role
        };
    }

    function getTicket(id) {
        if (
            typeof id !== "string" ||
            !id.trim() ||
            typeof window.TicketStorage.getTicketById !== "function"
        ) {
            return null;
        }

        return window.TicketStorage.getTicketById(id.trim());
    }

    function isRequester(ticket, actor) {
        return Boolean(
            ticket &&
            actor &&
            normalizeEmail(ticket.requesterEmail) === actor.email
        );
    }

    function isAssignee(ticket, actor) {
        return Boolean(
            ticket &&
            actor &&
            normalizeEmail(ticket.assigneeEmail) === actor.email
        );
    }

    function canCreateTicket(ticket, actor) {
        const currentActor = actor || getCurrentActor();

        if (
            !currentActor ||
            !ticket ||
            typeof ticket !== "object" ||
            Array.isArray(ticket)
        ) {
            return false;
        }

        if (normalizeEmail(ticket.requesterEmail) !== currentActor.email) {
            return false;
        }

        if (ticket.status !== "open") {
            return false;
        }

        if (ticket.assigneeEmail !== null && ticket.assigneeEmail !== undefined) {
            return false;
        }

        if (ticket.resolvedAt !== null && ticket.resolvedAt !== undefined) {
            return false;
        }

        return true;
    }

    function canEditTicket(id, actor) {
        const currentActor = actor || getCurrentActor();
        const ticket = getTicket(id);

        if (!currentActor || !ticket) {
            return false;
        }

        if (currentActor.role === "technical_lead") {
            return true;
        }

        if (currentActor.role === "technician") {
            return (
                isAssignee(ticket, currentActor) &&
                !["resolved", "closed"].includes(ticket.status)
            );
        }

        if (currentActor.role === "user") {
            return (
                isRequester(ticket, currentActor) &&
                ["open", "reopened"].includes(ticket.status)
            );
        }

        return false;
    }

    function canAssignTicket(id, assigneeEmail, actor) {
        const currentActor = actor || getCurrentActor();
        const ticket = getTicket(id);

        if (!currentActor || !ticket || currentActor.role !== "technical_lead") {
            return false;
        }

        if (
            typeof window.TicketStorage.isValidAssigneeEmail === "function" &&
            !window.TicketStorage.isValidAssigneeEmail(assigneeEmail)
        ) {
            return false;
        }

        if (!isAssignableUser(assigneeEmail)) {
            return false;
        }

        return !["resolved", "closed"].includes(ticket.status);
    }

    function canChangeTicketStatus(id, nextStatus, actor) {
        const currentActor = actor || getCurrentActor();
        const ticket = getTicket(id);

        if (!currentActor || !ticket) {
            return false;
        }

        if (typeof original.canTransitionTicketStatus !== "function") {
            return false;
        }

        if (!original.canTransitionTicketStatus(id, nextStatus)) {
            return false;
        }

        if (currentActor.role === "technical_lead") {
            return true;
        }

        if (currentActor.role === "technician") {
            return (
                isAssignee(ticket, currentActor) &&
                TECHNICIAN_STATUS_TARGETS.includes(nextStatus)
            );
        }

        return false;
    }

    function getTicketActionPermissions(id) {
        const actor = getCurrentActor();
        const ticket = getTicket(id);

        if (!actor || !ticket) {
            return {
                canEdit: false,
                canAssign: false,
                allowedStatusTargets: []
            };
        }

        const possibleStatuses = [
            "open",
            "assigned",
            "in_progress",
            "pending",
            "resolved",
            "closed",
            "reopened"
        ];

        return {
            canEdit: canEditTicket(id, actor),
            canAssign: actor.role === "technical_lead" && !["resolved", "closed"].includes(ticket.status),
            allowedStatusTargets: possibleStatuses.filter(function (status) {
                return canChangeTicketStatus(id, status, actor);
            })
        };
    }

    if (typeof original.createTicket === "function") {
        window.TicketStorage.createTicket = function (ticket) {
            if (!canCreateTicket(ticket)) {
                return false;
            }

            return original.createTicket(ticket);
        };
    }

    if (typeof original.updateTicket === "function") {
        window.TicketStorage.updateTicket = function (id, changes) {
            if (!canEditTicket(id)) {
                return null;
            }

            return original.updateTicket(id, changes);
        };
    }

    if (typeof original.assignTicket === "function") {
        window.TicketStorage.assignTicket = function (id, assigneeEmail) {
            if (!canAssignTicket(id, assigneeEmail)) {
                return null;
            }

            return original.assignTicket(id, assigneeEmail);
        };
    }

    if (typeof original.canTransitionTicketStatus === "function") {
        window.TicketStorage.canTransitionTicketStatus = function (id, nextStatus) {
            return canChangeTicketStatus(id, nextStatus);
        };
    }

    if (typeof original.updateTicketStatus === "function") {
        window.TicketStorage.updateTicketStatus = function (id, nextStatus) {
            if (!canChangeTicketStatus(id, nextStatus)) {
                return null;
            }

            return original.updateTicketStatus(id, nextStatus);
        };
    }

    window.TicketActionPermissions = {
        getCurrentActor,
        isAssignableUser,
        canCreateTicket,
        canEditTicket,
        canAssignTicket,
        canChangeTicketStatus,
        getTicketActionPermissions
    };
})();
