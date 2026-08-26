(function () {
    const SUPPORTED_ROLES = ["technical_lead", "technician", "user"];

    function normalizeEmail(email) {
        return typeof email === "string" ? email.trim().toLowerCase() : "";
    }

    function getCurrentUserSafe() {
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

        return user;
    }

    function canViewTicket(ticket, user) {
        if (!ticket || typeof ticket !== "object") {
            return false;
        }

        const currentUser = user || getCurrentUserSafe();

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
        if (
            !window.TicketStorage ||
            typeof window.TicketStorage.getTickets !== "function"
        ) {
            return [];
        }

        const currentUser = getCurrentUserSafe();

        if (!currentUser) {
            return [];
        }

        const tickets = window.TicketStorage.getTickets();

        if (!Array.isArray(tickets)) {
            return [];
        }

        return tickets.filter(function (ticket) {
            return canViewTicket(ticket, currentUser);
        });
    }

    function getVisibleTicketById(id) {
        if (typeof id !== "string" || id.trim() === "") {
            return null;
        }

        if (
            !window.TicketStorage ||
            typeof window.TicketStorage.getTicketById !== "function"
        ) {
            return null;
        }

        const ticket = window.TicketStorage.getTicketById(id.trim());

        if (!ticket || !canViewTicket(ticket)) {
            return null;
        }

        return ticket;
    }

    function getTicketAccessState(id) {
        if (typeof id !== "string" || id.trim() === "") {
            return {
                ok: false,
                reason: "invalid_id",
                ticket: null
            };
        }

        if (
            !window.TicketStorage ||
            typeof window.TicketStorage.getTicketById !== "function"
        ) {
            return {
                ok: false,
                reason: "storage_unavailable",
                ticket: null
            };
        }

        const currentUser = getCurrentUserSafe();

        if (!currentUser) {
            return {
                ok: false,
                reason: "unauthenticated",
                ticket: null
            };
        }

        const ticket = window.TicketStorage.getTicketById(id.trim());

        if (!ticket) {
            return {
                ok: false,
                reason: "not_found",
                ticket: null
            };
        }

        if (!canViewTicket(ticket, currentUser)) {
            return {
                ok: false,
                reason: "forbidden",
                ticket: null
            };
        }

        return {
            ok: true,
            reason: null,
            ticket
        };
    }

    window.TicketAccess = {
        getCurrentUserSafe,
        canViewTicket,
        getVisibleTickets,
        getVisibleTicketById,
        getTicketAccessState
    };
})();
