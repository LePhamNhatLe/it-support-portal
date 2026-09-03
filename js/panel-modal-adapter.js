(function () {
  const CONFIG = {
    "create-ticket-panel": { size: "lg", title: "Tạo phiếu hỗ trợ" },
    "device-editor-panel": { size: "xl", title: "Thông tin thiết bị" },
    "device-detail-panel": { size: "lg", title: "Chi tiết thiết bị" },
    "user-editor-panel": { size: "xl", title: "Thông tin người dùng" },
    "user-detail-panel": { size: "lg", title: "Chi tiết người dùng" },
    "network-editor-panel": { size: "xl", title: "Thông tin thiết bị mạng" },
    "network-detail-panel": { size: "lg", title: "Chi tiết thiết bị mạng" }
  };

  const states = new Map();

  function getTitle(panel, fallback) {
    const heading = panel.querySelector(".panel__header h2, h2");
    return heading && heading.textContent.trim() ? heading.textContent.trim() : fallback;
  }

  function moveBack(panel, state) {
    if (!state || state.restoring) return;
    state.restoring = true;
    panel.hidden = true;
    panel.classList.remove("ui-promoted-panel");
    if (state.placeholder && state.placeholder.parentNode) {
      state.placeholder.parentNode.insertBefore(panel, state.placeholder);
      state.placeholder.remove();
    }
    states.delete(panel);
    state.restoring = false;
  }

  function promote(panel) {
    if (!panel || panel.hidden || states.has(panel)) return;
    if (!window.AppUI || typeof window.AppUI.openModal !== "function") return;

    const config = CONFIG[panel.id];
    if (!config) return;

    const placeholder = document.createComment("modal-placeholder:" + panel.id);
    panel.parentNode.insertBefore(placeholder, panel);
    panel.classList.add("ui-promoted-panel");

    const header = panel.querySelector(":scope > .panel__header");
    if (header) header.hidden = true;

    const state = { placeholder, controller: null, restoring: false, header };
    states.set(panel, state);

    state.controller = window.AppUI.openModal({
      title: getTitle(panel, config.title),
      content: panel,
      size: config.size,
      closeOnBackdrop: true,
      closeOnEscape: true,
      onClose: function () {
        if (header) header.hidden = false;
        moveBack(panel, state);
      }
    });
  }

  function handleHiddenChange(panel) {
    const state = states.get(panel);
    if (!state) {
      if (!panel.hidden) promote(panel);
      return;
    }

    if (panel.hidden && !state.restoring) {
      if (state.header) state.header.hidden = false;
      state.controller.close();
    }
  }

  function initPanel(panel) {
    if (!panel || !CONFIG[panel.id]) return;

    const observer = new MutationObserver(function (mutations) {
      if (mutations.some(function (mutation) { return mutation.attributeName === "hidden"; })) {
        handleHiddenChange(panel);
      }
    });
    observer.observe(panel, { attributes: true, attributeFilter: ["hidden"] });

    if (!panel.hidden) promote(panel);
  }

  function init() {
    Object.keys(CONFIG).forEach(function (id) {
      initPanel(document.getElementById(id));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
