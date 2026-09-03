(function () {
    function setFeedback(message, isError) {
        const element = document.getElementById("user-feedback");
        if (!element) {
            return;
        }
        element.textContent = message || "";
        element.hidden = !message;
        element.dataset.state = isError ? "error" : "success";
        if (message) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    function normalizeEmail(value) {
        return typeof value === "string" ? value.trim().toLowerCase() : "";
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

    function handleDeleteAction(event) {
        const button = event.target.closest('button[data-action="delete-user"][data-user-id]');
        if (!button) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        if (!window.UserStorage) {
            setFeedback("Chức năng quản lý người dùng chưa sẵn sàng.", true);
            return;
        }

        const userId = button.dataset.userId;
        const user = window.UserStorage.getUserById(userId);
        if (!user) {
            setFeedback("Không tìm thấy người dùng.", true);
            return;
        }

        const currentUser = typeof window.getCurrentUser === "function" ? window.getCurrentUser() : null;
        if (currentUser && normalizeEmail(currentUser.email) === normalizeEmail(user.email)) {
            const message = "Không thể xóa " + user.id + " vì đây là tài khoản đang đăng nhập.";
            setFeedback(message, true);
            window.alert(message);
            return;
        }

        const links = getLinkCounts(user);
        if (links.tickets > 0 || links.devices > 0) {
            const message = "Không thể xóa " + user.id + " vì đang liên kết với " + links.tickets + " phiếu hỗ trợ và " + links.devices + " thiết bị.";
            setFeedback(message, true);
            window.alert(message);
            return;
        }

        if (!window.confirm("Xóa người dùng " + user.id + " - " + user.name + "?")) {
            return;
        }

        const result = window.UserStorage.deleteUser(userId);
        if (window.UsersPage && typeof window.UsersPage.renderAll === "function") {
            window.UsersPage.renderAll();
        }
        setFeedback(result.message, !result.ok);
        if (!result.ok) {
            window.alert(result.message);
        }
    }

    document.addEventListener("click", handleDeleteAction, true);
})();
