(function () {
    function setFeedback(message, isError) {
        const element = document.getElementById("user-feedback");
        if (!element) return;
        if (!isError) {
            element.textContent = "";
            element.hidden = true;
            delete element.dataset.state;
            return;
        }
        element.textContent = message || "";
        element.hidden = !message;
        element.dataset.state = "error";
        if (message) {
            element.setAttribute("tabindex", "-1");
            element.focus({ preventScroll: true });
        }
    }

    function notifyError(message) {
        if (window.AppUI && typeof window.AppUI.notify === "function") {
            window.AppUI.notify(message, "error");
            return;
        }
        window.alert(message);
    }

    function confirmAction(message) {
        if (window.AppUI && typeof window.AppUI.confirm === "function") {
            return window.AppUI.confirm({
                title: "Xóa người dùng",
                message,
                confirmText: "Xóa",
                cancelText: "Hủy"
            });
        }
        return Promise.resolve(window.confirm(message));
    }

    function normalizeEmail(value) {
        return typeof value === "string" ? value.trim().toLowerCase() : "";
    }

    function getCurrentUser() {
        return typeof window.getCurrentUser === "function" ? window.getCurrentUser() : null;
    }

    function isCurrentUser(user) {
        const currentUser = getCurrentUser();
        return Boolean(currentUser && user && normalizeEmail(currentUser.email) === normalizeEmail(user.email));
    }

    function getLinkCounts(user) {
        const email = normalizeEmail(user && user.email);
        const tickets = window.TicketStorage && typeof window.TicketStorage.getTickets === "function"
            ? window.TicketStorage.getTickets().filter(function (ticket) {
                return ticket && (
                    normalizeEmail(ticket.requesterEmail) === email ||
                    normalizeEmail(ticket.assigneeEmail) === email
                );
            })
            : [];
        const devices = window.DeviceStorage && typeof window.DeviceStorage.getDevices === "function"
            ? window.DeviceStorage.getDevices().filter(function (device) {
                return device && normalizeEmail(device.userEmail) === email;
            })
            : [];
        return { tickets: tickets.length, devices: devices.length };
    }

    async function handleDeleteAction(event) {
        const button = event.target.closest('button[data-action="delete-user"][data-user-id]');
        if (!button) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        if (!window.UserStorage || !window.UsersApiBridge || typeof window.UsersApiBridge.persistDeleteUser !== "function") {
            const message = "Chức năng quản lý người dùng chưa sẵn sàng.";
            setFeedback(message, true);
            notifyError(message);
            return;
        }

        const userId = button.dataset.userId;
        const user = window.UserStorage.getUserById(userId);
        if (!user) {
            const message = "Không tìm thấy người dùng.";
            setFeedback(message, true);
            notifyError(message);
            return;
        }

        if (isCurrentUser(user)) {
            const message = "Không thể xóa " + user.id + " vì đây là tài khoản đang đăng nhập.";
            setFeedback(message, true);
            notifyError(message);
            return;
        }

        const links = getLinkCounts(user);
        if (links.tickets > 0 || links.devices > 0) {
            const message = "Không thể xóa " + user.id + " vì đang liên kết với " + links.tickets + " phiếu hỗ trợ và " + links.devices + " thiết bị.";
            setFeedback(message, true);
            notifyError(message);
            return;
        }

        const confirmed = await confirmAction("Xóa người dùng " + user.id + " - " + user.name + "?");
        if (!confirmed) return;

        button.disabled = true;
        setFeedback("", false);
        try {
            const result = await window.UsersApiBridge.persistDeleteUser(userId);
            if (!result.ok) {
                setFeedback(result.message, true);
                notifyError(result.message);
                return;
            }
            if (window.UsersPage && typeof window.UsersPage.renderAll === "function") {
                window.UsersPage.renderAll();
            }
            setFeedback("", false);
        } catch (error) {
            const message = error && error.message ? error.message : "Không thể xóa người dùng.";
            setFeedback(message, true);
            notifyError(message);
        } finally {
            button.disabled = false;
        }
    }

    document.addEventListener("click", handleDeleteAction, true);
})();
