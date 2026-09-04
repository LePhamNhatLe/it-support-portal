// Route / Page permission guard
// - Session không hợp lệ -> login.html
// - Không có quyền -> dashboard.html
// - Thiếu dependency bảo mật -> login.html thay vì tiếp tục hiển thị trang

(function () {
    function getFileName() {
        const path = window.location.pathname || "";
        const parts = path.split("/");
        return parts[parts.length - 1] || "";
    }

    function redirectToLogin() {
        window.location.replace("login.html");
    }

    function redirectToDashboard() {
        window.location.replace("dashboard.html");
    }

    const file = getFileName();

    if (!file || file === "login.html") {
        return;
    }

    if (typeof window.isValidSession !== "function") {
        console.error("guard.js: isValidSession() chưa được load. Từ chối truy cập để tránh fail-open.");
        redirectToLogin();
        return;
    }

    if (!window.isValidSession()) {
        redirectToLogin();
        return;
    }

    if (
        !window.AppPermissions ||
        typeof window.AppPermissions.hasPermission !== "function" ||
        !window.AppPermissions.PERMISSIONS
    ) {
        console.error("guard.js: AppPermissions chưa được load. Từ chối truy cập để tránh fail-open.");
        redirectToLogin();
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
    if (!requiredPermission) {
        return;
    }

    if (!window.AppPermissions.hasPermission(requiredPermission)) {
        redirectToDashboard();
    }
})();
