(function () {
  const DEFAULT_BASE_URL = "http://localhost:3000/api/v1";
  const TOKEN_KEY = "authToken";
  let successToastTimer = null;

  function getBaseUrl() {
    const configured = window.IT_SUPPORT_API_BASE_URL;
    return typeof configured === "string" && configured.trim()
      ? configured.replace(/\/$/, "")
      : DEFAULT_BASE_URL;
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  function ensureSuccessToastStyles() {
    if (document.getElementById("app-success-toast-styles")) return;
    const style = document.createElement("style");
    style.id = "app-success-toast-styles";
    style.textContent = `
      .app-success-toast {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 12px;
        width: min(390px, calc(100vw - 32px));
        padding: 15px 17px;
        border: 1px solid rgba(22, 163, 74, 0.22);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.97);
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
        color: #1f2937;
        opacity: 0;
        transform: translateY(-14px) scale(0.98);
        pointer-events: none;
        transition: opacity 180ms ease, transform 220ms ease;
        backdrop-filter: blur(12px);
      }

      .app-success-toast.is-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .app-success-toast.is-leaving {
        opacity: 0;
        transform: translateY(-8px) scale(0.98);
      }

      .app-success-toast__check {
        position: relative;
        flex: 0 0 34px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #16a34a;
        box-shadow: 0 7px 18px rgba(22, 163, 74, 0.25);
        transform: scale(0.72);
        animation: app-success-pop 360ms cubic-bezier(.2,.9,.28,1.35) forwards;
      }

      .app-success-toast__check::after {
        content: "";
        position: absolute;
        left: 10px;
        top: 8px;
        width: 10px;
        height: 6px;
        border-left: 3px solid #fff;
        border-bottom: 3px solid #fff;
        transform: rotate(-45deg) scale(0);
        transform-origin: center;
        animation: app-success-check 260ms ease 170ms forwards;
      }

      .app-success-toast__content {
        min-width: 0;
      }

      .app-success-toast__title {
        margin: 0 0 2px;
        font-size: 14px;
        font-weight: 750;
        line-height: 1.35;
        color: #166534;
      }

      .app-success-toast__message {
        margin: 0;
        font-size: 13.5px;
        line-height: 1.45;
        color: #475569;
      }

      @keyframes app-success-pop {
        0% { transform: scale(0.72); }
        70% { transform: scale(1.12); }
        100% { transform: scale(1); }
      }

      @keyframes app-success-check {
        from { transform: rotate(-45deg) scale(0); opacity: 0; }
        to { transform: rotate(-45deg) scale(1); opacity: 1; }
      }

      @media (max-width: 640px) {
        .app-success-toast {
          top: 16px;
          right: 16px;
          left: 16px;
          width: auto;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .app-success-toast,
        .app-success-toast__check,
        .app-success-toast__check::after {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getMutationResource(path) {
    const clean = String(path || "").split("?")[0];
    if (clean.startsWith("/users")) return "người dùng";
    if (clean.startsWith("/devices")) return "thiết bị";
    if (clean.startsWith("/network")) return "thiết bị mạng";
    if (clean.startsWith("/tickets")) return "phiếu hỗ trợ";
    if (clean.startsWith("/settings")) return "cài đặt";
    return "dữ liệu";
  }

  function getMutationSuccessMessage(method, path) {
    const resource = getMutationResource(path);
    const normalizedMethod = String(method || "GET").toUpperCase();
    if (normalizedMethod === "POST") return "Đã thêm " + resource + " thành công.";
    if (normalizedMethod === "PATCH" || normalizedMethod === "PUT") return "Đã cập nhật " + resource + " thành công.";
    if (normalizedMethod === "DELETE") return "Đã xóa " + resource + " thành công.";
    return "Thao tác đã hoàn thành.";
  }

  function shouldShowMutationToast(method, path, config) {
    if (config && config.silentSuccess) return false;
    const normalizedMethod = String(method || "GET").toUpperCase();
    if (!["POST", "PATCH", "PUT", "DELETE"].includes(normalizedMethod)) return false;
    const clean = String(path || "").split("?")[0];
    if (clean.startsWith("/auth")) return false;
    return true;
  }

  function showSuccessToast(message) {
    if (!document.body) return;
    ensureSuccessToastStyles();

    let toast = document.getElementById("app-success-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "app-success-toast";
      toast.className = "app-success-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.innerHTML = [
        '<span class="app-success-toast__check" aria-hidden="true"></span>',
        '<div class="app-success-toast__content">',
        '<p class="app-success-toast__title">Hoàn tất</p>',
        '<p class="app-success-toast__message"></p>',
        '</div>'
      ].join("");
      document.body.appendChild(toast);
    }

    const messageElement = toast.querySelector(".app-success-toast__message");
    if (messageElement) messageElement.textContent = message || "Thao tác đã hoàn thành.";

    if (successToastTimer) window.clearTimeout(successToastTimer);
    toast.classList.remove("is-visible", "is-leaving");
    void toast.offsetWidth;
    toast.classList.add("is-visible");

    successToastTimer = window.setTimeout(function () {
      toast.classList.add("is-leaving");
      toast.classList.remove("is-visible");
      window.setTimeout(function () {
        toast.classList.remove("is-leaving");
      }, 240);
    }, 2000);
  }

  function notifyMutationSuccess(method, path, config) {
    if (!shouldShowMutationToast(method, path, config)) return;
    showSuccessToast(config && config.successMessage
      ? config.successMessage
      : getMutationSuccessMessage(method, path));
  }

  async function request(path, options) {
    const config = options || {};
    const method = config.method || "GET";
    const headers = new Headers(config.headers || {});
    if (config.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (!config.skipAuth && !headers.has("Authorization")) {
      const token = getToken();
      if (token) headers.set("Authorization", "Bearer " + token);
    }

    let response;
    try {
      response = await fetch(getBaseUrl() + path, {
        method,
        headers,
        body: config.body === undefined
          ? undefined
          : (typeof config.body === "string" ? config.body : JSON.stringify(config.body))
      });
    } catch (error) {
      const networkError = new Error("Không thể kết nối API backend.");
      networkError.code = "API_UNREACHABLE";
      networkError.cause = error;
      throw networkError;
    }

    if (response.status === 204) {
      if (response.ok) notifyMutationSuccess(method, path, config);
      return null;
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      const parseError = new Error("Backend trả về dữ liệu không hợp lệ.");
      parseError.code = "INVALID_API_RESPONSE";
      parseError.status = response.status;
      throw parseError;
    }

    if (!response.ok || !payload || payload.ok !== true) {
      const message = payload && payload.error && payload.error.message
        ? payload.error.message
        : "Yêu cầu API thất bại.";
      const apiError = new Error(message);
      apiError.code = payload && payload.error && payload.error.code
        ? payload.error.code
        : "API_ERROR";
      apiError.status = response.status;
      apiError.details = payload && payload.error ? payload.error.details : null;
      if (["AUTH_REQUIRED", "INVALID_TOKEN", "SESSION_REVOKED"].includes(apiError.code)) {
        setToken("");
        try { localStorage.removeItem("currentUser"); } catch (error) {}
      }
      throw apiError;
    }

    notifyMutationSuccess(method, path, config);
    return payload.data;
  }

  window.AppApi = {
    getBaseUrl,
    getToken,
    setToken,
    request,
    showSuccessToast,
    get: function (path) { return request(path); },
    post: function (path, body, options) { return request(path, { ...(options || {}), method: "POST", body }); },
    patch: function (path, body, options) { return request(path, { ...(options || {}), method: "PATCH", body }); },
    delete: function (path, options) { return request(path, { ...(options || {}), method: "DELETE" }); }
  };
})();
