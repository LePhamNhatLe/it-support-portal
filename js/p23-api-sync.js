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

  function patchDevices() {
    const store = window.DeviceStorage;
    if (!store || store.__apiSyncPatched) return;
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
      const before = store.getDevices().slice();
      const result = originalCreate(device);
      if (!result.ok) return result;
      window.AppApi.post("/devices", payload(result.data)).then(function (serverItem) {
        store.saveDevices(replaceById(store.getDevices(), { ...result.data, ...serverItem }));
        window.DevicesPage?.renderAll?.();
        feedback("device-feedback", "Đã thêm thiết bị và đồng bộ MySQL.", false);
      }).catch(function (error) {
        store.saveDevices(before); window.DevicesPage?.renderAll?.();
        feedback("device-feedback", error.message || "Không thể đồng bộ thiết bị.", true);
      });
      return { ...result, message: "Đã thêm thiết bị. Đang đồng bộ backend..." };
    };

    store.updateDevice = function (id, changes) {
      const before = store.getDevices().slice();
      const result = originalUpdate(id, changes);
      if (!result.ok) return result;
      const data = payload(result.data); delete data.id;
      window.AppApi.patch("/devices/" + encodeURIComponent(id), data).then(function (serverItem) {
        store.saveDevices(replaceById(store.getDevices(), { ...result.data, ...serverItem }));
        window.DevicesPage?.renderAll?.();
        feedback("device-feedback", "Đã cập nhật thiết bị và đồng bộ MySQL.", false);
      }).catch(function (error) {
        store.saveDevices(before); window.DevicesPage?.renderAll?.();
        feedback("device-feedback", error.message || "Không thể đồng bộ thiết bị.", true);
      });
      return { ...result, message: "Đã cập nhật thiết bị. Đang đồng bộ backend..." };
    };

    store.deleteDevice = function (id) {
      const before = store.getDevices().slice();
      const result = originalDelete(id);
      if (!result.ok) return result;
      window.AppApi.delete("/devices/" + encodeURIComponent(id)).catch(function (error) {
        store.saveDevices(before); window.DevicesPage?.renderAll?.();
        feedback("device-feedback", error.message || "Không thể xóa thiết bị trên backend.", true);
      });
      return { ...result, message: "Đã xóa thiết bị. Đang đồng bộ backend..." };
    };

    store.__apiSyncPatched = true;
    window.AppApi.get("/devices").then(function (items) {
      store.saveDevices(Array.isArray(items) ? items : []);
      window.DevicesPage?.renderAll?.();
      document.documentElement.dataset.devicesDataSource = "api";
    }).catch(function () { document.documentElement.dataset.devicesDataSource = "local-cache"; });

    document.addEventListener("submit", function (event) {
      const form = event.target.closest("#device-form");
      if (!form) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const data = {
        id: form.elements.id.value.trim(), name: form.elements.name.value.trim(), type: form.elements.type.value,
        status: form.elements.status.value, userEmail: form.elements.userEmail.value.trim(), department: form.elements.department.value,
        ipAddress: form.elements.ipAddress.value.trim(), serialNumber: form.elements.serialNumber.value.trim(),
        purchaseDate: form.elements.purchaseDate.value, notes: form.elements.notes.value.trim()
      };
      const result = form.dataset.mode === "edit" ? store.updateDevice(form.dataset.deviceId, data) : store.createDevice(data);
      if (!result.ok) return feedback("device-feedback", result.message, true);
      document.getElementById("device-editor-panel").hidden = true;
      window.DevicesPage?.renderAll?.(); feedback("device-feedback", result.message, false);
    }, true);
  }

  function patchNetwork() {
    const store = window.NetworkStorage;
    if (!store || store.__apiSyncPatched) return;
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
      const before = store.getNetworkDevices().slice();
      const result = originalCreate(item); if (!result.ok) return result;
      window.AppApi.post("/network", payload(result.data)).then(function (serverItem) {
        store.saveNetworkDevices(replaceById(store.getNetworkDevices(), { ...result.data, ...serverItem }));
        window.NetworkPage?.renderAll?.(); feedback("network-feedback", "Đã thêm thiết bị mạng và đồng bộ MySQL.", false);
      }).catch(function (error) {
        store.saveNetworkDevices(before); window.NetworkPage?.renderAll?.(); feedback("network-feedback", error.message || "Không thể đồng bộ thiết bị mạng.", true);
      });
      return { ...result, message: "Đã thêm thiết bị mạng. Đang đồng bộ backend..." };
    };

    store.updateNetworkDevice = function (id, changes) {
      const before = store.getNetworkDevices().slice();
      const result = originalUpdate(id, changes); if (!result.ok) return result;
      const data = payload(result.data); delete data.id;
      window.AppApi.patch("/network/" + encodeURIComponent(id), data).then(function (serverItem) {
        store.saveNetworkDevices(replaceById(store.getNetworkDevices(), { ...result.data, ...serverItem }));
        window.NetworkPage?.renderAll?.(); feedback("network-feedback", "Đã cập nhật thiết bị mạng và đồng bộ MySQL.", false);
      }).catch(function (error) {
        store.saveNetworkDevices(before); window.NetworkPage?.renderAll?.(); feedback("network-feedback", error.message || "Không thể đồng bộ thiết bị mạng.", true);
      });
      return { ...result, message: "Đã cập nhật thiết bị mạng. Đang đồng bộ backend..." };
    };

    store.deleteNetworkDevice = function (id) {
      const before = store.getNetworkDevices().slice();
      const result = originalDelete(id); if (!result.ok) return result;
      window.AppApi.delete("/network/" + encodeURIComponent(id)).catch(function (error) {
        store.saveNetworkDevices(before); window.NetworkPage?.renderAll?.(); feedback("network-feedback", error.message || "Không thể xóa thiết bị mạng trên backend.", true);
      });
      return { ...result, message: "Đã xóa thiết bị mạng. Đang đồng bộ backend..." };
    };

    store.__apiSyncPatched = true;
    window.AppApi.get("/network").then(function (items) {
      store.saveNetworkDevices(Array.isArray(items) ? items : []); window.NetworkPage?.renderAll?.();
      document.documentElement.dataset.networkDataSource = "api";
    }).catch(function () { document.documentElement.dataset.networkDataSource = "local-cache"; });

    document.addEventListener("submit", function (event) {
      const form = event.target.closest("#network-form"); if (!form) return;
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
      document.getElementById("network-editor-panel").hidden = true;
      window.NetworkPage?.renderAll?.(); feedback("network-feedback", result.message, false);
    }, true);
  }

  function patchTickets() {
    const store = window.TicketStorage;
    if (!store || store.__apiSyncPatched) return;
    const originalCreate = store.createTicket;
    const originalUpdate = store.updateTicket;
    const originalStatus = store.updateTicketStatus;
    const originalAssign = store.assignTicket;

    function createPayload(ticket) {
      return {
        id: ticket.id, title: ticket.title, description: ticket.description, category: ticket.category,
        priority: ticket.priority, status: ticket.status, requesterEmail: ticket.requesterEmail || null,
        assigneeEmail: ticket.assigneeEmail || null, deviceId: ticket.deviceId || null
      };
    }
    function patchPayload(ticket) {
      return {
        title: ticket.title, description: ticket.description, category: ticket.category, priority: ticket.priority,
        status: ticket.status, requesterEmail: ticket.requesterEmail || null, assigneeEmail: ticket.assigneeEmail || null,
        deviceId: ticket.deviceId || null
      };
    }
    function rollback(before, message) {
      store.saveTickets(before); window.TicketsPage?.renderTicketList?.(); window.TicketDetailPage?.render?.();
      feedback("ticket-feedback", message, true); notify(message, "error");
    }

    store.createTicket = function (ticket) {
      const before = store.getTickets().slice();
      const ok = originalCreate(ticket); if (!ok) return false;
      window.AppApi.post("/tickets", createPayload(store.getTicketById(ticket.id))).then(function (serverItem) {
        store.saveTickets(replaceById(store.getTickets(), { ...store.getTicketById(ticket.id), ...serverItem }));
        window.TicketsPage?.renderTicketList?.(); feedback("ticket-feedback", "Đã tạo phiếu và đồng bộ MySQL.", false);
      }).catch(function (error) { rollback(before, error.message || "Không thể đồng bộ phiếu hỗ trợ."); });
      return true;
    };

    store.updateTicket = function (id, changes) {
      const before = store.getTickets().slice(); const result = originalUpdate(id, changes); if (!result) return null;
      window.AppApi.patch("/tickets/" + encodeURIComponent(id), patchPayload(result)).then(function (serverItem) {
        store.saveTickets(replaceById(store.getTickets(), { ...result, ...serverItem }));
      }).catch(function (error) { rollback(before, error.message || "Không thể đồng bộ phiếu hỗ trợ."); });
      return result;
    };
    store.updateTicketStatus = function (id, status) {
      const before = store.getTickets().slice(); const result = originalStatus(id, status); if (!result) return null;
      window.AppApi.patch("/tickets/" + encodeURIComponent(id), { status: result.status }).catch(function (error) { rollback(before, error.message || "Không thể đồng bộ trạng thái phiếu."); });
      return result;
    };
    store.assignTicket = function (id, email) {
      const before = store.getTickets().slice(); const result = originalAssign(id, email); if (!result) return null;
      window.AppApi.patch("/tickets/" + encodeURIComponent(id), { assigneeEmail: result.assigneeEmail, status: result.status }).catch(function (error) { rollback(before, error.message || "Không thể đồng bộ phân công phiếu."); });
      return result;
    };

    store.__apiSyncPatched = true;
    window.AppApi.get("/tickets").then(function (items) {
      store.saveTickets(Array.isArray(items) ? items : []);
      window.TicketsPage?.renderTicketList?.(); window.TicketDetailPage?.render?.();
      document.documentElement.dataset.ticketsDataSource = "api";
    }).catch(function () { document.documentElement.dataset.ticketsDataSource = "local-cache"; });
  }

  function patchSettings() {
    if (!window.AppStorage || !window.SettingsModule || window.SettingsModule.__apiSyncPatched) return;
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
  }

  function hydrateReports() {
    if (!window.ReportsModule || !window.AppStorage) return;
    Promise.all([
      window.AppApi.get("/tickets"), window.AppApi.get("/devices"), window.AppApi.get("/network"), window.AppApi.get("/users")
    ]).then(function (values) {
      window.AppStorage.set("tickets", values[0]);
      window.AppStorage.set("devices", values[1]);
      window.AppStorage.set("networkDevices", values[2]);
      window.AppStorage.set("users", values[3]);
      window.ReportsModule.render(); document.documentElement.dataset.reportsDataSource = "api";
    }).catch(function () { document.documentElement.dataset.reportsDataSource = "local-cache"; });
  }

  function init() {
    patchDevices(); patchNetwork(); patchTickets(); patchSettings(); hydrateReports();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.addEventListener("load", init, { once: true });
  window.setTimeout(init, 0);
  window.setTimeout(init, 250);

  window.P23ApiSync = { init, patchDevices, patchNetwork, patchTickets, patchSettings, hydrateReports };
})();
