(function () {
  function setFeedback(message, isError) {
    const element = document.getElementById("user-feedback");
    if (!element) return;
    element.textContent = message || "";
    element.hidden = !message;
    element.dataset.state = isError ? "error" : "success";
  }

  function renderAll() {
    if (window.UsersPage && typeof window.UsersPage.renderAll === "function") {
      window.UsersPage.renderAll();
    }
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

  function normalizeUserForApi(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      phone: user.phone || null,
      role: user.role,
      status: user.status
    };
  }

  function normalizePatchForApi(user) {
    return {
      name: user.name,
      department: user.department,
      phone: user.phone || null,
      role: user.role,
      status: user.status
    };
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

  function restoreUsers(snapshot, message) {
    if (window.UserStorage && typeof window.UserStorage.saveUsers === "function") {
      window.UserStorage.saveUsers(snapshot);
      renderAll();
    }
    setFeedback(message || "Không thể đồng bộ thay đổi với backend.", true);
  }

  async function hydrateUsers() {
    if (!window.AppApi || !window.UserStorage) return;
    try {
      const serverUsers = await window.AppApi.get("/users");
      const localUsers = window.UserStorage.getUsers();
      window.UserStorage.saveUsers(mergeServerUsers(serverUsers, localUsers));
      renderAll();
      document.documentElement.dataset.usersDataSource = "api";
    } catch (error) {
      document.documentElement.dataset.usersDataSource = "local-cache";
      setFeedback("Backend chưa sẵn sàng. Trang người dùng đang dùng cache cục bộ.", true);
    }
  }

  function patchUserStorage() {
    if (!window.UserStorage || !window.AppApi || window.UserStorage.__apiSyncPatched) return;

    const originalCreate = window.UserStorage.createUser;
    const originalUpdate = window.UserStorage.updateUser;
    const originalChangeStatus = window.UserStorage.changeUserStatus;
    const originalDelete = window.UserStorage.deleteUser;

    window.UserStorage.createUser = function (user) {
      const before = window.UserStorage.getUsers().slice();
      const result = originalCreate(user);
      if (!result.ok) return result;

      window.AppApi.post("/users", normalizeUserForApi(result.data))
        .then(function (serverUser) {
          const merged = { ...result.data, ...serverUser };
          const users = window.UserStorage.getUsers().map(function (item) {
            return item.id === merged.id ? merged : item;
          });
          window.UserStorage.saveUsers(users);
          renderAll();
          setFeedback("Đã thêm người dùng và đồng bộ MySQL.", false);
        })
        .catch(function (error) {
          restoreUsers(before, error.message || "Không thể thêm người dùng vào backend.");
        });

      return { ...result, message: "Đã thêm người dùng. Đang đồng bộ backend..." };
    };

    window.UserStorage.updateUser = function (id, changes) {
      const before = window.UserStorage.getUsers().slice();
      const result = originalUpdate(id, changes);
      if (!result.ok) return result;

      window.AppApi.patch("/users/" + encodeURIComponent(id), normalizePatchForApi(result.data))
        .then(function (serverUser) {
          const merged = { ...result.data, ...serverUser };
          const users = window.UserStorage.getUsers().map(function (item) {
            return item.id === id ? merged : item;
          });
          window.UserStorage.saveUsers(users);
          renderAll();
          setFeedback("Đã cập nhật người dùng và đồng bộ MySQL.", false);
        })
        .catch(function (error) {
          restoreUsers(before, error.message || "Không thể cập nhật người dùng trên backend.");
        });

      return { ...result, message: "Đã cập nhật người dùng. Đang đồng bộ backend..." };
    };

    window.UserStorage.changeUserStatus = function (id, status) {
      const before = window.UserStorage.getUsers().slice();
      const result = originalChangeStatus(id, status);
      if (!result.ok) return result;

      window.AppApi.patch("/users/" + encodeURIComponent(id), { status: result.data.status })
        .then(function (serverUser) {
          const merged = { ...result.data, ...serverUser };
          const users = window.UserStorage.getUsers().map(function (item) {
            return item.id === id ? merged : item;
          });
          window.UserStorage.saveUsers(users);
          renderAll();
          setFeedback("Đã cập nhật trạng thái và đồng bộ MySQL.", false);
        })
        .catch(function (error) {
          restoreUsers(before, error.message || "Không thể cập nhật trạng thái trên backend.");
        });

      return { ...result, message: "Đang đồng bộ trạng thái với backend..." };
    };

    window.UserStorage.deleteUser = function (id) {
      const before = window.UserStorage.getUsers().slice();
      const result = originalDelete(id);
      if (!result.ok) return result;

      window.AppApi.delete("/users/" + encodeURIComponent(id))
        .then(function () {
          setFeedback("Đã xóa người dùng khỏi MySQL.", false);
        })
        .catch(function (error) {
          restoreUsers(before, error.message || "Không thể xóa người dùng trên backend.");
        });

      return { ...result, message: "Đã xóa người dùng. Đang đồng bộ backend..." };
    };

    window.UserStorage.__apiSyncPatched = true;
  }

  function setFormBusy(form, busy) {
    if (!form) return;
    form.dataset.syncPending = busy ? "true" : "false";
    form.querySelectorAll("button, input, select, textarea").forEach(function (element) {
      if (element.type === "hidden") return;
      element.disabled = Boolean(busy);
    });
  }

  function saveServerUser(serverUser, fallback) {
    const merged = { ...(fallback || {}), ...(serverUser || {}) };
    const users = window.UserStorage.getUsers();
    const index = users.findIndex(function (item) { return item && item.id === merged.id; });
    const next = users.slice();
    if (index >= 0) next[index] = merged;
    else next.push(merged);
    return window.UserStorage.saveUsers(next);
  }

  async function persistCreateUser(payload) {
    if (!window.UserStorage.canManageUsers()) {
      return { ok: false, message: "Tài khoản hiện tại không có quyền thêm người dùng." };
    }
    const validation = window.UserStorage.validateUser(payload, true);
    if (!validation.ok) return validation;
    if (window.UserStorage.getUserById(payload.id)) {
      return { ok: false, message: "Mã người dùng đã tồn tại." };
    }
    if (window.UserStorage.getUserByEmail(payload.email)) {
      return { ok: false, message: "Email đã tồn tại." };
    }

    const serverUser = await window.AppApi.post("/users", normalizeUserForApi(payload));
    if (!saveServerUser(serverUser, payload)) {
      return { ok: false, message: "Backend đã lưu nhưng không thể cập nhật cache trình duyệt." };
    }
    return { ok: true, data: serverUser, message: "Đã thêm người dùng và lưu vào MySQL." };
  }

  async function persistUpdateUser(id, changes) {
    if (!window.UserStorage.canManageUsers()) {
      return { ok: false, message: "Tài khoản hiện tại không có quyền chỉnh sửa người dùng." };
    }
    const current = window.UserStorage.getUserById(id);
    if (!current) return { ok: false, message: "Không tìm thấy người dùng." };

    const candidate = {
      ...current,
      ...changes,
      id: current.id,
      email: current.email,
      createdAt: current.createdAt
    };
    const validation = window.UserStorage.validateUser(candidate, false);
    if (!validation.ok) return validation;

    const serverUser = await window.AppApi.patch("/users/" + encodeURIComponent(id), normalizePatchForApi(candidate));
    if (!saveServerUser(serverUser, candidate)) {
      return { ok: false, message: "Backend đã lưu nhưng không thể cập nhật cache trình duyệt." };
    }
    return { ok: true, data: serverUser, message: "Đã cập nhật người dùng và lưu vào MySQL." };
  }

  async function handleFormSubmit(event) {
    const form = event.target.closest("#user-form");
    if (!form || !window.UserStorage || !window.AppApi) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (form.dataset.syncPending === "true") return;

    const payload = {
      id: normalizeText(form.elements.id && form.elements.id.value),
      name: normalizeText(form.elements.name && form.elements.name.value),
      email: normalizeEmail(form.elements.email && form.elements.email.value),
      department: form.elements.department ? form.elements.department.value : "Khác",
      role: form.elements.role ? form.elements.role.value : "user",
      phone: normalizeText(form.elements.phone && form.elements.phone.value),
      status: form.elements.status ? form.elements.status.value : "active"
    };

    setFormBusy(form, true);
    setFeedback("Đang lưu vào backend...", false);

    try {
      const result = form.dataset.mode === "edit"
        ? await persistUpdateUser(form.dataset.userId, payload)
        : await persistCreateUser(payload);

      if (!result.ok) {
        setFeedback(result.message, true);
        return;
      }

      closeEditor();
      renderAll();
      setFeedback(result.message, false);
    } catch (error) {
      setFeedback(error.message || "Không thể lưu người dùng vào backend.", true);
    } finally {
      setFormBusy(form, false);
    }
  }

  function handleStatusAction(event) {
    const button = event.target.closest('button[data-action="lock-user"][data-user-id], button[data-action="unlock-user"][data-user-id]');
    if (!button || !window.UserStorage) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const status = button.dataset.action === "lock-user" ? "locked" : "active";
    const result = window.UserStorage.changeUserStatus(button.dataset.userId, status);
    renderAll();
    setFeedback(result.message, !result.ok);
  }

  function init() {
    patchUserStorage();
    document.addEventListener("submit", handleFormSubmit, true);
    document.addEventListener("click", handleStatusAction, true);
    hydrateUsers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.UsersApiBridge = { hydrateUsers, persistCreateUser, persistUpdateUser };
})();
