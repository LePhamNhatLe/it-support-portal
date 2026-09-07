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

  function normalizeUserForApi(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };
  }

  function normalizePatchForApi(user) {
    return {
      name: user.name,
      department: user.department,
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
        phone: local.phone || user.phone || null,
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
          const merged = { ...result.data, ...serverUser, phone: result.data.phone || null };
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
          const merged = { ...result.data, ...serverUser, phone: result.data.phone || null };
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
          const merged = { ...result.data, ...serverUser, phone: result.data.phone || null };
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

  function init() {
    patchUserStorage();
    hydrateUsers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.UsersApiBridge = { hydrateUsers };
})();
