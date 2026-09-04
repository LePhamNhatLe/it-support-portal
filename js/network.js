(function () {
    const NETWORK_STORAGE_KEY = "networkDevices";

    const NETWORK_TYPES = {
        router: "Router",
        switch: "Switch",
        access_point: "Access Point",
        firewall: "Firewall",
        server: "Máy chủ",
        modem: "Modem",
        other: "Thiết bị khác"
    };

    const NETWORK_STATUSES = {
        online: "Đang hoạt động",
        offline: "Ngoài tuyến",
        maintenance: "Đang bảo trì",
        warning: "Cảnh báo"
    };

    const STATUS_CLASSES = {
        online: "status-badge--active",
        offline: "status-badge--offline",
        maintenance: "status-badge--maintenance",
        warning: "status-badge--alert"
    };

    const NETWORK_AREAS = ["Phòng máy chủ", "Tầng 1", "Tầng 2", "Văn phòng", "Phòng kỹ thuật", "Khác"];

    const SEED_NETWORK_DEVICES = [
        { id: "NET-001", name: "RTR-CORE-01", type: "router", ipAddress: "10.0.0.1", macAddress: "00:1A:2B:3C:4D:5E", area: "Phòng máy chủ", status: "online", vlan: 10, subnet: "10.0.0.0/24", gateway: "10.0.0.1", managementUrl: null, uptimeHours: 288, notes: "Router core chính.", createdAt: "2026-06-01T08:00:00", updatedAt: "2026-06-01T08:00:00" },
        { id: "NET-002", name: "SW-CORE-01", type: "switch", ipAddress: "10.0.0.2", macAddress: "00:1A:2B:3C:4D:5F", area: "Phòng máy chủ", status: "online", vlan: 10, subnet: "10.0.0.0/24", gateway: "10.0.0.1", managementUrl: null, uptimeHours: 264, notes: "Switch core.", createdAt: "2026-06-01T08:05:00", updatedAt: "2026-06-01T08:05:00" },
        { id: "NET-003", name: "SW-FLOOR1-01", type: "switch", ipAddress: "10.0.1.10", macAddress: "00:1A:2B:3C:4D:6A", area: "Tầng 1", status: "maintenance", vlan: 20, subnet: "10.0.1.0/24", gateway: "10.0.1.1", managementUrl: null, uptimeHours: 120, notes: "Đang kiểm tra uplink.", createdAt: "2026-06-02T08:00:00", updatedAt: "2026-06-02T08:00:00" },
        { id: "NET-004", name: "AP-OFFICE-01", type: "access_point", ipAddress: "10.0.2.15", macAddress: "00:1A:2B:3C:4D:7B", area: "Văn phòng", status: "online", vlan: 30, subnet: "10.0.2.0/24", gateway: "10.0.2.1", managementUrl: null, uptimeHours: 168, notes: null, createdAt: "2026-06-03T08:00:00", updatedAt: "2026-06-03T08:00:00" },
        { id: "NET-005", name: "FW-EDGE-01", type: "firewall", ipAddress: "10.0.0.254", macAddress: "00:1A:2B:3C:4D:8C", area: "Phòng máy chủ", status: "online", vlan: 10, subnet: "10.0.0.0/24", gateway: "10.0.0.1", managementUrl: null, uptimeHours: 360, notes: "Firewall biên.", createdAt: "2026-06-04T08:00:00", updatedAt: "2026-06-04T08:00:00" },
        { id: "NET-006", name: "MDM-ISP-01", type: "modem", ipAddress: "10.0.3.22", macAddress: "00:1A:2B:3C:4D:9D", area: "Phòng kỹ thuật", status: "offline", vlan: 40, subnet: "10.0.3.0/24", gateway: "10.0.3.1", managementUrl: null, uptimeHours: 0, notes: "Mất kết nối uplink.", createdAt: "2026-06-05T08:00:00", updatedAt: "2026-06-05T08:00:00" },
        { id: "NET-007", name: "RTR-ACCESS-02", type: "router", ipAddress: "10.0.4.1", macAddress: "00:1A:2B:3C:4D:AA", area: "Tầng 2", status: "warning", vlan: 50, subnet: "10.0.4.0/24", gateway: "10.0.4.1", managementUrl: null, uptimeHours: 72, notes: "CPU cao, cần theo dõi.", createdAt: "2026-06-06T08:00:00", updatedAt: "2026-06-06T08:00:00" },
        { id: "NET-008", name: "SW-FLOOR2-01", type: "switch", ipAddress: "10.0.2.45", macAddress: "00:1A:2B:3C:4D:BB", area: "Tầng 2", status: "online", vlan: 30, subnet: "10.0.2.0/24", gateway: "10.0.2.1", managementUrl: null, uptimeHours: 216, notes: null, createdAt: "2026-06-07T08:00:00", updatedAt: "2026-06-07T08:00:00" }
    ];

    function normalizeText(value) {
        return typeof value === "string" ? value.trim() : "";
    }

    function getCurrentActor() {
        if (typeof window.getCurrentUser !== "function") return null;
        const user = window.getCurrentUser();
        return user && typeof user === "object" ? user : null;
    }

    function canManageNetwork() {
        const actor = getCurrentActor();
        return Boolean(actor && ["technical_lead", "technician"].includes(actor.role));
    }

    function canDeleteNetwork() {
        const actor = getCurrentActor();
        return Boolean(actor && actor.role === "technical_lead");
    }

    function seedNetworkDevices() {
        if (!window.AppStorage || typeof window.AppStorage.has !== "function") return false;
        if (!window.AppStorage.has(NETWORK_STORAGE_KEY)) {
            return window.AppStorage.set(NETWORK_STORAGE_KEY, SEED_NETWORK_DEVICES);
        }
        return true;
    }

    function getNetworkDevices() {
        seedNetworkDevices();
        const value = window.AppStorage && window.AppStorage.get
            ? window.AppStorage.get(NETWORK_STORAGE_KEY, [])
            : [];
        return Array.isArray(value) ? value : [];
    }

    function saveNetworkDevices(devices) {
        return Boolean(Array.isArray(devices) && window.AppStorage && window.AppStorage.set && window.AppStorage.set(NETWORK_STORAGE_KEY, devices));
    }

    function getNetworkDeviceById(id) {
        const target = normalizeText(id);
        return getNetworkDevices().find(function (device) { return device && device.id === target; }) || null;
    }

    function isValidId(id) {
        return /^NET-\d{3,}$/.test(normalizeText(id));
    }

    function isValidIpv4(value) {
        const ip = normalizeText(value);
        if (!ip) return false;
        const parts = ip.split(".");
        return parts.length === 4 && parts.every(function (part) {
            return /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255;
        });
    }

    function isValidMac(value) {
        const mac = normalizeText(value);
        return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac);
    }

    function isValidCidr(value) {
        const cidr = normalizeText(value);
        const match = /^(\d{1,3}(?:\.\d{1,3}){3})\/(\d|[12]\d|3[0-2])$/.exec(cidr);
        return Boolean(match && isValidIpv4(match[1]));
    }

    function isValidVlan(value) {
        const number = Number(value);
        return Number.isInteger(number) && number >= 1 && number <= 4094;
    }

    function validateNetworkDevice(device, isCreate) {
        if (!device || typeof device !== "object" || Array.isArray(device)) {
            return { ok: false, reason: "invalid_input", message: "Dữ liệu thiết bị mạng không hợp lệ." };
        }
        if (isCreate && !isValidId(device.id)) return { ok: false, reason: "invalid_id", message: "Mã thiết bị mạng phải có dạng NET-001." };
        if (!normalizeText(device.name)) return { ok: false, reason: "invalid_name", message: "Tên thiết bị mạng không được để trống." };
        if (!Object.prototype.hasOwnProperty.call(NETWORK_TYPES, device.type)) return { ok: false, reason: "invalid_type", message: "Loại thiết bị mạng không hợp lệ." };
        if (!Object.prototype.hasOwnProperty.call(NETWORK_STATUSES, device.status)) return { ok: false, reason: "invalid_status", message: "Trạng thái thiết bị mạng không hợp lệ." };
        if (!NETWORK_AREAS.includes(normalizeText(device.area) || "Khác")) return { ok: false, reason: "invalid_area", message: "Khu vực không hợp lệ." };
        if (!isValidIpv4(device.ipAddress)) return { ok: false, reason: "invalid_ip", message: "Địa chỉ IPv4 không hợp lệ." };
        if (!isValidMac(device.macAddress)) return { ok: false, reason: "invalid_mac", message: "Địa chỉ MAC phải có dạng AA:BB:CC:DD:EE:FF." };
        if (!isValidVlan(device.vlan)) return { ok: false, reason: "invalid_vlan", message: "VLAN phải từ 1 đến 4094." };
        if (!isValidCidr(device.subnet)) return { ok: false, reason: "invalid_subnet", message: "Subnet phải có dạng IPv4/CIDR, ví dụ 10.0.0.0/24." };
        if (!isValidIpv4(device.gateway)) return { ok: false, reason: "invalid_gateway", message: "Gateway IPv4 không hợp lệ." };
        const uptime = Number(device.uptimeHours);
        if (!Number.isFinite(uptime) || uptime < 0) return { ok: false, reason: "invalid_uptime", message: "Thời gian hoạt động không hợp lệ." };
        return { ok: true, reason: null, message: "Dữ liệu hợp lệ." };
    }

    function hasDuplicateAddress(device, exceptId) {
        return getNetworkDevices().some(function (item) {
            if (!item || item.id === exceptId) return false;
            return item.ipAddress === device.ipAddress || item.macAddress.toLowerCase() === device.macAddress.toLowerCase();
        });
    }

    function normalizeDevice(device, existing) {
        const now = new Date().toISOString();
        return {
            id: existing ? existing.id : normalizeText(device.id),
            name: normalizeText(device.name),
            type: device.type,
            ipAddress: normalizeText(device.ipAddress),
            macAddress: normalizeText(device.macAddress).toUpperCase(),
            area: normalizeText(device.area) || "Khác",
            status: device.status,
            vlan: Number(device.vlan),
            subnet: normalizeText(device.subnet),
            gateway: normalizeText(device.gateway),
            managementUrl: normalizeText(device.managementUrl) || null,
            uptimeHours: Number(device.uptimeHours),
            notes: normalizeText(device.notes) || null,
            createdAt: existing ? existing.createdAt : now,
            updatedAt: now
        };
    }

    function createNetworkDevice(device) {
        if (!canManageNetwork()) return { ok: false, reason: "forbidden", message: "Tài khoản hiện tại không có quyền thêm thiết bị mạng.", data: null };
        const validation = validateNetworkDevice(device, true);
        if (!validation.ok) return { ...validation, data: null };
        if (getNetworkDeviceById(device.id)) return { ok: false, reason: "duplicate_id", message: "Mã thiết bị mạng đã tồn tại.", data: null };
        if (hasDuplicateAddress(device, null)) return { ok: false, reason: "duplicate_address", message: "IP hoặc MAC đã được sử dụng bởi thiết bị khác.", data: null };
        const normalized = normalizeDevice(device, null);
        if (!saveNetworkDevices([...getNetworkDevices(), normalized])) return { ok: false, reason: "save_failed", message: "Không thể lưu thiết bị mạng.", data: null };
        return { ok: true, reason: null, message: "Đã thêm thiết bị mạng thành công.", data: normalized };
    }

    function updateNetworkDevice(id, changes) {
        if (!canManageNetwork()) return { ok: false, reason: "forbidden", message: "Tài khoản hiện tại không có quyền chỉnh sửa thiết bị mạng.", data: null };
        const current = getNetworkDeviceById(id);
        if (!current) return { ok: false, reason: "not_found", message: "Không tìm thấy thiết bị mạng.", data: null };
        const candidate = { ...current, ...changes, id: current.id, createdAt: current.createdAt };
        const validation = validateNetworkDevice(candidate, false);
        if (!validation.ok) return { ...validation, data: null };
        if (hasDuplicateAddress(candidate, current.id)) return { ok: false, reason: "duplicate_address", message: "IP hoặc MAC đã được sử dụng bởi thiết bị khác.", data: null };
        const updated = normalizeDevice(candidate, current);
        const devices = getNetworkDevices();
        const index = devices.findIndex(function (item) { return item && item.id === current.id; });
        const next = devices.slice();
        next[index] = updated;
        if (!saveNetworkDevices(next)) return { ok: false, reason: "save_failed", message: "Không thể lưu thay đổi thiết bị mạng.", data: null };
        return { ok: true, reason: null, message: "Đã cập nhật thiết bị mạng thành công.", data: updated };
    }

    function deleteNetworkDevice(id) {
        if (!canDeleteNetwork()) return { ok: false, reason: "forbidden", message: "Chỉ Trưởng nhóm kỹ thuật được xóa thiết bị mạng.", data: null };
        const current = getNetworkDeviceById(id);
        if (!current) return { ok: false, reason: "not_found", message: "Không tìm thấy thiết bị mạng.", data: null };
        if (!saveNetworkDevices(getNetworkDevices().filter(function (item) { return item && item.id !== current.id; }))) {
            return { ok: false, reason: "save_failed", message: "Không thể xóa thiết bị mạng.", data: null };
        }
        return { ok: true, reason: null, message: "Đã xóa thiết bị mạng.", data: current };
    }

    function generateNextNetworkId() {
        const highest = getNetworkDevices().reduce(function (max, device) {
            const match = device && typeof device.id === "string" ? /^NET-(\d+)$/.exec(device.id) : null;
            return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
        return "NET-" + String(highest + 1).padStart(3, "0");
    }

    function normalizeSearch(value) {
        return normalizeText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    function filterNetworkDevices(devices, criteria) {
        const source = Array.isArray(devices) ? devices : [];
        const query = normalizeSearch(criteria && criteria.query);
        const type = normalizeText(criteria && criteria.type);
        const status = normalizeText(criteria && criteria.status);
        const area = normalizeText(criteria && criteria.area);
        return source.filter(function (device) {
            if (!device) return false;
            if (type && device.type !== type) return false;
            if (status && device.status !== status) return false;
            if (area && device.area !== area) return false;
            if (!query) return true;
            return [device.id, device.name, NETWORK_TYPES[device.type], device.ipAddress, device.macAddress, device.area, NETWORK_STATUSES[device.status], device.vlan, device.subnet, device.gateway]
                .map(normalizeSearch).join(" ").includes(query);
        });
    }

    function formatUptime(hours) {
        const value = Number(hours);
        if (!Number.isFinite(value) || value <= 0) return "0 giờ";
        if (value < 24) return value + " giờ";
        const days = Math.floor(value / 24);
        const rest = value % 24;
        return rest ? days + " ngày " + rest + " giờ" : days + " ngày";
    }

    function setFeedback(message, isError) {
        const element = document.getElementById("network-feedback");
        if (!element) return;
        element.textContent = message || "";
        element.hidden = !message;
        element.dataset.state = isError ? "error" : "success";
    }

    function getCriteriaFromDom() {
        return {
            query: document.getElementById("search-network-device")?.value || "",
            type: document.getElementById("network-device-type-filter")?.value || "",
            status: document.getElementById("network-status-filter")?.value || "",
            area: document.getElementById("network-area-filter")?.value || ""
        };
    }

    function renderSummary() {
        const devices = getNetworkDevices();
        const summary = { total: devices.length, online: 0, maintenance: 0, offline: 0, router: 0, switch: 0, access_point: 0 };
        devices.forEach(function (device) {
            if (Object.prototype.hasOwnProperty.call(summary, device.status)) summary[device.status] += 1;
            if (Object.prototype.hasOwnProperty.call(summary, device.type)) summary[device.type] += 1;
        });
        document.querySelectorAll("[data-network-summary]").forEach(function (element) {
            element.textContent = String(summary[element.dataset.networkSummary] ?? 0);
        });
        return summary;
    }

    function createActionButton(label, action, id, modifier) {
        const button = document.createElement("button");
        button.className = "action-btn action-btn--" + modifier;
        button.type = "button";
        button.textContent = label;
        button.dataset.action = action;
        button.dataset.networkId = id;
        return button;
    }

    function renderTable() {
        const tbody = document.querySelector(".network-table tbody");
        if (!tbody) return [];
        const devices = filterNetworkDevices(getNetworkDevices(), getCriteriaFromDom());
        const tableWrap = document.querySelector(".network-table")?.closest(".table-wrap");
        const empty = document.querySelector(".network__empty");
        tbody.replaceChildren();
        if (tableWrap) tableWrap.hidden = devices.length === 0;
        if (empty) empty.hidden = devices.length !== 0;
        const fragment = document.createDocumentFragment();
        devices.forEach(function (device) {
            const row = document.createElement("tr");
            [device.id, device.name, NETWORK_TYPES[device.type] || "Khác", device.ipAddress, device.macAddress, device.area].forEach(function (value) {
                const td = document.createElement("td"); td.textContent = value; row.appendChild(td);
            });
            const statusCell = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = "status-badge " + (STATUS_CLASSES[device.status] || "");
            badge.textContent = NETWORK_STATUSES[device.status] || "Không xác định";
            statusCell.appendChild(badge); row.appendChild(statusCell);
            const uptimeCell = document.createElement("td"); uptimeCell.textContent = formatUptime(device.uptimeHours); row.appendChild(uptimeCell);
            const actionCell = document.createElement("td");
            const actionGroup = document.createElement("div");
            actionGroup.className = "table-actions";
            actionGroup.appendChild(createActionButton("Xem", "view-network", device.id, "view"));
            if (canManageNetwork()) actionGroup.appendChild(createActionButton("Chỉnh sửa", "edit-network", device.id, "edit"));
            if (canDeleteNetwork()) actionGroup.appendChild(createActionButton("Xóa", "delete-network", device.id, "delete"));
            actionCell.appendChild(actionGroup);
            row.appendChild(actionCell); fragment.appendChild(row);
        });
        tbody.appendChild(fragment);
        return devices;
    }

    function renderAll() {
        renderSummary();
        return renderTable();
    }

    function openCreateEditor() {
        if (!canManageNetwork()) {
            window.alert("Tài khoản hiện tại không có quyền thêm thiết bị mạng.");
            return;
        }
        const form = document.getElementById("network-form");
        const panel = document.getElementById("network-editor-panel");
        if (!form || !panel) return;
        form.reset();
        form.dataset.mode = "create";
        form.dataset.networkId = "";
        form.elements.id.value = generateNextNetworkId();
        form.elements.id.readOnly = false;
        form.elements.type.value = "switch";
        form.elements.status.value = "online";
        form.elements.area.value = "Khác";
        form.elements.vlan.value = "1";
        form.elements.uptimeHours.value = "0";
        panel.hidden = false;
        setFeedback("");
    }

    function openEditEditor(id) {
        const device = getNetworkDeviceById(id);
        const form = document.getElementById("network-form");
        const panel = document.getElementById("network-editor-panel");
        if (!device || !form || !panel || !canManageNetwork()) return;
        form.dataset.mode = "edit";
        form.dataset.networkId = device.id;
        Object.keys(device).forEach(function (key) {
            if (form.elements[key] && device[key] !== null && device[key] !== undefined) form.elements[key].value = device[key];
        });
        form.elements.id.readOnly = true;
        panel.hidden = false;
        setFeedback("");
    }

    function closeEditor() {
        const panel = document.getElementById("network-editor-panel");
        if (panel) panel.hidden = true;
    }

    function showNetworkDetail(id) {
        const device = getNetworkDeviceById(id);
        const panel = document.getElementById("network-detail-panel");
        const content = document.getElementById("network-detail-content");
        if (!device || !panel || !content) return;
        content.replaceChildren();
        [
            ["Mã thiết bị", device.id], ["Tên thiết bị", device.name], ["Loại", NETWORK_TYPES[device.type]], ["Trạng thái", NETWORK_STATUSES[device.status]],
            ["IPv4", device.ipAddress], ["MAC", device.macAddress], ["VLAN", String(device.vlan)], ["Subnet", device.subnet], ["Gateway", device.gateway],
            ["Khu vực", device.area], ["Uptime", formatUptime(device.uptimeHours)], ["Management URL", device.managementUrl || "Chưa có"], ["Ghi chú", device.notes || "Không có ghi chú"]
        ].forEach(function (entry) {
            const wrapper = document.createElement("div");
            const label = document.createElement("p"); label.className = "detail__label"; label.textContent = entry[0];
            const value = document.createElement("p"); value.className = "detail__value"; value.textContent = entry[1] || "Chưa có dữ liệu";
            wrapper.append(label, value); content.appendChild(wrapper);
        });
        panel.hidden = false;
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = {
            id: normalizeText(form.elements.id.value), name: normalizeText(form.elements.name.value), type: form.elements.type.value,
            ipAddress: normalizeText(form.elements.ipAddress.value), macAddress: normalizeText(form.elements.macAddress.value), area: form.elements.area.value,
            status: form.elements.status.value, vlan: Number(form.elements.vlan.value), subnet: normalizeText(form.elements.subnet.value),
            gateway: normalizeText(form.elements.gateway.value), managementUrl: normalizeText(form.elements.managementUrl.value),
            uptimeHours: Number(form.elements.uptimeHours.value), notes: normalizeText(form.elements.notes.value)
        };
        const result = form.dataset.mode === "edit" ? updateNetworkDevice(form.dataset.networkId, payload) : createNetworkDevice(payload);
        if (!result.ok) {
            setFeedback(result.message, true);
            window.alert(result.message);
            return;
        }
        closeEditor(); renderAll(); setFeedback(result.message, false); window.alert(result.message);
    }

    function handleTableAction(event) {
        const button = event.target.closest("button[data-action][data-network-id]");
        if (!button) return;
        const id = button.dataset.networkId;
        const action = button.dataset.action;
        if (action === "view-network") showNetworkDetail(id);
        else if (action === "edit-network") openEditEditor(id);
        else if (action === "delete-network") {
            const device = getNetworkDeviceById(id);
            if (!device) return;
            if (!window.confirm("Xóa thiết bị mạng " + device.id + " - " + device.name + "?")) return;
            const result = deleteNetworkDevice(id);
            renderAll(); setFeedback(result.message, !result.ok); window.alert(result.message);
        }
    }

    function populateFilters() {
        function fill(id, first, values) {
            const select = document.getElementById(id); if (!select) return;
            const fragment = document.createDocumentFragment();
            const all = document.createElement("option"); all.value = ""; all.textContent = first; fragment.appendChild(all);
            Object.entries(values).forEach(function (entry) {
                const option = document.createElement("option"); option.value = entry[0]; option.textContent = entry[1]; fragment.appendChild(option);
            });
            select.replaceChildren(fragment);
        }
        fill("network-device-type-filter", "Tất cả loại thiết bị", NETWORK_TYPES);
        fill("network-status-filter", "Tất cả trạng thái", NETWORK_STATUSES);
        const area = document.getElementById("network-area-filter");
        if (area) {
            area.replaceChildren();
            const all = document.createElement("option"); all.value = ""; all.textContent = "Tất cả khu vực"; area.appendChild(all);
            NETWORK_AREAS.forEach(function (value) { const option = document.createElement("option"); option.value = value; option.textContent = value; area.appendChild(option); });
        }
    }

    function init() {
        seedNetworkDevices(); populateFilters(); renderAll();
        document.getElementById("search-network-device")?.addEventListener("input", renderTable);
        ["network-device-type-filter", "network-status-filter", "network-area-filter"].forEach(function (id) { document.getElementById(id)?.addEventListener("change", renderTable); });
        document.querySelectorAll('[data-action="open-create-network"]').forEach(function (button) { button.addEventListener("click", openCreateEditor); });
        document.getElementById("network-form")?.addEventListener("submit", handleFormSubmit);
        document.getElementById("cancel-network-form")?.addEventListener("click", closeEditor);
        document.getElementById("close-network-detail")?.addEventListener("click", function () { const panel = document.getElementById("network-detail-panel"); if (panel) panel.hidden = true; });
        document.querySelector(".network-table tbody")?.addEventListener("click", handleTableAction);
    }

    window.NetworkStorage = {
        getNetworkDevices, saveNetworkDevices, getNetworkDeviceById, createNetworkDevice, updateNetworkDevice, deleteNetworkDevice,
        generateNextNetworkId, validateNetworkDevice, canManageNetwork, canDeleteNetwork, NETWORK_TYPES, NETWORK_STATUSES, NETWORK_AREAS,
        isValidIpv4, isValidMac, isValidCidr, isValidVlan
    };

    window.NetworkPage = { filterNetworkDevices, renderSummary, renderTable, renderAll, openCreateEditor, openEditEditor, showNetworkDetail };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();