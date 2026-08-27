(function () {
    const ACTIVITY_STORAGE_KEY = "ticketActivities";
    const ACTIVITY_TYPES = ["comment", "work_note", "system"];
    const STAFF_ROLES = ["technical_lead", "technician"];

    function normalizeText(value) {
        return typeof value === "string" ? value.trim() : "";
    }

    function getCurrentActor() {
        if (typeof window.getCurrentUser !== "function") {
            return null;
        }

        const user = window.getCurrentUser();

        if (
            !user ||
            typeof user !== "object" ||
            !normalizeText(user.email) ||
            !normalizeText(user.name) ||
            !normalizeText(user.role)
        ) {
            return null;
        }

        return {
            email: user.email.trim().toLowerCase(),
            name: user.name.trim(),
            role: user.role.trim()
        };
    }

    function getActivityStore() {
        if (!window.AppStorage || typeof window.AppStorage.get !== "function") {
            return {};
        }

        const stored = window.AppStorage.get(ACTIVITY_STORAGE_KEY, {});
        return stored && typeof stored === "object" && !Array.isArray(stored)
            ? stored
            : {};
    }

    function saveActivityStore(store) {
        if (
            !store ||
            typeof store !== "object" ||
            Array.isArray(store) ||
            !window.AppStorage ||
            typeof window.AppStorage.set !== "function"
        ) {
            return false;
        }

        return window.AppStorage.set(ACTIVITY_STORAGE_KEY, store);
    }

    function getTicketAccessState(ticketId) {
        if (
            !window.TicketAccess ||
            typeof window.TicketAccess.getTicketAccessState !== "function"
        ) {
            return { ok: false, reason: "access_unavailable", ticket: null };
        }

        return window.TicketAccess.getTicketAccessState(ticketId);
    }

    function createActivityId(ticketId, activities) {
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

    function getTicketActivities(ticketId) {
        const normalizedTicketId = normalizeText(ticketId);

        if (!normalizedTicketId) {
            return [];
        }

        const accessState = getTicketAccessState(normalizedTicketId);

        if (!accessState.ok) {
            return [];
        }

        const store = getActivityStore();
        const activities = store[normalizedTicketId];

        if (!Array.isArray(activities)) {
            return [];
        }

        return activities
            .filter(function (activity) {
                return activity && typeof activity === "object";
            })
            .slice()
            .sort(function (a, b) {
                const timeA = Date.parse(a.createdAt || "") || 0;
                const timeB = Date.parse(b.createdAt || "") || 0;
                return timeA - timeB;
            });
    }

    function addActivity(ticketId, type, message, metadata) {
        const normalizedTicketId = normalizeText(ticketId);
        const normalizedMessage = normalizeText(message);

        if (
            !normalizedTicketId ||
            !ACTIVITY_TYPES.includes(type) ||
            !normalizedMessage
        ) {
            return null;
        }

        const accessState = getTicketAccessState(normalizedTicketId);

        if (!accessState.ok) {
            return null;
        }

        const actor = getCurrentActor();

        if (!actor) {
            return null;
        }

        if (type === "work_note" && !STAFF_ROLES.includes(actor.role)) {
            return null;
        }

        const store = getActivityStore();
        const currentActivities = Array.isArray(store[normalizedTicketId])
            ? store[normalizedTicketId].slice()
            : [];
        const now = new Date().toISOString();

        const activity = {
            id: createActivityId(normalizedTicketId, currentActivities),
            ticketId: normalizedTicketId,
            type,
            message: normalizedMessage,
            actorEmail: actor.email,
            actorName: actor.name,
            actorRole: actor.role,
            createdAt: now,
            metadata:
                metadata && typeof metadata === "object" && !Array.isArray(metadata)
                    ? { ...metadata }
                    : null
        };

        const nextStore = {
            ...store,
            [normalizedTicketId]: [...currentActivities, activity]
        };

        if (!saveActivityStore(nextStore)) {
            return null;
        }

        return activity;
    }

    function addComment(ticketId, message) {
        return addActivity(ticketId, "comment", message, null);
    }

    function addWorkNote(ticketId, message) {
        return addActivity(ticketId, "work_note", message, null);
    }

    function addSystemActivity(ticketId, message, metadata) {
        return addActivity(ticketId, "system", message, metadata);
    }

    function getComments(ticketId) {
        return getTicketActivities(ticketId).filter(function (activity) {
            return activity.type === "comment";
        });
    }

    function getWorkNotes(ticketId) {
        return getTicketActivities(ticketId).filter(function (activity) {
            return activity.type === "work_note";
        });
    }

    function getHistory(ticketId) {
        return getTicketActivities(ticketId).filter(function (activity) {
            return activity.type === "work_note" || activity.type === "system";
        });
    }

    window.TicketActivity = {
        getCurrentActor,
        getTicketActivities,
        getComments,
        getWorkNotes,
        getHistory,
        addComment,
        addWorkNote,
        addSystemActivity
    };
})();
