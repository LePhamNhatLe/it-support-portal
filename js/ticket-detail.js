(function () {
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
            !window.TicketStorage ||
            typeof window.TicketStorage.getTicketById !== "function"
        ) {
            return null;
        }

        return window.TicketStorage.getTicketById(id.trim());
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
            !window.TicketStorage ||
            typeof window.TicketStorage.getTicketById !== "function"
        ) {
            return {
                ok: false,
                reason: "storage_unavailable",
                ticket: null
            };
        }

        const ticket = window.TicketStorage.getTicketById(id);

        if (!ticket) {
            return {
                ok: false,
                reason: "not_found",
                ticket: null
            };
        }

        return {
            ok: true,
            reason: null,
            ticket
        };
    }

    window.TicketDetail = {
        getTicketIdFromUrl,
        isValidTicketId,
        getTicketById,
        getCurrentTicket,
        getTicketDetailState
    };
})();
