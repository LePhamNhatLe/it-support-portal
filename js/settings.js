(function () {
    const SYSTEM_KEY = "systemSettings";
    const USER_PREFIX = "userSettings:";
    const ALLOWED_TIMEZONES = ["Asia/Ho_Chi_Minh", "UTC"];
    const ALLOWED_LANGUAGES = ["vi"];
    const ALLOWED_PRIORITIES = ["low", "medium", "high", "critical"];
    const ALLOWED_THEMES = ["light", "dark"];
    const ROLE_LABELS = {
        technical_lead: "Trưởng nhóm kỹ thuật",
        technician: "Nhân viên kỹ thuật",
        user: "Người dùng"
    };
    const PRIORITY_LABELS = {
        low: "Thấp",
        medium: "Trung bình",
        high: "Cao",
        critical: "Khẩn cấp"
    };

    const DEFAULT_SYSTEM = {
        companyName: "TPCOMS IT Support",
        timezone: "Asia/Ho_Chi_Minh",
        language: "vi",
        defaultPriority: "medium",
        slaHours: 8
    };

    const DEFAULT_USER = {
        theme: "light",
        notifyNewTicket: true,
        notifyAssigned: true,
        notifyUpdated: true,
        notifyEmail: false
    };

    function notify(message, ok) {
        if (window.AppUI && typeof window.AppUI.notify === "function") {
            window.AppUI.notify(message, ok ? "success" : "error");
            return;
        }
        window.alert(message);
    }

    function applyTheme(theme) {
        if (window.AppUI && typeof window.AppUI.applyTheme === "function") {
            window.AppUI.applyTheme(theme);
            return;
        }
        document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
    }

    function getActor() {
        return typeof window.getCurrentUser === "function" ? window.getCurrentUser() : null;
    }

    function getUserKey(email) {
        return USER_PREFIX + String(email || "").trim().toLowerCase();
    }

    function normalizeSystemSettings(settings) {
        const source = settings && typeof settings === "object" ? settings : {};
        const companyName = String(source.companyName || DEFAULT_SYSTEM.companyName).trim();
        const timezone = ALLOWED_TIMEZONES.includes(source.timezone) ? source.timezone : DEFAULT_SYSTEM.timezone;
        const language = ALLOWED_LANGUAGES.includes(source.language) ? source.language : DEFAULT_SYSTEM.language;
        const defaultPriority = ALLOWED_PRIORITIES.includes(source.defaultPriority) ? source.defaultPriority : DEFAULT_SYSTEM.defaultPriority;
        const numericSla = Number(source.slaHours);
        const slaHours = Number.isInteger(numericSla) && numericSla >= 1 && numericSla <= 168 ? numericSla : DEFAULT_SYSTEM.slaHours;
        return { companyName: companyName || DEFAULT_SYSTEM.companyName, timezone, language, defaultPriority, slaHours };
    }

    function normalizeUserSettings(settings) {
        const source = settings && typeof settings === "object" ? settings : {};
        return {
            theme: ALLOWED_THEMES.includes(source.theme) ? source.theme : DEFAULT_USER.theme,
            notifyNewTicket: typeof source.notifyNewTicket === "boolean" ? source.notifyNewTicket : DEFAULT_USER.notifyNewTicket,
            notifyAssigned: typeof source.notifyAssigned === "boolean" ? source.notifyAssigned : DEFAULT_USER.notifyAssigned,
            notifyUpdated: typeof source.notifyUpdated === "boolean" ? source.notifyUpdated : DEFAULT_USER.notifyUpdated,
            notifyEmail: typeof source.notifyEmail === "boolean" ? source.notifyEmail : DEFAULT_USER.notifyEmail
        };
    }

    function getSystemSettings() {
        if (!window.AppStorage || typeof window.AppStorage.get !== "function") return { ...DEFAULT_SYSTEM };
        return normalizeSystemSettings(window.AppStorage.get(SYSTEM_KEY, null));
    }

    function validateSystemSettings(settings) {
        const companyName = String(settings && settings.companyName || "").trim();
        const slaHours = Number(settings && settings.slaHours);
        if (!companyName) return { ok: false, message: "Tên công ty không được để trống." };
        if (!ALLOWED_TIMEZONES.includes(settings.timezone)) return { ok: false, message: "Múi giờ không hợp lệ." };
        if (!ALLOWED_LANGUAGES.includes(settings.language)) return { ok: false, message: "Ngôn ngữ không hợp lệ." };
        if (!ALLOWED_PRIORITIES.includes(settings.defaultPriority)) return { ok: false, message: "Mức ưu tiên mặc định không hợp lệ." };
        if (!Number.isInteger(slaHours) || slaHours < 1 || slaHours > 168) return { ok: false, message: "SLA mặc định phải là số nguyên từ 1 đến 168 giờ." };
        return { ok: true, data: { companyName, timezone: settings.timezone, language: settings.language, defaultPriority: settings.defaultPriority, slaHours } };
    }

    function saveSystemSettings(settings) {
        const actor = getActor();
        if (!actor || actor.role !== "technical_lead") return { ok: false, message: "Chỉ Trưởng nhóm kỹ thuật được thay đổi thiết lập hệ thống." };
        if (!window.AppStorage || typeof window.AppStorage.set !== "function") return { ok: false, message: "Bộ lưu trữ thiết lập chưa sẵn sàng." };
        const validation = validateSystemSettings(settings || {});
        if (!validation.ok) return validation;
        if (!window.AppStorage.set(SYSTEM_KEY, validation.data)) return { ok: false, message: "Không thể lưu thiết lập hệ thống." };
        return { ok: true, message: "Đã lưu thiết lập hệ thống.", data: validation.data };
    }

    function getUserSettings() {
        const actor = getActor();
        if (!actor || !window.AppStorage || typeof window.AppStorage.get !== "function") return { ...DEFAULT_USER };
        return normalizeUserSettings(window.AppStorage.get(getUserKey(actor.email), null));
    }

    function saveUserSettings(settings) {
        const actor = getActor();
        if (!actor || !window.AppStorage || typeof window.AppStorage.set !== "function") return { ok: false, message: "Không xác định được tài khoản hiện tại." };
        const source = settings && typeof settings === "object" ? settings : {};
        if (!ALLOWED_THEMES.includes(source.theme)) return { ok: false, message: "Tùy chọn giao diện không hợp lệ." };
        const normalized = {
            theme: source.theme,
            notifyNewTicket: Boolean(source.notifyNewTicket),
            notifyAssigned: Boolean(source.notifyAssigned),
            notifyUpdated: Boolean(source.notifyUpdated),
            notifyEmail: Boolean(source.notifyEmail)
        };
        if (!window.AppStorage.set(getUserKey(actor.email), normalized)) return { ok: false, message: "Không thể lưu tùy chọn cá nhân." };
        return { ok: true, message: "Đã lưu tùy chọn cá nhân.", data: normalized };
    }

    function updateProfileName(name) {
        const actor = getActor();
        const normalized = String(name || "").trim();
        if (!actor) return { ok: false, message: "Không xác định được tài khoản hiện tại." };
        if (normalized.length < 2) return { ok: false, message: "Tên hiển thị phải có ít nhất 2 ký tự." };
        if (normalized.length > 100) return { ok: false, message: "Tên hiển thị không được vượt quá 100 ký tự." };
        if (!window.UserStorage || typeof window.UserStorage.getUserByEmail !== "function" || typeof window.UserStorage.getUsers !== "function" || typeof window.UserStorage.saveUsers !== "function") {
            return { ok: false, message: "Danh sách người dùng chưa sẵn sàng." };
        }

        const user = window.UserStorage.getUserByEmail(actor.email);
        if (!user) return { ok: false, message: "Không tìm thấy tài khoản hiện tại trong danh sách người dùng." };
        const users = window.UserStorage.getUsers();
        const index = users.findIndex(function (item) { return item && item.id === user.id; });
        if (index < 0) return { ok: false, message: "Không tìm thấy dữ liệu tài khoản cần cập nhật." };

        const copy = users.slice();
        copy[index] = { ...copy[index], name: normalized, updatedAt: new Date().toISOString() };
        if (!window.UserStorage.saveUsers(copy)) return { ok: false, message: "Không thể lưu tên hiển thị vào danh sách người dùng." };

        const next = { email: actor.email, name: normalized, role: actor.role };
        const sessionSaved = window.AppAuth && typeof window.AppAuth.saveCurrentUser === "function"
            ? window.AppAuth.saveCurrentUser(next)
            : (function () {
                try { localStorage.setItem("currentUser", JSON.stringify(next)); return true; }
                catch (error) { return false; }
            })();
        if (!sessionSaved) return { ok: false, message: "Tên đã lưu vào hồ sơ nhưng không thể cập nhật phiên hiện tại." };

        document.querySelectorAll("[data-user-name]").forEach(function (el) { el.textContent = normalized; });
        return { ok: true, message: "Đã cập nhật tên hiển thị.", data: next };
    }

    function text(selector, value) {
        const element = document.querySelector(selector);
        if (element) element.textContent = String(value == null ? "-" : value);
    }

    function yesNo(value) {
        return value ? "Bật" : "Tắt";
    }

    function render() {
        const actor = getActor();
        if (!actor) return;
        const userSettings = getUserSettings();
        const system = getSystemSettings();
        applyTheme(userSettings.theme);

        text('[data-settings="account-name"]', actor.name || "-");
        text('[data-settings="account-email"]', actor.email || "-");
        text('[data-settings="account-role"]', ROLE_LABELS[actor.role] || actor.role || "-");
        text('[data-settings="company-name"]', system.companyName);
        text('[data-settings="timezone"]', system.timezone === "Asia/Ho_Chi_Minh" ? "UTC+7 - Việt Nam" : "UTC+0");
        text('[data-settings="default-priority"]', PRIORITY_LABELS[system.defaultPriority] || system.defaultPriority);
        text('[data-settings="sla-hours"]', system.slaHours + " giờ");
        text('[data-settings="theme"]', userSettings.theme === "dark" ? "Chế độ tối" : "Chế độ sáng");
        text('[data-settings="notify-new"]', yesNo(userSettings.notifyNewTicket));
        text('[data-settings="notify-assigned"]', yesNo(userSettings.notifyAssigned));
        text('[data-settings="notify-email"]', yesNo(userSettings.notifyEmail));

        const canManage = actor.role === "technical_lead";
        const button = document.getElementById("edit-system-settings");
        if (button) button.hidden = !canManage;
        const note = document.getElementById("system-settings-note");
        if (note) note.textContent = canManage ? "Bạn có quyền thay đổi các thông số mặc định." : "Chỉ Trưởng nhóm kỹ thuật được thay đổi phần này.";
    }

    function cloneTemplate(id) {
        const template = document.getElementById(id);
        if (!template || !template.content) return null;
        const wrapper = document.createElement("div");
        wrapper.appendChild(template.content.cloneNode(true));
        return wrapper;
    }

    function showFormError(root, id, message) {
        const element = root.querySelector("#" + id);
        if (!element) return;
        element.textContent = message || "";
        element.hidden = !message;
    }

    function bindCancel(root, controller) {
        root.querySelectorAll("[data-modal-cancel]").forEach(function (button) {
            button.addEventListener("click", controller.close);
        });
    }

    function openAccountModal() {
        const actor = getActor();
        const content = cloneTemplate("account-settings-template");
        if (!actor || !content || !window.AppUI || typeof window.AppUI.openModal !== "function") return;
        const controller = window.AppUI.openModal({ title: "Chỉnh sửa tài khoản", size: "md", content });
        bindCancel(content, controller);
        content.querySelector("#account-name").value = actor.name || "";
        content.querySelector("#account-email").value = actor.email || "";
        content.querySelector("#account-form").addEventListener("submit", function (event) {
            event.preventDefault();
            const result = updateProfileName(content.querySelector("#account-name").value);
            if (!result.ok) { showFormError(content, "account-form-error", result.message); return; }
            controller.close(); render(); notify(result.message, true);
        });
    }

    function openSystemModal() {
        const actor = getActor();
        if (!actor || actor.role !== "technical_lead") { notify("Chỉ Trưởng nhóm kỹ thuật được thay đổi thiết lập hệ thống.", false); return; }
        const content = cloneTemplate("system-settings-template");
        if (!content || !window.AppUI || typeof window.AppUI.openModal !== "function") return;
        const system = getSystemSettings();
        const controller = window.AppUI.openModal({ title: "Chỉnh sửa thiết lập hệ thống", size: "lg", content });
        bindCancel(content, controller);
        content.querySelector("#company-name").value = system.companyName;
        content.querySelector("#timezone").value = system.timezone;
        content.querySelector("#language").value = system.language;
        content.querySelector("#default-priority").value = system.defaultPriority;
        content.querySelector("#sla-hours").value = String(system.slaHours);
        content.querySelector("#system-settings-form").addEventListener("submit", function (event) {
            event.preventDefault();
            const result = saveSystemSettings({
                companyName: content.querySelector("#company-name").value,
                timezone: content.querySelector("#timezone").value,
                language: content.querySelector("#language").value,
                defaultPriority: content.querySelector("#default-priority").value,
                slaHours: content.querySelector("#sla-hours").value
            });
            if (!result.ok) { showFormError(content, "system-form-error", result.message); return; }
            controller.close(); render(); notify(result.message, true);
        });
    }

    function openPreferenceModal() {
        const actor = getActor();
        const content = cloneTemplate("preference-settings-template");
        if (!actor || !content || !window.AppUI || typeof window.AppUI.openModal !== "function") return;
        const current = getUserSettings();
        const controller = window.AppUI.openModal({ title: "Tùy chọn cá nhân", size: "lg", content });
        bindCancel(content, controller);
        content.querySelector("#theme").value = current.theme;
        content.querySelector("#notify-new-ticket").checked = current.notifyNewTicket;
        content.querySelector("#notify-assigned").checked = current.notifyAssigned;
        content.querySelector("#notify-updated").checked = current.notifyUpdated;
        content.querySelector("#notify-email").checked = current.notifyEmail;

        content.querySelector("#preference-form").addEventListener("submit", function (event) {
            event.preventDefault();
            const result = saveUserSettings({
                theme: content.querySelector("#theme").value,
                notifyNewTicket: content.querySelector("#notify-new-ticket").checked,
                notifyAssigned: content.querySelector("#notify-assigned").checked,
                notifyUpdated: content.querySelector("#notify-updated").checked,
                notifyEmail: content.querySelector("#notify-email").checked
            });
            if (!result.ok) { showFormError(content, "preference-form-error", result.message); return; }
            applyTheme(result.data.theme); controller.close(); render(); notify(result.message, true);
        });

        content.querySelector("#reset-user-settings").addEventListener("click", function () {
            if (!window.AppStorage || typeof window.AppStorage.remove !== "function") return;
            window.AppStorage.remove(getUserKey(actor.email));
            applyTheme(DEFAULT_USER.theme);
            controller.close(); render(); notify("Đã đặt lại tùy chọn cá nhân về mặc định.", true);
        });
    }

    function init() {
        render();
        document.querySelector('[data-settings-action="edit-account"]')?.addEventListener("click", openAccountModal);
        document.querySelector('[data-settings-action="edit-system"]')?.addEventListener("click", openSystemModal);
        document.querySelector('[data-settings-action="edit-preferences"]')?.addEventListener("click", openPreferenceModal);
    }

    window.SettingsModule = {
        getSystemSettings,
        validateSystemSettings,
        saveSystemSettings,
        getUserSettings,
        saveUserSettings,
        updateProfileName,
        render,
        openAccountModal,
        openSystemModal,
        openPreferenceModal
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
