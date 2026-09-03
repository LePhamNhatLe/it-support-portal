(function () {
    const DEVICES_STORAGE_KEY = "devices";

    const DEVICE_TYPES = {
        desktop: "Máy tính để bàn",
        laptop: "Laptop",
        printer: "Máy in",
        router: "Router",
        switch: "Switch",
        access_point: "Access Point",
        server: "Máy chủ",
        other: "Thiết bị khác"
    };

    const DEVICE_STATUSES = {
        in_use: "Đang sử dụng",
        maintenance: "Đang bảo trì",
        storage: "Trong kho",
        broken: "Hỏng",
        retired: "Ngưng sử dụng"
    };

    const STATUS_CLASSES = {
        in_use: "status-badge--active",
        maintenance: "status-badge--maintenance",
        storage: "status-badge--stored",
        broken: "status-badge--broken",
        retired: "status-badge--retired"
    };

    const DEPARTMENTS = ["Hành chính", "Kinh doanh", "Kỹ thuật", "Kế toán", "Nhân sự", "Khác"];

    function normalizeText(value) {
        return typeof value === "string" ? value.trim() : "";
    }

    function normalizeEmail(value) {
        return normalizeText(value).toLowerCase();
    }

    function getCurrentActor() {
        if (typeof window.getCurrentUser !== "function") {
            return null;
        }

        const user = window.getCurrentUser();
        if (!user || typeof user !== "object") {
            return null;
        }

        return {
            email: normalizeEmail(user.email),
            name: normalizeText(user.name),
            role: normalizeText(user.role)
        };
    }

    function canManageDevices() {
        const actor = getCurrentActor();
        return Boolean(actor && ["technical_lead", "technician"].includes(actor.role));
    }

    function canDeleteDevices() {
        const actor = getCurrentActor();
        return Boolean(actor && actor.role === "technical_lead");
    }

    function getDevices() {
        if (!window.AppStorage || typeof window.AppStorage.get !== "function") {
            return [];
        }

        const devices = window.AppStorage.get(DEVICES_STORAGE_KEY, []);
        return Array.isArray(devices) ? devices : [];
    }

    function saveDevices(devices) {
        return Boolean(
            Array.isArray(devices) &&
            window.AppStorage &&
            typeof window.AppStorage.set === "function" &&
            window.AppStorage.set(DEVICES_STORAGE_KEY, devices)
        );
    }

    function getDeviceById(id) {
        const normalizedId = normalizeText(id);
        if (!normalizedId) {
            return null;
        }

        return getDevices().find(function (device) {
            return device && device.id === normalizedId;
        }) || null;
    }

    function isValidDeviceId(id) {
        return /^DEV-\d{3,}$/.test(normalizeText(id));
    }

    function isValidIpv4(value) {
        const ip = normalizeText(value);
        if (!ip) {
            return true;
        }

        const parts = ip.split(".");
        if (parts.length !== 4) {
            return false;
        }

        return parts.every(function (part) {
            if (!/^\d{1,3}$/.test(part)) {
                return false;
            }

            const number = Number(part);
            return number >= 0 && number <= 255;
        });
    }

    function isValidDate(value) {
        const normalized = normalizeText(value);
        return !normalized || !Number.isNaN(Date.parse(normalized));
    }

    function validateDevice(device, isCreate) {
        if (!device || typeof device !== "object" || Array.isArray(device)) {
            return { ok: false, reason: "invalid_input", message: "Dữ liệu thiết bị không hợp lệ." };
        }

        if (isCreate && !isValidDeviceId(device.id)) {
            return { ok: false, reason: "invalid_id", message: "Mã thiết bị không hợp lệ." };
        }

        if (!normalizeText(device.name)) {
            return { ok: false, reason: "invalid_name", message: "Tên thiết bị không được để trống." };
        }

        if (!Object.prototype.hasOwnProperty.call(DEVICE_TYPES, device.type)) {
            return { ok: false, reason: "invalid_type", message: "Loại thiết bị không hợp lệ." };
        }

        if (!Object.prototype.hasOwnProperty.call(DEVICE_STATUSES, device.status)) {
            return { ok: false, reason: "invalid_status", message: "Trạng thái thiết bị không hợp lệ." };
        }

        if (!DEPARTMENTS.includes(normalizeText(device.department) || "Khác")) {
            return { ok: false, reason: "invalid_department", message: "Phòng ban không hợp lệ." };
        }

        if (!isValidIpv4(device.ipAddress)) {
            return { ok: false, reason: "invalid_ip", message: "Địa chỉ IPv4 không hợp lệ." };
        }

        if (!isValidDate(device.purchaseDate)) {
            return { ok: false, reason: "invalid_date", message: "Ngày mua không hợp lệ." };
        }

        return { ok: true, reason: null, message: "Dữ liệu hợp lệ." };
    }

    function createDevice(device) {
        if (!canManageDevices()) {
            return { ok: false, reason: "forbidden", message: "Tài khoản hiện tại không có quyền thêm thiết bị.", data: null };
        }

        const validation = validateDevice(device, true);
        if (!validation.ok) {
            return { ...validation, data: null };
        }

        if (getDeviceById(device.id)) {
            return { ok: false, reason: "duplicate_id", message: "Mã thiết bị đã tồn tại.", data: null };
        }

        const now = new Date().toISOString();
        const normalized = {
            id: normalizeText(device.id),
            name: normalizeText(device.name),
            type: device.type,
            status: device.status,
            userEmail: normalizeEmail(device.userEmail) || null,
            department: normalizeText(device.department) || "Khác",
            ipAddress: normalizeText(device.ipAddress) || null,
            serialNumber: normalizeText(device.serialNumber) || null,
            purchaseDate: normalizeText(device.purchaseDate) || null,
            notes: normalizeText(device.notes) || null,
            createdAt: now,
            updatedAt: now
        };

        if (!saveDevices([...getDevices(), normalized])) {
            return { ok: false, reason: "save_failed", message: "Không thể lưu thiết bị.", data: null };
        }

        return { ok: true, reason: null, message: "Đã thêm thiết bị thành công.", data: normalized };
    }

    function updateDevice(id, changes) {
        if (!canManageDevices()) {
            return { ok: false, reason: "forbidden", message: "Tài khoản hiện tại không có quyền chỉnh sửa thiết bị.", data: null };
        }

        const current = getDeviceById(id);
        if (!current) {
            return { ok: false, reason: "not_found", message: "Không tìm thấy thiết bị.", data: null };
        }

        const candidate = {
            ...current,
            ...changes,
            id: current.id,
            createdAt: current.createdAt
        };

        const validation = validateDevice(candidate, false);
        if (!validation.ok) {
            return { ...validation, data: null };
        }

        const updated = {
            ...candidate,
            name: normalizeText(candidate.name),
            userEmail: normalizeEmail(candidate.userEmail) || null,
            department: normalizeText(candidate.department) || "Khác",
            ipAddress: normalizeText(candidate.ipAddress) || null,
            serialNumber: normalizeText(candidate.serialNumber) || null,
            purchaseDate: normalizeText(candidate.purchaseDate) || null,
            notes: normalizeText(candidate.notes) || null,
            updatedAt: new Date().toISOString()
        };

        const devices = getDevices();
        const index = devices.findIndex(function (device) {
            return device && device.id === current.id;
        });

        const next = devices.slice();
        next[index] = updated;

        if (!saveDevices(next)) {
            return { ok: false, reason: "save_failed", message: "Không thể lưu thay đổi thiết bị.", data: null };
        }

        return { ok: true, reason: null, message: "Đã cập nhật thiết bị thành công.", data: updated };
    }

    function deleteDevice(id) {
        if (!canDeleteDevices()) {
            return { ok: false, reason: "forbidden", message: "Chỉ Trưởng nhóm kỹ thuật được xóa thiết bị.", data: null };
        }

        const device = getDeviceById(id);
        if (!device) {
            return { ok: false, reason: "not_found", message: "Không tìm thấy thiết bị.", data: null };
        }

        const linkedTickets = window.TicketStorage && typeof window.TicketStorage.getTickets === "function"
            ? window.TicketStorage.getTickets().filter(function (ticket) {
                return ticket && ticket.deviceId === id;
            })
            : [];

        if (linkedTickets.length > 0) {
            return {
                ok: false,
                reason: "device_in_use",
                message: "Không thể xóa thiết bị đang được liên kết với phiếu hỗ trợ.",
                data: null
            };
        }

        const next = getDevices().filter(function (item) {
            return item && item.id !== id;
        });

        if (!saveDevices(next)) {
            return { ok: false, reason: "save_failed", message: "Không thể xóa thiết bị.", data: null };
        }

        return { ok: true, reason: null, message: "Đã xóa thiết bị.", data: device };
    }

    function generateNextDeviceId() {
        const highest = getDevices().reduce(function (max, device) {
            if (!device || typeof device.id !== "string") {
                return max;
            }

            const match = /^DEV-(\d+)$/.exec(device.id);
            return match ? Math.max(max, Number(match[1])) : max;
        }, 0);

        return "DEV-" + String(highest + 1).padStart(3, "0");
    }

    function getLinkedTicketCount(deviceId) {
        if (!window.TicketStorage || typeof window.TicketStorage.getTickets !== "function") {
            return 0;
        }

        return window.TicketStorage.getTickets().filter(function (ticket) {
            return ticket && ticket.deviceId === deviceId;
        }).length;
    }

    function normalizeSearch(value) {
        return normalizeText(value)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function filterDevices(devices, criteria) {
        const source = Array.isArray(devices) ? devices : [];
        const query = normalizeSearch(criteria && criteria.query);
        const type = normalizeText(criteria && criteria.type);
        const status = normalizeText(criteria && criteria.status);
        const department = normalizeText(criteria && criteria.department);

        return source.filter(function (device) {
            if (!device) {
                return false;
            }

            if (type && device.type !== type) {
                return false;
            }
            if (status && device.status !== status) {
                return false;
            }
            if (department && device.department !== department) {
                return false;
            }

            if (!query) {
                return true;
            }

            const haystack = [
                device.id,
                device.name,
                DEVICE_TYPES[device.type],
                DEVICE_STATUSES[device.status],
                device.userEmail,
                device.department,
                device.ipAddress,
                device.serialNumber
            ].map(normalizeSearch).join(" ");

            return haystack.includes(query);
        });
    }

    function formatDate(value) {
        const date = new Date(value || "");
        if (Number.isNaN(date.getTime())) {
            return "Chưa có dữ liệu";
        }
        return date.toLocaleDateString("vi-VN");
    }

    function getCriteriaFromDom() {
        return {
            query: document.getElementById("search-device")?.value || "",
            type: document.getElementById("device-type-filter")?.value || "",
            status: document.getElementById("device-status-filter")?.value || "",
            department: document.getElementById("device-department-filter")?.value || ""
        };
    }

    function setFeedback(message, isError) {
        const element = document.getElementById("device-feedback");
        if (!element) {
            return;
        }

        element.textContent = message || "";
        element.hidden = !message;
        element.dataset.state = isError ? "error" : "success";
    }

    function renderSummary() {
        const devices = getDevices();
        const summary = {
            total: devices.length,
            in_use: 0,
            maintenance: 0,
            retired: 0
        };

        devices.forEach(function (device) {
            if (Object.prototype.hasOwnProperty.call(summary, device.status)) {
                summary[device.status] += 1;
            }
        });

        document.querySelectorAll("[data-device-summary]").forEach(function (element) {
            const key = element.dataset.deviceSummary;
            element.textContent = String(summary[key] ?? 0);
        });

        return summary;
    }

    function createActionButton(label, action, id) {
        const button = document.createElement("button");
        button.className = "button button--ghost";
        button.type = "button";
        button.textContent = label;
        button.dataset.action = action;
        button.dataset.deviceId = id;
        return button;
    }

    function renderTable() {
        const tbody = document.querySelector(".devices-table tbody");
        const tableWrap = document.querySelector(".table-wrap");
        const emptyState = document.querySelector(".devices__empty");
        if (!tbody) {
            return [];
        }

        const devices = filterDevices(getDevices(), getCriteriaFromDom());
        tbody.replaceChildren();

        if (tableWrap) {
            tableWrap.hidden = devices.length === 0;
        }
        if (emptyState) {
            emptyState.hidden = devices.length !== 0;
        }

        const fragment = document.createDocumentFragment();

        devices.forEach(function (device) {
            const row = document.createElement("tr");
            const values = [
                device.id,
                device.name,
                DEVICE_TYPES[device.type] || "Khác",
                device.userEmail || "Chưa gán",
                device.department || "Khác",
                device.ipAddress || "Chưa có IP"
            ];

            values.forEach(function (value) {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });

            const statusCell = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = "status-badge " + (STATUS_CLASSES[device.status] || "");
            badge.textContent = DEVICE_STATUSES[device.status] || "Không xác định";
            statusCell.appendChild(badge);
            row.appendChild(statusCell);

            const purchaseCell = document.createElement("td");
            purchaseCell.textContent = formatDate(device.purchaseDate);
            row.appendChild(purchaseCell);

            const actionCell = document.createElement("td");
            actionCell.appendChild(createActionButton("Xem", "view-device", device.id));
            if (canManageDevices()) {
                actionCell.appendChild(createActionButton("Chỉnh sửa", "edit-device", device.id));
            }
            if (canDeleteDevices()) {
                actionCell.appendChild(createActionButton("Xóa", "delete-device", device.id));
            }
            row.appendChild(actionCell);

            fragment.appendChild(row);
        });

        tbody.appendChild(fragment);
        return devices;
    }

    function renderAll() {
        renderSummary();
        return renderTable();
    }

    function closeEditor() {
        const panel = document.getElementById("device-editor-panel");
        const form = document.getElementById("device-form");
        if (form) {
            form.reset();
            form.dataset.mode = "create";
            form.dataset.deviceId = "";
        }
        if (panel) {
            panel.hidden = true;
        }
    }

    function openCreateEditor() {
        if (!canManageDevices()) {
            setFeedback("Tài khoản hiện tại không có quyền thêm thiết bị.", true);
            return;
        }

        const panel = document.getElementById("device-editor-panel");
        const form = document.getElementById("device-form");
        if (!panel || !form) {
            return;
        }

        form.reset();
        form.dataset.mode = "create";
        form.dataset.deviceId = "";
        form.elements.id.value = generateNextDeviceId();
        form.elements.status.value = "storage";
        form.elements.department.value = "Khác";
        panel.hidden = false;
        setFeedback("");
    }

    function openEditEditor(id) {
        const device = getDeviceById(id);
        if (!device || !canManageDevices()) {
            setFeedback("Không thể chỉnh sửa thiết bị này.", true);
            return;
        }

        const panel = document.getElementById("device-editor-panel");
        const form = document.getElementById("device-form");
        if (!panel || !form) {
            return;
        }

        form.dataset.mode = "edit";
        form.dataset.deviceId = device.id;
        form.elements.id.value = device.id;
        form.elements.name.value = device.name || "";
        form.elements.type.value = device.type || "other";
        form.elements.status.value = device.status || "storage";
        form.elements.userEmail.value = device.userEmail || "";
        form.elements.department.value = device.department || "Khác";
        form.elements.ipAddress.value = device.ipAddress || "";
        form.elements.serialNumber.value = device.serialNumber || "";
        form.elements.purchaseDate.value = device.purchaseDate || "";
        form.elements.notes.value = device.notes || "";
        form.elements.id.readOnly = true;
        panel.hidden = false;
        setFeedback("");
    }

    function showDeviceDetail(id) {
        const device = getDeviceById(id);
        const panel = document.getElementById("device-detail-panel");
        const content = document.getElementById("device-detail-content");
        if (!device || !panel || !content) {
            return;
        }

        content.replaceChildren();
        const details = [
            ["Mã thiết bị", device.id],
            ["Tên thiết bị", device.name],
            ["Loại", DEVICE_TYPES[device.type] || "Khác"],
            ["Trạng thái", DEVICE_STATUSES[device.status] || "Không xác định"],
            ["Người sử dụng", device.userEmail || "Chưa gán"],
            ["Phòng ban", device.department || "Khác"],
            ["Địa chỉ IP", device.ipAddress || "Chưa có IP"],
            ["Serial", device.serialNumber || "Chưa có dữ liệu"],
            ["Ngày mua", formatDate(device.purchaseDate)],
            ["Phiếu hỗ trợ liên quan", String(getLinkedTicketCount(device.id))],
            ["Ghi chú", device.notes || "Không có ghi chú"]
        ];

        details.forEach(function (item) {
            const wrapper = document.createElement("div");
            const label = document.createElement("p");
            label.className = "detail__label";
            label.textContent = item[0];
            const value = document.createElement("p");
            value.className = "detail__value";
            value.textContent = item[1];
            wrapper.append(label, value);
            content.appendChild(wrapper);
        });

        panel.hidden = false;
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = {
            id: normalizeText(form.elements.id.value),
            name: normalizeText(form.elements.name.value),
            type: form.elements.type.value,
            status: form.elements.status.value,
            userEmail: normalizeEmail(form.elements.userEmail.value),
            department: form.elements.department.value,
            ipAddress: normalizeText(form.elements.ipAddress.value),
            serialNumber: normalizeText(form.elements.serialNumber.value),
            purchaseDate: form.elements.purchaseDate.value,
            notes: normalizeText(form.elements.notes.value)
        };

        const result = form.dataset.mode === "edit"
            ? updateDevice(form.dataset.deviceId, payload)
            : createDevice(payload);

        if (!result.ok) {
            setFeedback(result.message, true);
            return;
        }

        closeEditor();
        renderAll();
        setFeedback(result.message, false);
    }

    function handleTableAction(event) {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }

        const id = button.dataset.deviceId;
        if (button.dataset.action === "view-device") {
            showDeviceDetail(id);
        } else if (button.dataset.action === "edit-device") {
            openEditEditor(id);
        } else if (button.dataset.action === "delete-device") {
            const result = deleteDevice(id);
            renderAll();
            setFeedback(result.message, !result.ok);
        }
    }

    function populateFilters() {
        const typeSelect = document.getElementById("device-type-filter");
        const statusSelect = document.getElementById("device-status-filter");
        const departmentSelect = document.getElementById("device-department-filter");

        function populate(select, firstLabel, values) {
            if (!select) {
                return;
            }
            const fragment = document.createDocumentFragment();
            const all = document.createElement("option");
            all.value = "";
            all.textContent = firstLabel;
            fragment.appendChild(all);
            Object.entries(values).forEach(function (entry) {
                const option = document.createElement("option");
                option.value = entry[0];
                option.textContent = entry[1];
                fragment.appendChild(option);
            });
            select.replaceChildren(fragment);
        }

        populate(typeSelect, "Tất cả loại thiết bị", DEVICE_TYPES);
        populate(statusSelect, "Tất cả trạng thái", DEVICE_STATUSES);

        if (departmentSelect) {
            const fragment = document.createDocumentFragment();
            const all = document.createElement("option");
            all.value = "";
            all.textContent = "Tất cả phòng ban";
            fragment.appendChild(all);
            DEPARTMENTS.forEach(function (department) {
                const option = document.createElement("option");
                option.value = department;
                option.textContent = department;
                fragment.appendChild(option);
            });
            departmentSelect.replaceChildren(fragment);
        }
    }

    function renderPermissions() {
        document.querySelectorAll('[data-action="open-create-device"]').forEach(function (button) {
            button.hidden = !canManageDevices();
        });
    }

    function init() {
        populateFilters();
        renderPermissions();
        renderAll();

        document.getElementById("search-device")?.addEventListener("input", renderTable);
        ["device-type-filter", "device-status-filter", "device-department-filter"].forEach(function (id) {
            document.getElementById(id)?.addEventListener("change", renderTable);
        });

        document.querySelectorAll('[data-action="open-create-device"]').forEach(function (button) {
            button.addEventListener("click", openCreateEditor);
        });

        document.getElementById("device-form")?.addEventListener("submit", handleFormSubmit);
        document.getElementById("cancel-device-form")?.addEventListener("click", closeEditor);
        document.getElementById("close-device-detail")?.addEventListener("click", function () {
            const panel = document.getElementById("device-detail-panel");
            if (panel) {
                panel.hidden = true;
            }
        });
        document.querySelector(".devices-table tbody")?.addEventListener("click", handleTableAction);
    }

    window.DeviceStorage = {
        getDevices,
        saveDevices,
        getDeviceById,
        createDevice,
        updateDevice,
        deleteDevice,
        generateNextDeviceId,
        getLinkedTicketCount,
        validateDevice,
        canManageDevices,
        canDeleteDevices,
        DEVICE_TYPES,
        DEVICE_STATUSES,
        DEPARTMENTS
    };

    window.DevicesPage = {
        filterDevices,
        renderTable,
        renderSummary,
        renderAll,
        openCreateEditor,
        openEditEditor,
        showDeviceDetail
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
