(function () {
    const TICKETS_STORAGE_KEY = "tickets";

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

    window.TicketStorage = {
        getTickets,
        saveTickets,
        getTicketById,
        createTicket
    };
})();
