(function () {
    const SYSTEM_KEY = "systemSettings";
    const USER_PREFIX = "userSettings:";

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

    function getSystemSettings() {
        if (!window.AppStorage) return { ...DEFAULT_SYSTEM };
        const stored = window.AppStorage.get(SYSTEM_KEY, null);
        return { ...DEFAULT_SYSTEM, ...(stored && typeof stored === "object" ? stored : {}) };
    }

    function saveSystemSettings(settings) {
        const actor = getActor();
        if (!actor || actor.role !== "technical_lead") {
            return { ok: false, message: "Chỉ Trưởng nhóm kỹ thuật được thay đổi thiết lập hệ thống." };
        }
        const normalized = {
            companyName: String(settings.companyName || "").trim(),
            timezone: settings.timezone || "Asia/Ho_Chi_Minh",
            language: settings.language || "vi",
            defaultPriority: settings.defaultPriority || "medium",
            slaHours: Number(settings.slaHours)
        };
        if (!normalized.companyName) return { ok: false, message: "Tên công ty không được để trống." };
        if (!Number.isFinite(normalized.slaHours) || normalized.slaHours < 1 || normalized.slaHours > 168) {
            return { ok: false, message: "SLA mặc định phải từ 1 đến 168 giờ." };
        }
        window.AppStorage.set(SYSTEM_KEY, normalized);
        return { ok: true, message: "Đã lưu thiết lập hệ thống.", data: normalized };
    }

    function getUserSettings() {
        const actor = getActor();
        if (!actor || !window.AppStorage) return { ...DEFAULT_USER };
        const stored = window.AppStorage.get(getUserKey(actor.email), null);
        return { ...DEFAULT_USER, ...(stored && typeof stored === "object" ? stored : {}) };
    }

    function saveUserSettings(settings) {
        const actor = getActor();
        if (!actor || !window.AppStorage) return { ok: false, message: "Không xác định được tài khoản hiện tại." };
        const normalized = {
            theme: settings.theme === "dark" ? "dark" : "light",
            notifyNewTicket: Boolean(settings.notifyNewTicket),
            notifyAssigned: Boolean(settings.notifyAssigned),
            notifyUpdated: Boolean(settings.notifyUpdated),
            notifyEmail: Boolean(settings.notifyEmail)
        };
        window.AppStorage.set(getUserKey(actor.email), normalized);
        return { ok: true, message: "Đã lưu tùy chọn cá nhân.", data: normalized };
    }

    function updateProfileName(name) {
        const actor = getActor();
        const normalized = String(name || "").trim();
        if (!actor) return { ok: false, message: "Không xác định được tài khoản hiện tại." };
        if (normalized.length < 2) return { ok: false, message: "Tên hiển thị phải có ít nhất 2 ký tự." };

        const next = { ...actor, name: normalized };
        localStorage.setItem("currentUser", JSON.stringify(next));

        if (window.UserStorage && typeof window.UserStorage.getUserByEmail === "function" && typeof window.UserStorage.saveUsers === "function") {
            const user = window.UserStorage.getUserByEmail(actor.email);
            if (user) {
                const users = window.UserStorage.getUsers();
                const index = users.findIndex(function (item) { return item && item.id === user.id; });
                if (index >= 0) {
                    const copy = users.slice();
                    copy[index] = { ...copy[index], name: normalized, updatedAt: new Date().toISOString() };
                    window.UserStorage.saveUsers(copy);
                }
            }
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
            window.alert(result.message + " Giao diện sáng/tối sẽ được áp dụng ở P19 UI Polish.");
        });

        document.getElementById("reset-user-settings")?.addEventListener("click", function () {
            const actor = getActor();
            if (!actor || !window.AppStorage) return;
            window.AppStorage.remove(getUserKey(actor.email));
            render();
            window.alert("Đã đặt lại tùy chọn cá nhân về mặc định.");
        });
    }

    window.SettingsModule = {
        getSystemSettings,
        saveSystemSettings,
        getUserSettings,
        saveUserSettings,
        updateProfileName,
        render
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
