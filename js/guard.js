// Route / Page permission guard
// - Redirects anonymous users to ../pages/login.html
// - Redirects unauthorized users to ../pages/dashboard.html
// - Uses window.isLoggedIn() (from auth.js) and window.AppPermissions.hasPermission()
(function () {
  function getFileName() {
    try {
      var path = window.location.pathname || window.location.href || "";
      var parts = path.split("/");
      return parts[parts.length - 1] || "";
    } catch (e) {
      return "";
    }
  }

  function redirectToLogin() {
    window.location.href = "../pages/login.html";
  }

  function redirectToDashboard() {
    window.location.href = "../pages/dashboard.html";
  }

  var file = getFileName();

  // Do not guard the login page itself
  if (!file || file === "login.html") {
    return;
  }

  // Ensure auth helper exists
  if (typeof isLoggedIn !== "function") {
    // If no auth helper available, don't attempt to guard
    return;
  }

  // If not logged in -> send to login
  if (!isLoggedIn()) {
    redirectToLogin();
    return;
  }

  // Ensure permissions helper exists
  if (!window.AppPermissions || typeof window.AppPermissions.hasPermission !== "function") {
    // If permissions not available, allow by default
    return;
  }

  var P = window.AppPermissions.PERMISSIONS || {};

  var pageToPermission = {
    "dashboard.html": P.DASHBOARD,
    "tickets.html": P.TICKETS,
    "ticket-detail.html": P.TICKET_DETAIL,
    "devices.html": P.DEVICES,
    "users.html": P.USERS,
    "network.html": P.NETWORK,
    "reports.html": P.REPORTS,
    "settings.html": P.SETTINGS
  };

  var required = pageToPermission[file];

  // If page is not in the mapping, don't block (allow)
  if (!required) {
    return;
  }

  try {
    if (!window.AppPermissions.hasPermission(required)) {
      redirectToDashboard();
    }
  } catch (e) {
    // On error, allow (fail-open) to avoid locking out users due to JS errors
    return;
  }
})();
