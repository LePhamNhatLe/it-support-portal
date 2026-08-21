// Route / Page permission guard
// - Session không hợp lệ -> login.html
// - Không có quyền -> dashboard.html
// - Dùng auth.js + permissions.js

(function () {
    function getFileName() {
        const path = window.location.pathname || "";
        const parts = path.split("/");
        return parts[parts.length - 1] || "";
    }

    function redirectToLogin() {
        window.location.href = "login.html";
    }

    function redirectToDashboard() {
        window.location.href = "dashboard.html";
    }

    const file = getFileName();

    // Không guard trang login
    if (!file || file === "login.html") {
        return;
    }

    // Kiểm tra auth.js
    if (typeof isValidSession !== "function") {
        console.error("guard.js: isValidSession() chưa được load.");
        return;
    }

    // Session không hợp lệ
    if (!isValidSession()) {
        redirectToLogin();
        return;
    }

    // Kiểm tra permissions.js
    if (
        !window.AppPermissions ||
        typeof window.AppPermissions.hasPermission !== "function"
    ) {
        console.error("guard.js: AppPermissions chưa được load.");
        return;
    }

    const P = window.AppPermissions.PERMISSIONS;

    const pageToPermission = {
        "dashboard.html": P.DASHBOARD,
        "tickets.html": P.TICKETS,
        "ticket-detail.html": P.TICKET_DETAIL,
        "devices.html": P.DEVICES,
        "users.html": P.USERS,
        "network.html": P.NETWORK,
        "reports.html": P.REPORTS,
        "settings.html": P.SETTINGS
    };

    const requiredPermission = pageToPermission[file];

    // Trang không nằm trong danh sách phân quyền
    if (!requiredPermission) {
        return;
    }

    // Không có quyền
    if (!window.AppPermissions.hasPermission(requiredPermission)) {
        redirectToDashboard();
        return;
    }
})();