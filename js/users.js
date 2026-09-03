(function () {
    const USERS_STORAGE_KEY = "users";

    const USER_ROLES = {
        technical_lead: "Trưởng nhóm kỹ thuật",
        technician: "Nhân viên kỹ thuật",
        user: "Người dùng"
    };

    const USER_STATUSES = {
        active: "Hoạt động",
        disabled: "Vô hiệu",
        locked: "Đã khóa"
    };

    const STATUS_CLASSES = {
        active: "status-badge--active",
        disabled: "status-badge--retired",
        locked: "status-badge--locked"
    };

    const DEPARTMENTS = ["IT", "Kỹ thuật", "Kinh doanh", "Hành chính", "Kế toán", "Nhân sự", "Marketing", "Vận hành", "Khác"];

    const SEED_USERS = [
        { id: "USR-001", name: "Nguyễn Văn An", email: "lead@itsupport.local", department: "IT", role: "technical_lead", phone: "0901000001", status: "active", createdAt: "2026-06-01T08:00:00" },
        { id: "USR-002", name: "Trần Văn Bình", email: "technician@itsupport.local", department: "Kỹ thuật", role: "technician", phone: "0901000002", status: "active", createdAt: "2026-06-01T08:05:00" },
        { id: "USR-003", name: "Lê Minh Anh", email: "user@itsupport.local", department: "Kinh doanh", role: "user", phone: "0901000003", status: "active", createdAt: "2026-06-01T08:10:00" },
        { id: "USR-004", name: "Phạm Thị Hương", email: "huong.pham@hr.local", department: "Nhân sự", role: "user", phone: "0975210987", status: "active", createdAt: "2026-06-02T09:00:00" },
        { id: "USR-005", name: "Hoàng Văn Cường", email: "cuong.hoang@accounting.local", department: "Kế toán", role: "user", phone: "0944778221", status: "locked", createdAt: "2026-06-03T09:00:00" },
        { id: "USR-006", name: "Nguyễn Thị Lan", email: "lan.nguyen@marketing.local", department: "Marketing", role: "user", phone: "0931555010", status: "active", createdAt: "2026-06-04T09:00:00" },
        { id: "USR-007", name: "Đinh Văn Long", email: "long.dinh@operation.local", department: "Vận hành", role: "technician", phone: "0964900221", status: "active", createdAt: "2026-06-05T09:00:00" },
        { id: "USR-008", name: "Vũ Minh Quân", email: "quan.vu@itsupport.local", department: "IT", role: "technician", phone: "0922334556", status: "disabled", createdAt: "2026-06-06T09:00:00" }
    ];

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
        return user && typeof user === "object" ? user : null;
    }

    function canManageUsers() {
        const actor = getCurrentActor();
        return Boolean(actor && actor.role === "technical_lead");
    }

    function seedUsers() {
        if (!window.AppStorage || typeof window.AppStorage.has !== "function") {
            return false;
        }
        if (!window.AppStorage.has(USERS_STORAGE_KEY)) {
            return window.AppStorage.set(USERS_STORAGE_KEY, SEED_USERS);
        }
        return true;
    }

    function getUsers() {
        seedUsers();
        const users = window.AppStorage && window.AppStorage.get
            ? window.AppStorage.get(USERS_STORAGE_KEY, [])
            : [];
        return Array.isArray(users) ? users : [];
    }

    function saveUsers(users) {
        return Boolean(Array.isArray(users) && window.AppStorage && window.AppStorage.set && window.AppStorage.set(USERS_STORAGE_KEY, users));
    }

    function getUserById(id) {
        const target = normalizeText(id);
        return getUsers().find(function (user) { return user && user.id === target; }) || null;
    }

    function getUserByEmail(email) {
        const target = normalizeEmail(email);
        return getUsers().find(function (user) { return user && normalizeEmail(user.email) === target; }) || null;
    }

    function isValidUserId(id) {
        return /^USR-\d{3,}$/.test(normalizeText(id));
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
    }

    function isValidPhone(phone) {
        const value = normalizeText(phone);
        return !value || /^[0-9+()\s.-]{8,20}$/.test(value);
    }

    function validateUser(user, isCreate) {
        if (!user || typeof user !== "object" || Array.isArray(user)) {
            return { ok: false, reason: "invalid_input", message: "Dữ liệu người dùng không hợp lệ." };
        }
        if (isCreate && !isValidUserId(user.id)) {
            return { ok: false, reason: "invalid_id", message: "Mã người dùng không hợp lệ." };
        }
        if (!normalizeText(user.name)) {
            return { ok: false, reason: "invalid_name", message: "Tên người dùng không được để trống." };
        }
        if (!isValidEmail(user.email)) {
            return { ok: false, reason: "invalid_email", message: "Email không hợp lệ." };
        }
        if (!Object.prototype.hasOwnProperty.call(USER_ROLES, user.role)) {
            return { ok: false, reason: "invalid_role", message: "Vai trò không hợp lệ." };
        }
        if (!Object.prototype.hasOwnProperty.call(USER_STATUSES, user.status)) {
            return { ok: false, reason: "invalid_status", message: "Trạng thái không hợp lệ." };
        }
        if (!DEPARTMENTS.includes(normalizeText(user.department) || "Khác")) {
            return { ok: false, reason: "invalid_department", message: "Phòng ban không hợp lệ." };
        }
        if (!isValidPhone(user.phone)) {
            return { ok: false, reason: "invalid_phone", message: "Số điện thoại không hợp lệ." };
        }
        return { ok: true, reason: null, message: "Dữ liệu hợp lệ." };
    }

    function createUser(user) {
        if (!canManageUsers()) {
            return { ok: false, reason: "forbidden", message: "Tài khoản hiện tại không có quyền thêm người dùng.", data: null };
        }
        const validation = validateUser(user, true);
        if (!validation.ok) {
            return { ...validation, data: null };
        }
        if (getUserById(user.id)) {
            return { ok: false, reason: "duplicate_id", message: "Mã người dùng đã tồn tại.", data: null };
        }
        if (getUserByEmail(user.email)) {
            return { ok: false, reason: "duplicate_email", message: "Email đã tồn tại.", data: null };
        }
        const now = new Date().toISOString();
        const normalized = {
            id: normalizeText(user.id),
            name: normalizeText(user.name),
            email: normalizeEmail(user.email),
            department: normalizeText(user.department) || "Khác",
            role: user.role,
            phone: normalizeText(user.phone) || null,
            status: user.status,
            createdAt: now,
            updatedAt: now
        };
        if (!saveUsers([...getUsers(), normalized])) {
            return { ok: false, reason: "save_failed", message: "Không thể lưu người dùng.", data: null };
        }
        return { ok: true, reason: null, message: "Đã thêm người dùng thành công.", data: normalized };
    }

    function updateUser(id, changes) {
        if (!canManageUsers()) {
            return { ok: false, reason: "forbidden", message: "Tài khoản hiện tại không có quyền chỉnh sửa người dùng.", data: null };
        }
        const current = getUserById(id);
        if (!current) {
            return { ok: false, reason: "not_found", message: "Không tìm thấy người dùng.", data: null };
        }
        const candidate = {
            ...current,
            ...changes,
            id: current.id,
            email: current.email,
            createdAt: current.createdAt
        };
        const validation = validateUser(candidate, false);
        if (!validation.ok) {
            return { ...validation, data: null };
        }
        const updated = {
            ...candidate,
            name: normalizeText(candidate.name),
            department: normalizeText(candidate.department) || "Khác",
            phone: normalizeText(candidate.phone) || null,
            updatedAt: new Date().toISOString()
        };
        const users = getUsers();
        const index = users.findIndex(function (user) { return user && user.id === current.id; });
        const next = users.slice();
        next[index] = updated;
        if (!saveUsers(next)) {
            return { ok: false, reason: "save_failed", message: "Không thể lưu thay đổi người dùng.", data: null };
        }
        return { ok: true, reason: null, message: "Đã cập nhật người dùng thành công.", data: updated };
    }

    function getUserLinks(user) {
        const email = normalizeEmail(user && user.email);
        const tickets = window.TicketStorage && window.TicketStorage.getTickets
            ? window.TicketStorage.getTickets().filter(function (ticket) {
                return ticket && (normalizeEmail(ticket.requesterEmail) === email || normalizeEmail(ticket.assigneeEmail) === email);
            })
            : [];
        const devices = window.DeviceStorage && window.DeviceStorage.getDevices
            ? window.DeviceStorage.getDevices().filter(function (device) {
                return device && normalizeEmail(device.userEmail) === email;
            })
            : [];
        return { tickets, devices };
    }

    function changeUserStatus(id, status) {
        if (!Object.prototype.hasOwnProperty.call(USER_STATUSES, status)) {
            return { ok: false, reason: "invalid_status", message: "Trạng thái không hợp lệ.", data: null };
        }
        const current = getUserById(id);
        if (!current) {
            return { ok: false, reason: "not_found", message: "Không tìm thấy người dùng.", data: null };
        }
        const actor = getCurrentActor();
        if (actor && normalizeEmail(actor.email) === normalizeEmail(current.email) && status !== "active") {
            return { ok: false, reason: "self_protection", message: "Không thể khóa hoặc vô hiệu chính tài khoản đang đăng nhập.", data: null };
        }
        return updateUser(id, { status });
    }

    function deleteUser(id) {
        if (!canManageUsers()) {
            return { ok: false, reason: "forbidden", message: "Tài khoản hiện tại không có quyền xóa người dùng.", data: null };
        }
        const user = getUserById(id);
        if (!user) {
            return { ok: false, reason: "not_found", message: "Không tìm thấy người dùng.", data: null };
        }
        const actor = getCurrentActor();
        if (actor && normalizeEmail(actor.email) === normalizeEmail(user.email)) {
            return { ok: false, reason: "self_protection", message: "Không thể xóa chính tài khoản đang đăng nhập.", data: null };
        }
        const links = getUserLinks(user);
        if (links.tickets.length || links.devices.length) {
            return {
                ok: false,
                reason: "user_in_use",
                message: "Không thể xóa người dùng đang liên kết với phiếu hỗ trợ hoặc thiết bị.",
                data: null,
                details: { tickets: links.tickets.length, devices: links.devices.length }
            };
        }
        if (!saveUsers(getUsers().filter(function (item) { return item && item.id !== id; }))) {
            return { ok: false, reason: "save_failed", message: "Không thể xóa người dùng.", data: null };
        }
        return { ok: true, reason: null, message: "Đã xóa người dùng.", data: user };
    }

    function generateNextUserId() {
        const highest = getUsers().reduce(function (max, user) {
            const match = user && typeof user.id === "string" ? /^USR-(\d+)$/.exec(user.id) : null;
            return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
        return "USR-" + String(highest + 1).padStart(3, "0");
    }

    function normalizeSearch(value) {
        return normalizeText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    function filterUsers(users, criteria) {
        const source = Array.isArray(users) ? users : [];
        const query = normalizeSearch(criteria && criteria.query);
        const role = normalizeText(criteria && criteria.role);
        const status = normalizeText(criteria && criteria.status);
        return source.filter(function (user) {
            if (!user) return false;
            if (role && user.role !== role) return false;
            if (status && user.status !== status) return false;
            if (!query) return true;
            return [user.id, user.name, user.email, user.department, USER_ROLES[user.role], user.phone, USER_STATUSES[user.status]]
                .map(normalizeSearch).join(" ").includes(query);
        });
    }

    function formatDate(value) {
        const date = new Date(value || "");
        return Number.isNaN(date.getTime()) ? "Chưa có dữ liệu" : date.toLocaleDateString("vi-VN");
    }

    function setFeedback(message, isError) {
        const element = document.getElementById("user-feedback");
        if (!element) return;
        element.textContent = message || "";
        element.hidden = !message;
        element.dataset.state = isError ? "error" : "success";
    }

    function renderSummary() {
        const users = getUsers();
        const summary = { total: users.length, active: 0, technician: 0, locked: 0 };
        users.forEach(function (user) {
            if (user.status === "active") summary.active += 1;
            if (user.role === "technician") summary.technician += 1;
            if (user.status === "locked") summary.locked += 1;
        });
        document.querySelectorAll("[data-user-summary]").forEach(function (element) {
            element.textContent = String(summary[element.dataset.userSummary] ?? 0);
        });
        return summary;
    }

    function getCriteriaFromDom() {
        return {
            query: document.getElementById("user-search")?.value || "",
            role: document.getElementById("role-filter")?.value || "",
            status: document.getElementById("status-filter")?.value || ""
        };
    }

    function createActionButton(label, action, id) {
        const button = document.createElement("button");
        button.className = "button button--ghost";
        button.type = "button";
        button.textContent = label;
        button.dataset.action = action;
        button.dataset.userId = id;
        return button;
    }

    function renderTable() {
        const tbody = document.querySelector(".users-table tbody");
        if (!tbody) return [];
        const users = filterUsers(getUsers(), getCriteriaFromDom());
        const tableWrap = document.querySelector(".users-table")?.closest(".table-wrap");
        const empty = document.querySelector(".users__empty");
        tbody.replaceChildren();
        if (tableWrap) tableWrap.hidden = users.length === 0;
        if (empty) empty.hidden = users.length !== 0;

        const fragment = document.createDocumentFragment();
        users.forEach(function (user) {
            const row = document.createElement("tr");
            [user.id, user.name, user.email, user.department, USER_ROLES[user.role] || "Không xác định", user.phone || "Chưa có"].forEach(function (value) {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });
            const statusCell = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = "status-badge " + (STATUS_CLASSES[user.status] || "");
            badge.textContent = USER_STATUSES[user.status] || "Không xác định";
            statusCell.appendChild(badge);
            row.appendChild(statusCell);
            const createdCell = document.createElement("td");
            createdCell.textContent = formatDate(user.createdAt);
            row.appendChild(createdCell);
            const actionCell = document.createElement("td");
            actionCell.appendChild(createActionButton("Xem", "view-user", user.id));
            if (canManageUsers()) {
                actionCell.appendChild(createActionButton("Chỉnh sửa", "edit-user", user.id));
                actionCell.appendChild(createActionButton(user.status === "locked" ? "Mở khóa" : "Khóa", user.status === "locked" ? "unlock-user" : "lock-user", user.id));
                actionCell.appendChild(createActionButton("Xóa", "delete-user", user.id));
            }
            row.appendChild(actionCell);
            fragment.appendChild(row);
        });
        tbody.appendChild(fragment);
        return users;
    }

    function renderAll() {
        renderSummary();
        return renderTable();
    }

    function openCreateEditor() {
        const panel = document.getElementById("user-editor-panel");
        const form = document.getElementById("user-form");
        if (!panel || !form || !canManageUsers()) return;
        form.reset();
        form.dataset.mode = "create";
        form.dataset.userId = "";
        form.elements.id.value = generateNextUserId();
        form.elements.id.readOnly = false;
        form.elements.email.readOnly = false;
        form.elements.role.value = "user";
        form.elements.status.value = "active";
        form.elements.department.value = "Khác";
        panel.hidden = false;
        setFeedback("");
    }

    function openEditEditor(id) {
        const user = getUserById(id);
        const panel = document.getElementById("user-editor-panel");
        const form = document.getElementById("user-form");
        if (!user || !panel || !form || !canManageUsers()) return;
        form.dataset.mode = "edit";
        form.dataset.userId = user.id;
        form.elements.id.value = user.id;
        form.elements.id.readOnly = true;
        form.elements.name.value = user.name || "";
        form.elements.email.value = user.email || "";
        form.elements.email.readOnly = true;
        form.elements.department.value = user.department || "Khác";
        form.elements.role.value = user.role;
        form.elements.phone.value = user.phone || "";
        form.elements.status.value = user.status;
        panel.hidden = false;
        setFeedback("");
    }

    function closeEditor() {
        const panel = document.getElementById("user-editor-panel");
        if (panel) panel.hidden = true;
    }

    function showUserDetail(id) {
        const user = getUserById(id);
        const panel = document.getElementById("user-detail-panel");
        const content = document.getElementById("user-detail-content");
        if (!user || !panel || !content) return;
        const links = getUserLinks(user);
        content.replaceChildren();
        [
            ["Mã người dùng", user.id], ["Tên", user.name], ["Email", user.email], ["Phòng ban", user.department],
            ["Vai trò", USER_ROLES[user.role]], ["Số điện thoại", user.phone || "Chưa có"], ["Trạng thái", USER_STATUSES[user.status]],
            ["Phiếu hỗ trợ liên quan", String(links.tickets.length)], ["Thiết bị được gán", String(links.devices.length)], ["Ngày tạo", formatDate(user.createdAt)]
        ].forEach(function (entry) {
            const wrapper = document.createElement("div");
            const label = document.createElement("p");
            label.className = "detail__label";
            label.textContent = entry[0];
            const value = document.createElement("p");
            value.className = "detail__value";
            value.textContent = entry[1] || "Chưa có dữ liệu";
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
            email: normalizeEmail(form.elements.email.value),
            department: form.elements.department.value,
            role: form.elements.role.value,
            phone: normalizeText(form.elements.phone.value),
            status: form.elements.status.value
        };
        const result = form.dataset.mode === "edit" ? updateUser(form.dataset.userId, payload) : createUser(payload);
        if (!result.ok) {
            setFeedback(result.message, true);
            return;
        }
        closeEditor();
        renderAll();
        setFeedback(result.message, false);
    }

    function handleTableAction(event) {
        const button = event.target.closest("button[data-action][data-user-id]");
        if (!button) return;
        const id = button.dataset.userId;
        const action = button.dataset.action;
        if (action === "view-user") {
            showUserDetail(id);
        } else if (action === "edit-user") {
            openEditEditor(id);
        } else if (action === "lock-user" || action === "unlock-user") {
            const result = changeUserStatus(id, action === "lock-user" ? "locked" : "active");
            renderAll();
            setFeedback(result.message, !result.ok);
        } else if (action === "delete-user") {
            const user = getUserById(id);
            if (!user) return;
            const links = getUserLinks(user);
            if (links.tickets.length || links.devices.length) {
                setFeedback("Không thể xóa " + user.id + " vì đang liên kết với " + links.tickets.length + " phiếu hỗ trợ và " + links.devices.length + " thiết bị.", true);
                return;
            }
            if (!window.confirm("Xóa người dùng " + user.id + " - " + user.name + "?")) return;
            const result = deleteUser(id);
            renderAll();
            setFeedback(result.message, !result.ok);
        }
    }

    function populateFilters() {
        const role = document.getElementById("role-filter");
        const status = document.getElementById("status-filter");
        function fill(select, first, values) {
            if (!select) return;
            const fragment = document.createDocumentFragment();
            const all = document.createElement("option"); all.value = ""; all.textContent = first; fragment.appendChild(all);
            Object.entries(values).forEach(function (entry) {
                const option = document.createElement("option"); option.value = entry[0]; option.textContent = entry[1]; fragment.appendChild(option);
            });
            select.replaceChildren(fragment);
        }
        fill(role, "Tất cả vai trò", USER_ROLES);
        fill(status, "Tất cả trạng thái", USER_STATUSES);
    }

    function init() {
        seedUsers();
        populateFilters();
        renderAll();
        document.getElementById("user-search")?.addEventListener("input", renderTable);
        document.getElementById("role-filter")?.addEventListener("change", renderTable);
        document.getElementById("status-filter")?.addEventListener("change", renderTable);
        document.querySelectorAll('[data-action="open-create-user"]').forEach(function (button) { button.addEventListener("click", openCreateEditor); });
        document.getElementById("user-form")?.addEventListener("submit", handleFormSubmit);
        document.getElementById("cancel-user-form")?.addEventListener("click", closeEditor);
        document.getElementById("close-user-detail")?.addEventListener("click", function () { document.getElementById("user-detail-panel").hidden = true; });
        document.querySelector(".users-table tbody")?.addEventListener("click", handleTableAction);
    }

    window.UserStorage = {
        getUsers, saveUsers, getUserById, getUserByEmail, createUser, updateUser, changeUserStatus, deleteUser,
        generateNextUserId, getUserLinks, validateUser, canManageUsers, USER_ROLES, USER_STATUSES, DEPARTMENTS
    };
    window.UsersPage = { filterUsers, renderTable, renderSummary, renderAll, openCreateEditor, openEditEditor, showUserDetail };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();