(function () {
  const DEFAULT_BASE_URL = "http://localhost:3000/api/v1";
  const TOKEN_KEY = "authToken";

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

  async function request(path, options) {
    const config = options || {};
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
        method: config.method || "GET",
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

    if (response.status === 204) return null;

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

    return payload.data;
  }

  window.AppApi = {
    getBaseUrl,
    getToken,
    setToken,
    request,
    get: function (path) { return request(path); },
    post: function (path, body, options) { return request(path, { ...(options || {}), method: "POST", body }); },
    patch: function (path, body, options) { return request(path, { ...(options || {}), method: "PATCH", body }); },
    delete: function (path) { return request(path, { method: "DELETE" }); }
  };
})();
