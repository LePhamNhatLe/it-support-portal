(function () {
  let mutationGeneration = 0;
  let pendingMutations = 0;

  function setFeedback(message, isError) {
    const element = document.getElementById("user-feedback");
    if (!element) return;
    if (!isError) {
      element.textContent = "";
      element.hidden = true;
      delete element.dataset.state;
      return;
    }
    element.textContent = message || "";
    element.hidden = !message;
    element.dataset.state = "error";
    if (message) {
      element.setAttribute("tabindex", "-1");
      element.focus({ preventScroll: true });
    }
  }

  function clearFeedback() {
    setFeedback("", false);
  }

  function renderAll() {
    if (window.UsersPage && typeof window.UsersPage.renderAll === "function") window.UsersPage.renderAll();
  }

  function closeEditor() {
    const panel = document.getElementById("user-editor-panel");
    if (panel) panel.hidden = true;
  }

  function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
  }

  function getCurrentUser() {
    return typeof window.getCurrentUser === "function" ? window.getCurrentUser() : null;
  }

  function isCurrentUser(user) {
    const actor = getCurrentUser();
    return Boolean(actor && user && normalizeEmail(actor.email) === normalizeEmail(user.email));
  }

  function beginMutation() {
    mutationGeneration += 1;
    pendingMutations += 1;
  }

  function endMutation() {
    pendingMutations = Math.max(0, pendingMutations - 1);
    mutationGeneration += 1;
  }

  function normalizeUserForApi(user, password) {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      phone: user.phone || null,
      role: user.role,
      status: user.status
    };
    if (password) payload.password = password;
    return payload;
  }

  function normalizePatchForApi(user, password) {
    const payload = {
      name: user.name,
      department: user.department,
      phone: user.phone || null,
      role: user.role,
      status: user.status
    };
    if (password) payload.password = password;
    return payload;
  }

  function mergeServerUsers(serverUsers, localUsers) {
    const localById = new Map((Array.isArray(localUsers) ? localUsers : []).map(function (user) {
      return [user.id, user];
    }));
    return (Array.isArray(serverUsers) ? serverUsers : []).map(function (user) {
      const local = localById.get(user.id) || {};
      return {
        ...local,
        ...user,
        phone: user.phone ?? local.phone ?? null,
        updatedAt: user.updatedAt || local.updatedAt || user.createdAt || null
      };
    });
  }

  function saveServerUser(serverUser, fallback) {
    const safeFallback = { ...(fallback || {}) };
    delete safeFallback.password;
    const merged = { ...safeFallback, ...(serverUser || {}) };
    delete merged.password;
    const users = window.UserStorage.getUsers();
    const index = users.findIndex(function (item) { return item && item.id === merged.id; });
    const next = users.slice();
    if (index >= 0) next[index] = merged;
    else next.push(merged);
    return window.UserStorage.saveUsers(next);
  }

  function removeCachedUser(id) {
    const users = window.UserStorage.getUsers();
    return window.UserStorage.saveUsers(users.filter(function (item) {
      return item && item.id !== id;
    }));
  }

  async function hydrateUsers() {
    if (!window.AppApi || !window.UserStorage) return;
    const generationAtStart = mutationGeneration;
    try {
      const serverUsers = await window.AppApi.get("/users");
      if (pendingMutations > 0 || generationAtStart !== mutationGeneration) return;
      const localUsers = window.UserStorage.getUsers();
      window.UserStorage.saveUsers(mergeServerUsers(serverUsers, localUsers));
      renderAll();
      clearFeedback();
      document.documentElement.dataset.usersDataSource = "api";
    } catch (error) {
      document.documentElement.dataset.usersDataSource = "local-cache";
      setFeedback(error.status === 401 || error.status === 403
        ? "Phiên đăng nhập không có quyền truy cập danh sách người dùng."
        : "Không thể tải danh sách người dùng từ máy chủ.", true);
    }
  }

  function setFormBusy(form, busy) {
    if (!form) return;
    form.dataset.syncPending = busy ? "true" : "false";
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      if (!submitButton.dataset.idleText) submitButton.dataset.idleText = submitButton.textContent;
      submitButton.textContent = busy ? "Đang lưu..." : submitButton.dataset.idleText;
    }
    form.querySelectorAll("button, input, select, textarea").forEach(function (element) {
      if (element.type === "hidden") return;
      element.disabled = Boolean(busy);
    });
  }

  function syncPasswordRequirement() {
    const form = document.getElementById("user-form");
    if (!form || !form.elements.password) return;
    const isCreate = form.dataset.mode !== "edit";
    form.elements.password.required = isCreate;
    form.elements.password.setAttribute("aria-required", isCreate ? "true" : "false");
  }

  async function persistCreateUser(payload) {
    if (!window.UserStorage.canManageUsers()) return { ok: false, message: "Tài khoản hiện tại không có quyền thêm người dùng." };
    const password = String(payload.password || "");
    if (password.length < 6 || password.length > 72) return { ok: false, message: "Mật khẩu phải từ 6 đến 72 ký tự." };
    const safeUser = { ...payload };
    delete safeUser.password;
    const validation = window.UserStorage.validateUser(safeUser, true);
    if (!validation.ok) return validation;
    if (window.UserStorage.getUserById(payload.id)) return { ok: false, message: "Mã người dùng đã tồn tại." };
    if (window.UserStorage.getUserByEmail(payload.email)) return { ok: false, message: "Email đã tồn tại." };

    beginMutation();
    try {
      const serverUser = await window.AppApi.post("/users", normalizeUserForApi(safeUser, password));
      if (!saveServerUser(serverUser, safeUser)) return { ok: false, message: "Đã lưu dữ liệu nhưng không thể cập nhật cache trình duyệt." };
      return { ok: true, data: serverUser, message: "Đã thêm người dùng thành công." };
    } finally {
      endMutation();
    }
  }

  async function persistUpdateUser(id, changes) {
    if (!window.UserStorage.canManageUsers()) return { ok: false, message: "Tài khoản hiện tại không có quyền chỉnh sửa người dùng." };
    const current = window.UserStorage.getUserById(id);
    if (!current) return { ok: false, message: "Không tìm thấy người dùng." };
    const password = String(changes.password || "");
    if (password && (password.length < 6 || password.length > 72)) return { ok: false, message: "Mật khẩu phải từ 6 đến 72 ký tự." };
    const safeChanges = { ...changes };
    delete safeChanges.password;

    if (isCurrentUser(current)) {
      if (safeChanges.role && safeChanges.role !== current.role) {
        return { ok: false, message: "Không thể tự thay đổi vai trò của tài khoản đang đăng nhập." };
      }
      if (safeChanges.status && safeChanges.status !== "active") {
        return { ok: false, message: "Không thể tự khóa hoặc vô hiệu tài khoản đang đăng nhập." };
      }
    }

    const candidate = { ...current, ...safeChanges, id: current.id, email: current.email, createdAt: current.createdAt };
    const validation = window.UserStorage.validateUser(candidate, false);
    if (!validation.ok) return validation;

    beginMutation();
    try {
      const serverUser = await window.AppApi.patch("/users/" + encodeURIComponent(id), normalizePatchForApi(candidate, password));
      if (!saveServerUser(serverUser, candidate)) return { ok: false, message: "Đã lưu dữ liệu nhưng không thể cập nhật cache trình duyệt." };
      return { ok: true, data: serverUser, message: password ? "Đã cập nhật người dùng và đổi mật khẩu." : "Đã cập nhật người dùng thành công." };
    } finally {
      endMutation();
    }
  }

  async function persistChangeUserStatus(id, status) {
    if (!window.UserStorage.canManageUsers()) return { ok: false, message: "Tài khoản hiện tại không có quyền thay đổi trạng thái người dùng." };
    const current = window.UserStorage.getUserById(id);
    if (!current) return { ok: false, message: "Không tìm thấy người dùng." };
    if (isCurrentUser(current) && status !== "active") {
      return { ok: false, message: "Không thể tự khóa hoặc vô hiệu tài khoản đang đăng nhập." };
    }

    beginMutation();
    try {
      const serverUser = await window.AppApi.patch("/users/" + encodeURIComponent(id), { status });
      if (!saveServerUser(serverUser, { ...current, status })) return { ok: false, message: "Đã lưu dữ liệu nhưng không thể cập nhật cache trình duyệt." };
      return { ok: true, data: serverUser, message: status === "active" ? "Đã mở khóa người dùng." : "Đã khóa người dùng." };
    } finally {
      endMutation();
    }
  }

  async function persistDeleteUser(id) {
    if (!window.UserStorage.canManageUsers()) return { ok: false, message: "Tài khoản hiện tại không có quyền xóa người dùng." };
    const current = window.UserStorage.getUserById(id);
    if (!current) return { ok: false, message: "Không tìm thấy người dùng." };
    if (isCurrentUser(current)) return { ok: false, message: "Không thể xóa chính tài khoản đang đăng nhập." };

    beginMutation();
    try {
      await window.AppApi.delete("/users/" + encodeURIComponent(id));
      if (!removeCachedUser(id)) return { ok: false, message: "Đã xóa dữ liệu nhưng không thể cập nhật cache trình duyệt." };
      return { ok: true, data: current, message: "Đã xóa người dùng thành công." };
    } finally {
      endMutation();
    }
  }

  async function handleFormSubmit(event) {
    const form = event.target.closest("#user-form");
    if (!form || !window.UserStorage || !window.AppApi) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (form.dataset.syncPending === "true") return;

    syncPasswordRequirement();
    if (!form.reportValidity()) return;

    const payload = {
      id: normalizeText(form.elements.id && form.elements.id.value),
      name: normalizeText(form.elements.name && form.elements.name.value),
      email: normalizeEmail(form.elements.email && form.elements.email.value),
      password: form.elements.password ? String(form.elements.password.value || "") : "",
      department: form.elements.department ? form.elements.department.value : "Khác",
      role: form.elements.role ? form.elements.role.value : "user",
      phone: normalizeText(form.elements.phone && form.elements.phone.value),
      status: form.elements.status ? form.elements.status.value : "active"
    };

    setFormBusy(form, true);
    clearFeedback();
    try {
      const result = form.dataset.mode === "edit"
        ? await persistUpdateUser(form.dataset.userId, payload)
        : await persistCreateUser(payload);
      if (!result.ok) return setFeedback(result.message, true);
      if (form.elements.password) form.elements.password.value = "";
      closeEditor();
      renderAll();
      clearFeedback();
    } catch (error) {
      setFeedback(error.message || "Không thể lưu người dùng.", true);
    } finally {
      setFormBusy(form, false);
    }
  }

  async function handleStatusAction(event) {
    const button = event.target.closest('button[data-action="lock-user"][data-user-id], button[data-action="unlock-user"][data-user-id]');
    if (!button || !window.UserStorage || !window.AppApi) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.disabled) return;
    const status = button.dataset.action === "lock-user" ? "locked" : "active";
    button.disabled = true;
    clearFeedback();
    try {
      const result = await persistChangeUserStatus(button.dataset.userId, status);
      if (!result.ok) return setFeedback(result.message, true);
      renderAll();
    } catch (error) {
      setFeedback(error.message || "Không thể cập nhật trạng thái người dùng.", true);
    } finally {
      button.disabled = false;
    }
  }

  function observeFormMode() {
    const form = document.getElementById("user-form");
    if (!form) return;
    syncPasswordRequirement();
    const observer = new MutationObserver(syncPasswordRequirement);
    observer.observe(form, { attributes: true, attributeFilter: ["data-mode"] });
  }

  function init() {
    observeFormMode();
    document.addEventListener("submit", handleFormSubmit, true);
    document.addEventListener("click", handleStatusAction, true);
    hydrateUsers();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.UsersApiBridge = {
    hydrateUsers,
    persistCreateUser,
    persistUpdateUser,
    persistChangeUserStatus,
    persistDeleteUser
  };
})();
