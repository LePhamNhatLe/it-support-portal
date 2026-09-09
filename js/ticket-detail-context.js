(function () {
    function normalizeEmail(value) {
        return typeof value === "string" ? value.trim().toLowerCase() : "";
    }

    function read(key) {
        if (!window.AppStorage || typeof window.AppStorage.get !== "function") {
            return [];
        }
        const value = window.AppStorage.get(key, []);
        return Array.isArray(value) ? value : [];
    }

    function findUserByEmail(email) {
        const target = normalizeEmail(email);
        if (!target) {
            return null;
        }
        return read("users").find(function (user) {
            return user && normalizeEmail(user.email) === target;
        }) || null;
    }

    function findDeviceById(id) {
        const target = typeof id === "string" ? id.trim() : "";
        if (!target) {
            return null;
        }
        return read("devices").find(function (device) {
            return device && device.id === target;
        }) || null;
    }

    function setText(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    function render() {
        if (!window.TicketDetail || typeof window.TicketDetail.getCurrentTicket !== "function") {
            return null;
        }

        const ticket = window.TicketDetail.getCurrentTicket();
        if (!ticket) {
            return null;
        }

        const requester = findUserByEmail(ticket.requesterEmail);
        const assignee = findUserByEmail(ticket.assigneeEmail);
        const device = findDeviceById(ticket.deviceId);

        if (requester) {
            setText("[data-ticket-requester-name]", requester.name || requester.email);
            setText("[data-ticket-department]", requester.department || "Chưa có dữ liệu");
        }

        if (assignee) {
            const assigneeName = assignee.name || assignee.email;
            setText("[data-ticket-assignee]", assigneeName);
            setText("[data-ticket-workflow-assignee]", assigneeName);
        }

        if (device) {
            setText("[data-ticket-device]", device.id + " - " + (device.name || "Thiết bị"));
        }

        return { ticket, requester, assignee, device };
    }

    window.TicketDetailContext = {
        render,
        findUserByEmail,
        findDeviceById
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", render);
    } else {
        render();
    }
})();
