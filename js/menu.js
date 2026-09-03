(function () {
  function loadPolishStyles() {
    if (document.querySelector('link[data-ui-polish="true"]')) {
      return;
    }

    const currentScript = document.currentScript;
    const href = currentScript && currentScript.src
      ? currentScript.src.replace(/\/js\/menu\.js(?:\?.*)?$/, "/css/polish.css")
      : "../css/polish.css";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.uiPolish = "true";
    document.head.appendChild(link);
  }

  function getCurrentUser() {
    return typeof window.getCurrentUser === "function" ? window.getCurrentUser() : null;
  }

  function getThemeStorageKey() {
    const user = getCurrentUser();
    if (!user || typeof user.email !== "string" || !user.email.trim()) {
      return null;
    }
    return "userSettings:" + user.email.trim().toLowerCase();
  }

  function applyTheme(theme) {
    let target = theme;
    if (target !== "light" && target !== "dark") {
      const key = getThemeStorageKey();
      if (key && window.AppStorage && typeof window.AppStorage.get === "function") {
        const stored = window.AppStorage.get(key, null);
        target = stored && stored.theme === "dark" ? "dark" : "light";
      } else {
        target = "light";
      }
    }
    document.documentElement.dataset.theme = target;
    return target;
  }

  function getToastRegion() {
    let region = document.querySelector(".ui-toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "ui-toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "false");
      document.body.appendChild(region);
    }
    return region;
  }

  function notify(message, type, duration) {
    const text = typeof message === "string" ? message.trim() : "";
    if (!text) {
      return null;
    }

    const toast = document.createElement("div");
    toast.className = "ui-toast";
    toast.dataset.type = ["success", "warning", "error", "info"].includes(type) ? type : "info";
    toast.setAttribute("role", toast.dataset.type === "error" ? "alert" : "status");

    const messageElement = document.createElement("p");
    messageElement.className = "ui-toast__message";
    messageElement.textContent = text;

    const closeButton = document.createElement("button");
    closeButton.className = "ui-toast__close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Đóng thông báo");
    closeButton.textContent = "×";

    const remove = function () {
      if (toast.isConnected) {
        toast.remove();
      }
    };

    closeButton.addEventListener("click", remove);
    toast.append(messageElement, closeButton);
    getToastRegion().appendChild(toast);
    window.setTimeout(remove, Number.isFinite(duration) ? duration : 3600);
    return toast;
  }

  function confirmAction(options) {
    const settings = typeof options === "string" ? { message: options } : (options || {});
    const message = String(settings.message || "Bạn có chắc muốn tiếp tục?");
    const title = String(settings.title || "Xác nhận thao tác");
    const confirmText = String(settings.confirmText || "Xác nhận");
    const cancelText = String(settings.cancelText || "Hủy");

    return new Promise(function (resolve) {
      const backdrop = document.createElement("div");
      backdrop.className = "ui-modal-backdrop";

      const modal = document.createElement("section");
      modal.className = "ui-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");

      const heading = document.createElement("h2");
      heading.textContent = title;
      const body = document.createElement("p");
      body.textContent = message;
      const actions = document.createElement("div");
      actions.className = "ui-modal__actions";

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "button button--ghost";
      cancelButton.textContent = cancelText;

      const confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.className = "button button--primary";
      confirmButton.textContent = confirmText;

      function finish(value) {
        document.removeEventListener("keydown", onKeydown);
        backdrop.remove();
        resolve(value);
      }

      function onKeydown(event) {
        if (event.key === "Escape") {
          finish(false);
        }
      }

      cancelButton.addEventListener("click", function () { finish(false); });
      confirmButton.addEventListener("click", function () { finish(true); });
      backdrop.addEventListener("click", function (event) {
        if (event.target === backdrop) {
          finish(false);
        }
      });
      document.addEventListener("keydown", onKeydown);

      actions.append(cancelButton, confirmButton);
      modal.append(heading, body, actions);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      confirmButton.focus();
    });
  }

  function closeSidebar() {
    const toggle = document.getElementById("sidebar-toggle");
    if (toggle) {
      toggle.checked = false;
    }
    document.body.dataset.sidebarOpen = "false";
  }

  function initSidebarBackdrop() {
    const toggle = document.getElementById("sidebar-toggle");
    if (!toggle || document.querySelector(".ui-sidebar-backdrop")) {
      return;
    }

    const backdrop = document.createElement("div");
    backdrop.className = "ui-sidebar-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.appendChild(backdrop);

    toggle.addEventListener("change", function () {
      document.body.dataset.sidebarOpen = toggle.checked ? "true" : "false";
    });
    backdrop.addEventListener("click", closeSidebar);

    document.querySelectorAll(".sidebar__nav a").forEach(function (link) {
      link.addEventListener("click", closeSidebar);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.checked) {
        closeSidebar();
      }
    });
  }

  loadPolishStyles();

  window.AppUI = {
    notify,
    confirm: confirmAction,
    applyTheme,
    closeSidebar
  };

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme();
    initSidebarBackdrop();

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
})();
