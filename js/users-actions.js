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

    function notify(message, type) {
        if (window.AppUI && typeof window.AppUI.notify === "function") {
            window.AppUI.notify(message, type || "info");
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
        return Boolean(
            currentUser &&
            user &&
            normalizeEmail(currentUser.email) === normalizeEmail(user.email)
        );
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

    function getSelfUpdateError(user, changes) {
        if (!isCurrentUser(user) || !changes || typeof changes !== "object") {
            return null;
        }

        if (
            Object.prototype.hasOwnProperty.call(changes, "role") &&
            changes.role !== user.role
        ) {
            return "Không thể tự thay đổi vai trò của tài khoản đang đăng nhập.";
        }

        if (
            Object.prototype.hasOwnProperty.call(changes, "status") &&
            changes.status !== "active"
        ) {
            return "Không thể tự khóa hoặc vô hiệu tài khoản đang đăng nhập.";
        }

        return null;
    }

    function patchUserStorage() {
        if (
            !window.UserStorage ||
            typeof window.UserStorage.updateUser !== "function" ||
            window.UserStorage.__selfProtectionPatched
        ) {
            return;
        }

        const originalUpdateUser = window.UserStorage.updateUser;

        window.UserStorage.updateUser = function (id, changes) {
            const user = window.UserStorage.getUserById(id);
            const message = getSelfUpdateError(user, changes);
            if (message) {
                return {
                    ok: false,
                    reason: "self_protection",
                    message,
                    data: null
                };
            }
            return originalUpdateUser(id, changes);
        };

        window.UserStorage.__selfProtectionPatched = true;
    }

    function handleEditSubmit(event) {
        const form = event.target.closest("#user-form");
        if (!form || form.dataset.mode !== "edit" || !window.UserStorage) {
            return;
        }

        const user = window.UserStorage.getUserById(form.dataset.userId);
        if (!user || !isCurrentUser(user)) {
            return;
        }

        const message = getSelfUpdateError(user, {
            role: form.elements.role ? form.elements.role.value : user.role,
            status: form.elements.status ? form.elements.status.value : user.status
        });

        if (!message) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        setFeedback(message, true);
        notify(message, "error");
    }

    function handleSelfLockAction(event) {
        const button = event.target.closest('button[data-action="lock-user"][data-user-id]');
        if (!button || !window.UserStorage) {
            return;
        }

        const user = window.UserStorage.getUserById(button.dataset.userId);
        if (!user || !isCurrentUser(user)) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        const message = "Không thể tự khóa tài khoản đang đăng nhập.";
        setFeedback(message, true);
        notify(message, "error");
    }

    async function handleDeleteAction(event) {
        const button = event.target.closest('button[data-action="delete-user"][data-user-id]');
        if (!button) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        if (!window.UserStorage) {
            const message = "Chức năng quản lý người dùng chưa sẵn sàng.";
            setFeedback(message, true);
            notify(message, "error");
            return;
        }

        const userId = button.dataset.userId;
        const user = window.UserStorage.getUserById(userId);
        if (!user) {
            const message = "Không tìm thấy người dùng.";
            setFeedback(message, true);
            notify(message, "error");
            return;
        }

        if (isCurrentUser(user)) {
            const message = "Không thể xóa " + user.id + " vì đây là tài khoản đang đăng nhập.";
            setFeedback(message, true);
            notify(message, "error");
            return;
        }

        const links = getLinkCounts(user);
        if (links.tickets > 0 || links.devices > 0) {
            const message = "Không thể xóa " + user.id + " vì đang liên kết với " + links.tickets + " phiếu hỗ trợ và " + links.devices + " thiết bị.";
            setFeedback(message, true);
            notify(message, "error");
            return;
        }

        const confirmed = await confirmAction("Xóa người dùng " + user.id + " - " + user.name + "?");
        if (!confirmed) {
            return;
        }

        const result = window.UserStorage.deleteUser(userId);
        if (window.UsersPage && typeof window.UsersPage.renderAll === "function") {
            window.UsersPage.renderAll();
        }
        setFeedback(result.message, !result.ok);
        notify(result.message, result.ok ? "success" : "error");
    }

    patchUserStorage();
    document.addEventListener("submit", handleEditSubmit, true);
    document.addEventListener("click", handleSelfLockAction, true);
    document.addEventListener("click", handleDeleteAction, true);
})();
