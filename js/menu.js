document.addEventListener("DOMContentLoaded", function () {
  if (
    !window.AppPermissions ||
    typeof window.AppPermissions.hasPermission !== "function"
  ) {
    console.error("AppPermissions chưa được load.");
    return;
  }

  const menuItems = document.querySelectorAll("[data-permission]");

  menuItems.forEach(function (item) {
    const permission = item.dataset.permission;

    if (!permission || !window.AppPermissions.hasPermission(permission)) {
      item.style.display = "none";
    }
  });
});
