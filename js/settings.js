(function () {
    const SYSTEM_KEY = "systemSettings";
    const USER_PREFIX = "userSettings:";
    const ALLOWED_TIMEZONES = ["Asia/Ho_Chi_Minh", "UTC"];
    const ALLOWED_LANGUAGES = ["vi"];
    const ALLOWED_PRIORITIES = ["low", "medium", "high", "critical"];
    const ALLOWED_THEMES = ["light", "dark"];

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
        const slaHours = Number.isInteger(numericSla) && numericSla >= 1 && numericSla <= 168
            ? numericSla
            : DEFAULT_SYSTEM.slaHours;

        return {
            companyName: companyName || DEFAULT_SYSTEM.companyName,
            timezone,
            language,
            defaultPriority,
            slaHours
        };
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
        if (!window.AppStorage || typeof window.AppStorage.get !== "function") {
            return { ...DEFAULT_SYSTEM };
        }
        return normalizeSystemSettings(window.AppStorage.get(SYSTEM_KEY, null));
    }

    function validateSystemSettings(settings) {
        const companyName = String(settings && settings.companyName || "").trim();
        const slaHours = Number(settings && settings.slaHours);

        if (!companyName) {
            return { ok: false, message: "Tên công ty không được để trống." };
        }
        if (!ALLOWED_TIMEZONES.includes(settings.timezone)) {
            return { ok: false, message: "Múi giờ không hợp lệ." };
        }
        if (!ALLOWED_LANGUAGES.includes(settings.language)) {
            return { ok: false, message: "Ngôn ngữ không hợp lệ." };
        }
        if (!ALLOWED_PRIORITIES.includes(settings.defaultPriority)) {
            return { ok: false, message: "Mức ưu tiên mặc định không hợp lệ." };
        }
        if (!Number.isInteger(slaHours) || slaHours < 1 || slaHours > 168) {
            return { ok: false, message: "SLA mặc định phải là số nguyên từ 1 đến 168 giờ." };
        }

        return {
            ok: true,
            data: {
                companyName,
                timezone: settings.timezone,
                language: settings.language,
                defaultPriority: settings.defaultPriority,
                slaHours
            }
        };
    }

    function saveSystemSettings(settings) {
        const actor = getActor();
        if (!actor || actor.role !== "technical_lead") {
            return { ok: false, message: "Chỉ Trưởng nhóm kỹ thuật được thay đổi thiết lập hệ thống." };
        }
        if (!window.AppStorage || typeof window.AppStorage.set !== "function") {
            return { ok: false, message: "Bộ lưu trữ thiết lập chưa sẵn sàng." };
        }

        const validation = validateSystemSettings(settings || {});
        if (!validation.ok) {
            return validation;
        }

        if (!window.AppStorage.set(SYSTEM_KEY, validation.data)) {
            return { ok: false, message: "Không thể lưu thiết lập hệ thống." };
        }

        return { ok: true, message: "Đã lưu thiết lập hệ thống.", data: validation.data };
    }

    function getUserSettings() {
        const actor = getActor();
        if (!actor || !window.AppStorage || typeof window.AppStorage.get !== "function") {
            return { ...DEFAULT_USER };
        }
        return normalizeUserSettings(window.AppStorage.get(getUserKey(actor.email), null));
    }

    function saveUserSettings(settings) {
        const actor = getActor();
        if (!actor || !window.AppStorage || typeof window.AppStorage.set !== "function") {
            return { ok: false, message: "Không xác định được tài khoản hiện tại." };
        }

        const source = settings && typeof settings === "object" ? settings : {};
        if (!ALLOWED_THEMES.includes(source.theme)) {
            return { ok: false, message: "Tùy chọn giao diện không hợp lệ." };
        }

        const normalized = {
            theme: source.theme,
            notifyNewTicket: Boolean(source.notifyNewTicket),
            notifyAssigned: Boolean(source.notifyAssigned),
            notifyUpdated: Boolean(source.notifyUpdated),
            notifyEmail: Boolean(source.notifyEmail)
        };

        if (!window.AppStorage.set(getUserKey(actor.email), normalized)) {
            return { ok: false, message: "Không thể lưu tùy chọn cá nhân." };
        }

        return { ok: true, message: "Đã lưu tùy chọn cá nhân.", data: normalized };
    }

    function updateProfileName(name) {
        const actor = getActor();
        const normalized = String(name || "").trim();
        if (!actor) return { ok: false, message: "Không xác định được tài khoản hiện tại." };
        if (normalized.length < 2) return { ok: false, message: "Tên hiển thị phải có ít nhất 2 ký tự." };
        if (normalized.length > 100) return { ok: false, message: "Tên hiển thị không được vượt quá 100 ký tự." };

        if (
            !window.UserStorage ||
            typeof window.UserStorage.getUserByEmail !== "function" ||
            typeof window.UserStorage.getUsers !== "function" ||
            typeof window.UserStorage.saveUsers !== "function"
        ) {
            return { ok: false, message: "Danh sách người dùng chưa sẵn sàng." };
        }

        const user = window.UserStorage.getUserByEmail(actor.email);
        if (!user) {
            return { ok: false, message: "Không tìm thấy tài khoản hiện tại trong danh sách người dùng." };
        }

        const users = window.UserStorage.getUsers();
        const index = users.findIndex(function (item) { return item && item.id === user.id; });
        if (index < 0) {
            return { ok: false, message: "Không tìm thấy dữ liệu tài khoản cần cập nhật." };
        }

        const copy = users.slice();
        copy[index] = { ...copy[index], name: normalized, updatedAt: new Date().toISOString() };
        if (!window.UserStorage.saveUsers(copy)) {
            return { ok: false, message: "Không thể lưu tên hiển thị vào danh sách người dùng." };
        }

        const next = { email: actor.email, name: normalized, role: actor.role };
        const sessionSaved = window.AppAuth && typeof window.AppAuth.saveCurrentUser === "function"
            ? window.AppAuth.saveCurrentUser(next)
            : (function () {
                try {
                    localStorage.setItem("currentUser", JSON.stringify(next));
                    return true;
                } catch (error) {
                    return false;
                }
            })();

        if (!sessionSaved) {
            return { ok: false, message: "Tên đã lưu vào hồ sơ nhưng không thể cập nhật phiên hiện tại." };
        }

        document.querySelectorAll("[data-user-name]").forEach(function (el) { el.textContent = normalized; });
        return { ok: true, message: "Đã cập nhật tên hiển thị.", data: next };
    }

    function render() {
        const actor = getActor();
        if (!actor) return;

        const accountName = document.getElementById("account-name");
        const accountEmail = document.getElementById("account-email");
        if (accountName) accountName.value = actor.name || "";
        if (accountEmail) accountEmail.value = actor.email || "";

        const userSettings = getUserSettings();
        document.querySelectorAll('input[name="theme"]').forEach(function (radio) {
            radio.checked = radio.value === userSettings.theme;
        });
        [
            ["notify-new-ticket", "notifyNewTicket"],
            ["notify-assigned", "notifyAssigned"],
            ["notify-updated", "notifyUpdated"],
            ["notify-email", "notifyEmail"]
        ].forEach(function (entry) {
            const element = document.getElementById(entry[0]);
            if (element) element.checked = Boolean(userSettings[entry[1]]);
        });

        const system = getSystemSettings();
        const company = document.getElementById("company-name");
        const timezone = document.getElementById("timezone");
        const language = document.getElementById("language");
        const priority = document.getElementById("default-priority");
        const sla = document.getElementById("sla-hours");
        if (company) company.value = system.companyName;
        if (timezone) timezone.value = system.timezone;
        if (language) language.value = system.language;
        if (priority) priority.value = system.defaultPriority;
        if (sla) sla.value = String(system.slaHours);

        const systemForm = document.getElementById("system-settings-form");
        const canManage = actor.role === "technical_lead";
        if (systemForm) {
            systemForm.querySelectorAll("input, select, button").forEach(function (element) {
                element.disabled = !canManage;
            });
        }
        const note = document.getElementById("system-settings-note");
        if (note) note.textContent = canManage ? "Bạn có quyền thay đổi thiết lập hệ thống." : "Chỉ Trưởng nhóm kỹ thuật được thay đổi phần này.";
    }

    function init() {
        render();

        document.getElementById("account-form")?.addEventListener("submit", function (event) {
            event.preventDefault();
            const result = updateProfileName(document.getElementById("account-name")?.value || "");
            window.alert(result.message);
        });

        document.getElementById("system-settings-form")?.addEventListener("submit", function (event) {
            event.preventDefault();
            const result = saveSystemSettings({
                companyName: document.getElementById("company-name")?.value,
                timezone: document.getElementById("timezone")?.value,
                language: document.getElementById("language")?.value,
                defaultPriority: document.getElementById("default-priority")?.value,
                slaHours: document.getElementById("sla-hours")?.value
            });
            window.alert(result.message);
        });

        document.getElementById("preference-form")?.addEventListener("submit", function (event) {
            event.preventDefault();
            const selectedTheme = document.querySelector('input[name="theme"]:checked');
            const result = saveUserSettings({
                theme: selectedTheme ? selectedTheme.value : "light",
                notifyNewTicket: document.getElementById("notify-new-ticket")?.checked,
                notifyAssigned: document.getElementById("notify-assigned")?.checked,
                notifyUpdated: document.getElementById("notify-updated")?.checked,
                notifyEmail: document.getElementById("notify-email")?.checked
            });
            window.alert(result.ok
                ? result.message + " Giao diện sáng/tối sẽ được áp dụng ở P19 UI Polish."
                : result.message);
        });

        document.getElementById("reset-user-settings")?.addEventListener("click", function () {
            const actor = getActor();
            if (!actor || !window.AppStorage || typeof window.AppStorage.remove !== "function") return;
            const removed = window.AppStorage.remove(getUserKey(actor.email));
            if (!removed) {
                window.alert("Không thể đặt lại tùy chọn cá nhân.");
                return;
            }
            render();
            window.alert("Đã đặt lại tùy chọn cá nhân về mặc định.");
        });
    }

    window.SettingsModule = {
        getSystemSettings,
        validateSystemSettings,
        saveSystemSettings,
        getUserSettings,
        saveUserSettings,
        updateProfileName,
        render
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
