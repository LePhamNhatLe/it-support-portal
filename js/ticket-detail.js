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
        addCurrentTicketWorkNote
    };
})();
