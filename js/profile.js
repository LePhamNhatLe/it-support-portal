// Populate profile UI from current user stored by auth.js
(function () {
  if (typeof getCurrentUser !== "function") {
    return;
  }

  var user = getCurrentUser();

  if (!user) {
    return;
  }

  function initialsFromName(name) {
    if (!name) return "";
    var parts = name.trim().split(/\s+/);
    var first = parts[0] ? parts[0].charAt(0).toUpperCase() : "";
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : "";
    return (first + last).slice(0, 2);
  }

  var avatarEls = document.querySelectorAll("[data-user-avatar]");
  var nameEls = document.querySelectorAll("[data-user-name]");
  var roleEls = document.querySelectorAll("[data-user-role]");

  var initials = initialsFromName(user.name || "");

  avatarEls.forEach(function (el) {
    el.textContent = initials;
  });

  nameEls.forEach(function (el) {
    el.textContent = user.name || "";
  });

  var roleName = null;
  if (window.AppPermissions && typeof window.AppPermissions.getRoleName === "function") {
    roleName = window.AppPermissions.getRoleName(user.role);
  }

  if (!roleName) {
    roleName = "Người dùng";
  }

  roleEls.forEach(function (el) {
    el.textContent = roleName;
  });
})();
