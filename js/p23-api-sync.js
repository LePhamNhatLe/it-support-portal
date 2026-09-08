(function () {
  if (!window.AppApi) return;

  function feedback(id, message, isError) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
    el.dataset.state = isError ? "error" : "success";
  }

  function notify(message, type) {
    if (window.AppUI && typeof window.AppUI.notify === "function") {
      window.AppUI.notify(message, type || "info");
    }
  }

  function replaceById(list, item) {
    return list.map(function (entry) { return entry && entry.id === item.id ? { ...entry, ...item } : entry; });
  }

  function snapshotLocalStorage() {
    const snapshot = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key != null) snapshot[key] = localStorage.getItem(key);
    }
    return snapshot;
  }

  function restoreLocalStorage(snapshot) {
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key != null) keys.push(key);
    }
    keys.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(snapshot, key)) localStorage.removeItem(key);
    });
    Object.keys(snapshot).forEach(function (key) {
      localStorage.setItem(key, snapshot[key]);
    });
  }

  function probeMutation(run) {
    const snapshot = snapshotLocalStorage();
    try {
      return run();
    } finally {
      restoreLocalStorage(snapshot);
    }
  }

  function setFormBusy(form, busy) {
    if (!form) return;
    form.dataset.syncBusy = busy ? "true" : "false";
    form.querySelectorAll("button, input, select, textarea").forEach(function (control) {
      control.disabled = Boolean(busy);
    });
  }

  function patchDevices() {
    const store = window.DeviceStorage;
    if (!store) return false;
    if (store.__apiSyncPatched) return true;
    const originalCreate = store.createDevice;
    const originalUpdate = store.updateDevice;
    const originalDelete = store.deleteDevice;

    function payload(device) {
      return {
        id: device.id, name: device.name, type: device.type, status: device.status,
        userEmail: device.userEmail || null, department: device.department || null,
        ipAddress: device.ipAddress || null, serialNumber: device.serialNumber || null,
        purchaseDate: device.purchaseDate || null, notes: device.notes || null
      };
    }

    store.createDevice = function (device) {
      const result = probeMutation(function () { return originalCreate(device); });
      if (!result.ok) return result;
      const syncPromise = window.AppApi.post("/devices", payload(result.data)).then(function (serverItem) {
        const committed = originalCreate({ ...result.data, ...serverItem });
        if (!committed.ok && committed.reason !== "duplicate_id") throw new Error(committed.message);
        if (committed.reason === "duplicate_id") store.saveDevices(replaceById(store.getDevices(), { ...result.data, ...serverItem }));
        window.DevicesPage?.renderAll?.();
        feedback("device-feedback", "Đã thêm thiết bị và lưu vào MySQL.", false);
        return serverItem;
      }).catch(function (error) {
        feedback("device-feedback", error.message || "Không thể thêm thiết bị vào backend.", true);
        throw error;
      });
      return { ...result, message: "Đang lưu thiết bị vào backend...", syncPromise };
    };

    store.updateDevice = function (id, changes) {
      const result = probeMutation(function () { return originalUpdate(id, changes); });
      if (!result.ok) return result;
      const data = payload(result.data); delete data.id;
      const syncPromise = window.AppApi.patch("/devices/" + encodeURIComponent(id), data).then(function (serverItem) {
        const committed = originalUpdate(id, { ...result.data, ...serverItem });
        if (!committed.ok) throw new Error(committed.message);
        window.DevicesPage?.renderAll?.();
        feedback("device-feedback", "Đã cập nhật thiết bị và lưu vào MySQL.", false);
        return serverItem;
      }).catch(function (error) {
        feedback("device-feedback", error.message || "Không thể cập nhật thiết bị trên backend.", true);
        throw error;
      });
      return { ...result, message: "Đang cập nhật thiết bị trên backend...", syncPromise };
    };

    store.deleteDevice = function (id) {
      const result = probeMutation(function () { return originalDelete(id); });
      if (!result.ok) return result;
      const syncPromise = window.AppApi.delete("/devices/" + encodeURIComponent(id)).then(function () {
        const committed = originalDelete(id);
        if (!committed.ok && committed.reason !== "not_found") throw new Error(committed.message);
        window.DevicesPage?.renderAll?.();
        feedback("device-feedback", "Đã xóa thiết bị khỏi MySQL.", false);
        return true;
      }).catch(function (error) {
        feedback("device-feedback", error.message || "Không thể xóa thiết bị trên backend.", true);
        throw error;
      });
      return { ...result, message: "Đang xóa thiết bị trên backend...", syncPromise };
    };

    store.__apiSyncPatched = true;
    window.AppApi.get("/devices").then(function (items) {
      store.saveDevices(Array.isArray(items) ? items : []);
      window.DevicesPage?.renderAll?.();
      document.documentElement.dataset.devicesDataSource = "api";
    }).catch(function () { document.documentElement.dataset.devicesDataSource = "local-cache"; });

    document.addEventListener("submit", async function (event) {
      const form = event.target.closest("#device-form");
      if (!form || form.dataset.syncBusy === "true") return;
      event.preventDefault(); event.stopImmediatePropagation();
      const data = {
        id: form.elements.id.value.trim(), name: form.elements.name.value.trim(), type: form.elements.type.value,
        status: form.elements.status.value, userEmail: form.elements.userEmail.value.trim(), department: form.elements.department.value,
        ipAddress: form.elements.ipAddress.value.trim(), serialNumber: form.elements.serialNumber.value.trim(),
        purchaseDate: form.elements.purchaseDate.value, notes: form.elements.notes.value.trim()
      };
      const result = form.dataset.mode === "edit" ? store.updateDevice(form.dataset.deviceId, data) : store.createDevice(data);
      if (!result.ok) return feedback("device-feedback", result.message, true);
      setFormBusy(form, true);
      feedback("device-feedback", result.message, false);
      try {
        await result.syncPromise;
        document.getElementById("device-editor-panel").hidden = true;
        window.DevicesPage?.renderAll?.();
      } catch (error) {
        // Feedback is already shown by the persistence layer.
      } finally {
        setFormBusy(form, false);
      }
    }, true);
    return true;
  }

  function patchNetwork() {
    const store = window.NetworkStorage;
    if (!store) return false;
    if (store.__apiSyncPatched) return true;
    const originalCreate = store.createNetworkDevice;
    const originalUpdate = store.updateNetworkDevice;
    const originalDelete = store.deleteNetworkDevice;

    function payload(item) {
      return {
        id: item.id, name: item.name, type: item.type, status: item.status,
        ipAddress: item.ipAddress, macAddress: item.macAddress || null, area: item.area || null,
        vlan: item.vlan, subnet: item.subnet || null, gateway: item.gateway || null,
        managementUrl: item.managementUrl || null, uptimeHours: item.uptimeHours, notes: item.notes || null
      };
    }

    store.createNetworkDevice = function (item) {
      const result = probeMutation(function () { return originalCreate(item); });
      if (!result.ok) return result;
      const syncPromise = window.AppApi.post("/network", payload(result.data)).then(function (serverItem) {
        const committed = originalCreate({ ...result.data, ...serverItem });
        if (!committed.ok && committed.reason !== "duplicate_id") throw new Error(committed.message);
        if (committed.reason === "duplicate_id") store.saveNetworkDevices(replaceById(store.getNetworkDevices(), { ...result.data, ...serverItem }));
        window.NetworkPage?.renderAll?.();
        feedback("network-feedback", "Đã thêm thiết bị mạng và lưu vào MySQL.", false);
        return serverItem;
      }).catch(function (error) {
        feedback("network-feedback", error.message || "Không thể thêm thiết bị mạng vào backend.", true);
        throw error;
      });
      return { ...result, message: "Đang lưu thiết bị mạng vào backend...", syncPromise };
    };

    store.updateNetworkDevice = function (id, changes) {
      const result = probeMutation(function () { return originalUpdate(id, changes); });
      if (!result.ok) return result;
      const data = payload(result.data); delete data.id;
      const syncPromise = window.AppApi.patch("/network/" + encodeURIComponent(id), data).then(function (serverItem) {
        const committed = originalUpdate(id, { ...result.data, ...serverItem });
        if (!committed.ok) throw new Error(committed.message);
        window.NetworkPage?.renderAll?.();
        feedback("network-feedback", "Đã cập nhật thiết bị mạng và lưu vào MySQL.", false);
        return serverItem;
      }).catch(function (error) {
        feedback("network-feedback", error.message || "Không thể cập nhật thiết bị mạng trên backend.", true);
        throw error;
      });
      return { ...result, message: "Đang cập nhật thiết bị mạng trên backend...", syncPromise };
    };

    store.deleteNetworkDevice = function (id) {
      const result = probeMutation(function () { return originalDelete(id); });
      if (!result.ok) return result;
      const syncPromise = window.AppApi.delete("/network/" + encodeURIComponent(id)).then(function () {
        const committed = originalDelete(id);
        if (!committed.ok && committed.reason !== "not_found") throw new Error(committed.message);
        window.NetworkPage?.renderAll?.();
        feedback("network-feedback", "Đã xóa thiết bị mạng khỏi MySQL.", false);
        return true;
      }).catch(function (error) {
        feedback("network-feedback", error.message || "Không thể xóa thiết bị mạng trên backend.", true);
        throw error;
      });
      return { ...result, message: "Đang xóa thiết bị mạng trên backend...", syncPromise };
    };

    store.__apiSyncPatched = true;
    window.AppApi.get("/network").then(function (items) {
      store.saveNetworkDevices(Array.isArray(items) ? items : []); window.NetworkPage?.renderAll?.();
      document.documentElement.dataset.networkDataSource = "api";
    }).catch(function () { document.documentElement.dataset.networkDataSource = "local-cache"; });

    document.addEventListener("submit", async function (event) {
      const form = event.target.closest("#network-form"); if (!form || form.dataset.syncBusy === "true") return;
      event.preventDefault(); event.stopImmediatePropagation();
      const data = {
        id: form.elements.id.value.trim(), name: form.elements.name.value.trim(), type: form.elements.type.value,
        ipAddress: form.elements.ipAddress.value.trim(), macAddress: form.elements.macAddress.value.trim(), area: form.elements.area.value,
        status: form.elements.status.value, vlan: Number(form.elements.vlan.value), subnet: form.elements.subnet.value.trim(),
        gateway: form.elements.gateway.value.trim(), managementUrl: form.elements.managementUrl.value.trim(),
        uptimeHours: Number(form.elements.uptimeHours.value), notes: form.elements.notes.value.trim()
      };
      const result = form.dataset.mode === "edit" ? store.updateNetworkDevice(form.dataset.networkId, data) : store.createNetworkDevice(data);
      if (!result.ok) return feedback("network-feedback", result.message, true);
      setFormBusy(form, true);
      feedback("network-feedback", result.message, false);
      try {
        await result.syncPromise;
        document.getElementById("network-editor-panel").hidden = true;
        window.NetworkPage?.renderAll?.();
      } catch (error) {
        // Feedback is already shown by the persistence layer.
      } finally {
        setFormBusy(form, false);
      }
    }, true);
    return true;
  }

  function patchTickets() {
    const store = window.TicketStorage;
    if (!store) return false;
    if (store.__apiSyncPatched) return true;
    const originalCreate = store.createTicket;
    const originalUpdate = store.updateTicket;
    const originalStatus = store.updateTicketStatus;
    const originalAssign = store.assignTicket;

    function createPayload(ticket) {
      return {
        id: ticket.id, title: ticket.title, description: ticket.description, category: ticket.category,
        priority: ticket.priority, status: ticket.status, requesterEmail: ticket.requesterEmail || null,
        assigneeEmail: ticket.assigneeEmail || null, deviceId: ticket.deviceId || null,
        resolvedAt: ticket.resolvedAt || null
      };
    }
    function patchPayload(ticket) {
      return {
        title: ticket.title, description: ticket.description, category: ticket.category, priority: ticket.priority,
        status: ticket.status, requesterEmail: ticket.requesterEmail || null, assigneeEmail: ticket.assigneeEmail || null,
        deviceId: ticket.deviceId || null, resolvedAt: ticket.resolvedAt || null
      };
    }
    function rerenderTickets() {
      window.TicketsPage?.renderTicketList?.();
      window.TicketDetailPage?.render?.();
    }

    store.createTicket = function (ticket) {
      let candidate = null;
      const ok = probeMutation(function () {
        const created = originalCreate(ticket);
        candidate = created ? store.getTicketById(ticket.id) : null;
        return created;
      });
      if (!ok || !candidate) return false;
      store.__lastSyncPromise = window.AppApi.post("/tickets", createPayload(candidate)).then(function (serverItem) {
        const committed = originalCreate({ ...candidate, ...serverItem });
        if (!committed && !store.getTicketById(candidate.id)) throw new Error("Không thể lưu phiếu vào cache sau khi backend xác nhận.");
        if (store.getTicketById(candidate.id)) store.saveTickets(replaceById(store.getTickets(), { ...candidate, ...serverItem }));
        rerenderTickets(); feedback("ticket-feedback", "Đã tạo phiếu và lưu vào MySQL.", false);
        return serverItem;
      }).catch(function (error) {
        feedback("ticket-feedback", error.message || "Không thể tạo phiếu trên backend.", true);
        notify(error.message || "Không thể tạo phiếu trên backend.", "error");
        throw error;
      });
      return true;
    };

    store.updateTicket = function (id, changes) {
      const result = probeMutation(function () { return originalUpdate(id, changes); });
      if (!result) return null;
      const syncPromise = window.AppApi.patch("/tickets/" + encodeURIComponent(id), patchPayload(result)).then(function (serverItem) {
        const committed = originalUpdate(id, { ...result, ...serverItem });
        if (!committed) throw new Error("Không thể áp dụng thay đổi phiếu sau khi backend xác nhận.");
        rerenderTickets();
        return serverItem;
      }).catch(function (error) {
        feedback("ticket-feedback", error.message || "Không thể cập nhật phiếu trên backend.", true);
        notify(error.message || "Không thể cập nhật phiếu trên backend.", "error");
        throw error;
      });
      return { ...result, syncPromise };
    };

    store.updateTicketStatus = function (id, status) {
      const result = probeMutation(function () { return originalStatus(id, status); });
      if (!result) return null;
      const syncPromise = window.AppApi.patch("/tickets/" + encodeURIComponent(id), { status: result.status, resolvedAt: result.resolvedAt || null }).then(function (serverItem) {
        const committed = originalStatus(id, status);
        if (!committed) throw new Error("Không thể áp dụng trạng thái phiếu sau khi backend xác nhận.");
        store.saveTickets(replaceById(store.getTickets(), { ...committed, ...serverItem }));
        rerenderTickets();
        return serverItem;
      }).catch(function (error) {
        feedback("ticket-feedback", error.message || "Không thể đồng bộ trạng thái phiếu.", true);
        notify(error.message || "Không thể đồng bộ trạng thái phiếu.", "error");
        throw error;
      });
      return { ...result, syncPromise };
    };

    store.assignTicket = function (id, email) {
      const result = probeMutation(function () { return originalAssign(id, email); });
      if (!result) return null;
      const syncPromise = window.AppApi.patch("/tickets/" + encodeURIComponent(id), { assigneeEmail: result.assigneeEmail, status: result.status }).then(function (serverItem) {
        const committed = originalAssign(id, email);
        if (!committed) throw new Error("Không thể áp dụng phân công sau khi backend xác nhận.");
        store.saveTickets(replaceById(store.getTickets(), { ...committed, ...serverItem }));
        rerenderTickets();
        return serverItem;
      }).catch(function (error) {
        feedback("ticket-feedback", error.message || "Không thể đồng bộ phân công phiếu.", true);
        notify(error.message || "Không thể đồng bộ phân công phiếu.", "error");
        throw error;
      });
      return { ...result, syncPromise };
    };

    store.__apiSyncPatched = true;
    window.AppApi.get("/tickets").then(function (items) {
      store.saveTickets(Array.isArray(items) ? items : []);
      rerenderTickets();
      document.documentElement.dataset.ticketsDataSource = "api";
    }).catch(function () { document.documentElement.dataset.ticketsDataSource = "local-cache"; });

    document.addEventListener("submit", async function (event) {
      const form = event.target.closest("#create-ticket-form");
      if (!form || form.dataset.syncBusy === "true" || !window.TicketsPage || typeof window.getCurrentUser !== "function") return;
      event.preventDefault(); event.stopImmediatePropagation();
      const currentUser = window.getCurrentUser();
      const nextId = window.TicketsPage.generateNextTicketId?.();
      const title = (form.elements.title?.value || "").trim();
      const description = (form.elements.description?.value || "").trim();
      const category = (form.elements.category?.value || "").trim();
      const priority = (form.elements.priority?.value || "").trim();
      const deviceId = (form.elements.deviceId?.value || "").trim() || null;
      if (!currentUser || !currentUser.email || !nextId || !title || !description || !category || !priority) {
        feedback("ticket-feedback", "Vui lòng nhập đầy đủ và đúng thông tin phiếu hỗ trợ.", true);
        return;
      }
      const now = new Date().toISOString();
      const ticket = {
        id: nextId, title, description, category, priority, status: "open",
        requesterEmail: currentUser.email, assigneeEmail: null, deviceId,
        createdAt: now, updatedAt: now, resolvedAt: null
      };
      const ok = store.createTicket(ticket);
      if (!ok || !store.__lastSyncPromise) {
        feedback("ticket-feedback", "Không thể chuẩn bị dữ liệu phiếu hỗ trợ.", true);
        return;
      }
      setFormBusy(form, true);
      feedback("ticket-feedback", "Đang lưu phiếu vào backend...", false);
      try {
        await store.__lastSyncPromise;
        form.reset();
        const panel = document.getElementById("create-ticket-panel");
        if (panel) panel.hidden = true;
        rerenderTickets();
      } catch (error) {
        // Feedback is already shown by the persistence layer.
      } finally {
        setFormBusy(form, false);
      }
    }, true);
    return true;
  }

  function patchSettings() {
    if (!window.AppStorage || !window.SettingsModule) return false;
    if (window.SettingsModule.__apiSyncPatched) return true;
    const originalSet = window.AppStorage.set.bind(window.AppStorage);
    let hydrating = false;
    window.AppStorage.set = function (key, value) {
      const saved = originalSet(key, value);
      if (saved && key === "systemSettings" && !hydrating) {
        window.AppApi.patch("/settings", value).then(function () {
          notify("Đã đồng bộ thiết lập hệ thống với MySQL.", "success");
        }).catch(function (error) { notify(error.message || "Không thể đồng bộ thiết lập hệ thống.", "error"); });
      }
      return saved;
    };
    window.SettingsModule.__apiSyncPatched = true;
    window.AppApi.get("/settings").then(function (settings) {
      hydrating = true; originalSet("systemSettings", settings); hydrating = false;
      window.SettingsModule.render?.(); document.documentElement.dataset.settingsDataSource = "api";
    }).catch(function () { hydrating = false; document.documentElement.dataset.settingsDataSource = "local-cache"; });
    return true;
  }

  function hydrateReports() {
    if (!window.ReportsModule || !window.AppStorage) return false;
    if (document.documentElement.dataset.reportsHydrationStarted === "true") return true;
    document.documentElement.dataset.reportsHydrationStarted = "true";
    Promise.all([
      window.AppApi.get("/tickets"), window.AppApi.get("/devices"), window.AppApi.get("/network"), window.AppApi.get("/users")
    ]).then(function (values) {
      window.AppStorage.set("tickets", values[0]);
      window.AppStorage.set("devices", values[1]);
      window.AppStorage.set("networkDevices", values[2]);
      window.AppStorage.set("users", values[3]);
      window.ReportsModule.render(); document.documentElement.dataset.reportsDataSource = "api";
    }).catch(function () { document.documentElement.dataset.reportsDataSource = "local-cache"; });
    return true;
  }

  function init() {
    return {
      devices: patchDevices(),
      network: patchNetwork(),
      tickets: patchTickets(),
      settings: patchSettings(),
      reports: hydrateReports()
    };
  }

  function initWhenReady() {
    let attempts = 0;
    const maxAttempts = 80;
    function run() {
      const state = init();
      const pageNeedsDevices = Boolean(document.getElementById("device-form"));
      const pageNeedsNetwork = Boolean(document.getElementById("network-form"));
      const pageNeedsTickets = Boolean(document.getElementById("create-ticket-form") || window.TicketDetailPage);
      const pageNeedsSettings = Boolean(document.querySelector("[data-settings-action]"));
      const pageNeedsReports = Boolean(document.getElementById("report-range"));
      const ready = (!pageNeedsDevices || state.devices) &&
        (!pageNeedsNetwork || state.network) &&
        (!pageNeedsTickets || state.tickets) &&
        (!pageNeedsSettings || state.settings) &&
        (!pageNeedsReports || state.reports);
      if (ready || attempts >= maxAttempts) {
        document.documentElement.dataset.p23BridgeReady = ready ? "true" : "partial";
        return;
      }
      attempts += 1;
      window.setTimeout(run, 50);
    }
    run();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initWhenReady, { once: true });
  else initWhenReady();
  window.addEventListener("load", initWhenReady, { once: true });

  window.P23ApiSync = { init, initWhenReady, patchDevices, patchNetwork, patchTickets, patchSettings, hydrateReports };
})();
