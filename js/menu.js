(function () {
  function resolveAsset(path) {
    const currentScript = document.currentScript;
    if (currentScript && currentScript.src) {
      return currentScript.src.replace(/\/js\/menu\.js(?:\?.*)?$/, path);
    }
    return ".." + path;
  }

  function loadTechTheme() {
    if (document.querySelector('link[data-tech-theme="true"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = resolveAsset("/css/tech-theme.css");
    link.dataset.techTheme = "true";
    document.head.appendChild(link);
  }

  function loadActionColors() {
    if (document.querySelector('link[data-action-colors="true"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = resolveAsset("/css/action-colors.css");
    link.dataset.actionColors = "true";
    document.head.appendChild(link);
  }

  function loadPanelModalAdapter() {
    if (document.querySelector('script[data-panel-modal-adapter="true"]')) return;
    const script = document.createElement("script");
    script.src = resolveAsset("/js/panel-modal-adapter.js");
    script.defer = true;
    script.dataset.panelModalAdapter = "true";
    document.head.appendChild(script);
  }

  function getCurrentUser() {
    return typeof window.getCurrentUser === "function" ? window.getCurrentUser() : null;
  }

  function getThemeStorageKey() {
    const user = getCurrentUser();
    if (!user || typeof user.email !== "string" || !user.email.trim()) return null;
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
    if (!text) return null;

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
      if (toast.isConnected) toast.remove();
    };

    closeButton.addEventListener("click", remove);
    toast.append(messageElement, closeButton);
    getToastRegion().appendChild(toast);
    window.setTimeout(remove, Number.isFinite(duration) ? duration : 3600);
    return toast;
  }

  function openModal(options) {
    const settings = options && typeof options === "object" ? options : {};
    const size = ["sm", "md", "lg", "xl"].includes(settings.size) ? settings.size : "md";
    const backdrop = document.createElement("div");
    backdrop.className = "ui-modal-backdrop";

    const modal = document.createElement("section");
    modal.className = "ui-modal ui-modal--" + size;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const header = document.createElement("header");
    header.className = "ui-modal__header";
    const heading = document.createElement("h2");
    heading.textContent = String(settings.title || "Thông tin");
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "ui-modal__close";
    closeButton.setAttribute("aria-label", "Đóng cửa sổ");
    closeButton.textContent = "×";
    header.append(heading, closeButton);

    const body = document.createElement("div");
    body.className = "ui-modal__body";
    if (settings.content instanceof Node) {
      body.appendChild(settings.content);
    } else if (typeof settings.content === "string") {
      const paragraph = document.createElement("p");
      paragraph.textContent = settings.content;
      body.appendChild(paragraph);
    }

    modal.append(header, body);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    document.body.classList.add("ui-modal-open");

    const previousFocus = document.activeElement;
    let closed = false;

    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
      if (!document.querySelector(".ui-modal-backdrop")) {
        document.body.classList.remove("ui-modal-open");
      }
      if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
      if (typeof settings.onClose === "function") settings.onClose();
    }

    function onKeydown(event) {
      if (event.key === "Escape" && settings.closeOnEscape !== false) close();
    }

    closeButton.addEventListener("click", close);
    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop && settings.closeOnBackdrop !== false) close();
    });
    document.addEventListener("keydown", onKeydown);
    closeButton.focus();

    return { backdrop, modal, body, close };
  }

  function confirmAction(options) {
    const settings = typeof options === "string" ? { message: options } : (options || {});
    return new Promise(function (resolve) {
      const content = document.createElement("div");
      content.className = "ui-confirm";
      const message = document.createElement("p");
      message.textContent = String(settings.message || "Bạn có chắc muốn tiếp tục?");
      const actions = document.createElement("div");
      actions.className = "ui-modal__actions";

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "button button--ghost";
      cancelButton.textContent = String(settings.cancelText || "Hủy");

      const confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.className = settings.danger ? "button ui-button--danger" : "button button--primary";
      confirmButton.textContent = String(settings.confirmText || "Xác nhận");

      actions.append(cancelButton, confirmButton);
      content.append(message, actions);

      let controller = null;
      let settled = false;
      function finish(value) {
        if (settled) return;
        settled = true;
        if (controller) controller.close();
        resolve(value);
      }

      cancelButton.addEventListener("click", function () { finish(false); });
      confirmButton.addEventListener("click", function () { finish(true); });

      controller = openModal({
        title: String(settings.title || "Xác nhận thao tác"),
        content,
        size: "sm",
        onClose: function () {
          if (!settled) {
            settled = true;
            resolve(false);
          }
        }
      });
      confirmButton.focus();
    });
  }

  function closeSidebar() {
    const toggle = document.getElementById("sidebar-toggle");
    if (toggle) toggle.checked = false;
    document.body.dataset.sidebarOpen = "false";
  }

  function initSidebarBackdrop() {
    const toggle = document.getElementById("sidebar-toggle");
    if (!toggle || document.querySelector(".ui-sidebar-backdrop")) return;

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
      if (event.key === "Escape" && toggle.checked) closeSidebar();
    });
  }

  loadTechTheme();
  loadActionColors();

  window.AppUI = {
    notify,
    openModal,
    confirm: confirmAction,
    applyTheme,
    closeSidebar
  };

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme();
    initSidebarBackdrop();
    loadPanelModalAdapter();

    if (!window.AppPermissions || typeof window.AppPermissions.hasPermission !== "function") {
      console.error("AppPermissions chưa được load.");
      return;
    }

    document.querySelectorAll("[data-permission]").forEach(function (item) {
      const permission = item.dataset.permission;
      if (!permission || !window.AppPermissions.hasPermission(permission)) item.style.display = "none";
    });
  });
})();
