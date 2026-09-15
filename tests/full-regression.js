(function () {
    const TRACKED_KEYS = [
        "tickets",
        "devices",
        "users",
        "networkDevices",
        "ticketActivities",
        "currentUser",
        "systemSettings",
        "userSettings:lead@itsupport.local",
        "userSettings:technician@itsupport.local",
        "userSettings:user@itsupport.local"
    ];

    const ACTORS = {
        technical_lead: { email: "lead@itsupport.local", name: "Nguyễn Văn An", role: "technical_lead" },
        technician: { email: "technician@itsupport.local", name: "Trần Văn Bình", role: "technician" },
        user: { email: "user@itsupport.local", name: "Lê Minh Anh", role: "user" }
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function snapshotStorage() {
        const snapshot = {};
        TRACKED_KEYS.forEach(function (key) {
            snapshot[key] = window.localStorage.getItem(key);
        });
        return snapshot;
    }

    function restoreStorage(snapshot) {
        TRACKED_KEYS.forEach(function (key) {
            const value = snapshot[key];
            if (value === null || value === undefined) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, value);
            }
        });
    }

    function resetCoreData() {
        if (!window.AppSeedData || !window.AppStorage) {
            throw new Error("AppSeedData hoặc AppStorage chưa sẵn sàng.");
        }

        window.AppStorage.set("tickets", clone(window.AppSeedData.tickets));
        window.AppStorage.set("devices", clone(window.AppSeedData.devices));
        window.AppStorage.set("users", clone(window.AppSeedData.users));
        window.AppStorage.set("networkDevices", clone(window.AppSeedData.networkDevices));
        window.AppStorage.remove("ticketActivities");
        window.AppStorage.remove("systemSettings");
        window.AppStorage.remove("userSettings:lead@itsupport.local");
        window.AppStorage.remove("userSettings:technician@itsupport.local");
        window.AppStorage.remove("userSettings:user@itsupport.local");
        setActor("technical_lead");
    }

    function setActor(role) {
        const actor = ACTORS[role];
        if (!actor) {
            window.localStorage.removeItem("currentUser");
            return;
        }
        window.localStorage.setItem("currentUser", JSON.stringify(actor));
    }

    function createReporter() {
        const results = [];

        function check(group, name, condition, details) {
            results.push({
                group,
                name,
                result: condition ? "PASS" : "FAIL",
                details: details || ""
            });
        }

        return { results, check };
    }

    function addLegacyResults(reporter, group, report) {
        if (!report || !Array.isArray(report.results)) {
            reporter.check(group, "Regression runner trả về báo cáo", false, "Không có results array.");
            return;
        }

        report.results.forEach(function (item) {
            const passed = Object.prototype.hasOwnProperty.call(item, "pass")
                ? Boolean(item.pass)
                : item.result === "PASS";
            reporter.check(
                group,
                item.test || item.name || "Kiểm thử",
                passed,
                item.details || ""
            );
        });
    }

    function testAvailability(reporter) {
        const required = [
            "AppStorage",
            "AppPermissions",
            "AppAuth",
            "TicketStorage",
            "TicketAccess",
            "TicketActionPermissions",
            "TicketOperations",
            "TicketActivity",
            "TicketsIntegration",
            "DeviceStorage",
            "UserStorage",
            "NetworkStorage",
            "DashboardIntegration",
            "ReportsModule",
            "SettingsModule",
            "TicketRegression",
            "DeviceRegression",
            "UserRegression",
            "NetworkRegression"
        ];

        required.forEach(function (name) {
            reporter.check("Modules", name + " đã load", Boolean(window[name]));
        });

        reporter.check("Seed", "Ticket seed đầy đủ", Array.isArray(window.AppSeedData.tickets) && window.AppSeedData.tickets.length === 7);
        reporter.check("Seed", "Device seed đầy đủ", Array.isArray(window.AppSeedData.devices) && window.AppSeedData.devices.length === 8);
        reporter.check("Seed", "User seed đầy đủ", Array.isArray(window.AppSeedData.users) && window.AppSeedData.users.length === 8);
        reporter.check("Seed", "Network seed đầy đủ", Array.isArray(window.AppSeedData.networkDevices) && window.AppSeedData.networkDevices.length === 8);
    }

    function testAuth(reporter) {
        resetCoreData();

        const bad = window.AppAuth.authenticateDemoAccount("lead@itsupport.local", "sai-mat-khau");
        reporter.check("Auth", "Sai mật khẩu bị từ chối", bad.ok === false && bad.reason === "invalid_credentials", bad.reason);

        const valid = window.AppAuth.authenticateDemoAccount("lead@itsupport.local", "123456");
        reporter.check("Auth", "Lead đăng nhập hợp lệ", valid.ok === true && valid.user && valid.user.role === "technical_lead", valid.reason || "");

        const usersLocked = clone(window.AppSeedData.users);
        usersLocked.find(function (user) { return user.email === "lead@itsupport.local"; }).status = "locked";
        window.AppStorage.set("users", usersLocked);
        const locked = window.AppAuth.authenticateDemoAccount("lead@itsupport.local", "123456");
        reporter.check("Auth", "Tài khoản bị khóa không đăng nhập được", locked.ok === false && locked.reason === "account_locked", locked.reason);

        window.AppStorage.set("users", clone(window.AppSeedData.users));
        setActor("user");
        const usersDisabled = clone(window.AppSeedData.users);
        usersDisabled.find(function (user) { return user.email === "user@itsupport.local"; }).status = "disabled";
        window.AppStorage.set("users", usersDisabled);
        reporter.check("Auth", "Session bị vô hiệu khi user disabled", window.AppAuth.isValidSession() === false);

        window.AppStorage.set("users", clone(window.AppSeedData.users));
        window.localStorage.setItem("currentUser", JSON.stringify({ email: "lead@itsupport.local", name: "Stale Name", role: "technical_lead" }));
        const usersRenamed = clone(window.AppSeedData.users);
        usersRenamed.find(function (user) { return user.email === "lead@itsupport.local"; }).name = "Nguyễn Văn An Canonical";
        window.AppStorage.set("users", usersRenamed);
        const canonicalValid = window.AppAuth.isValidSession();
        const canonicalSession = window.AppAuth.getCurrentUser();
        reporter.check("Auth", "Session đồng bộ tên từ user directory", canonicalValid && canonicalSession.name === "Nguyễn Văn An Canonical", canonicalSession.name);

        window.localStorage.setItem("currentUser", JSON.stringify({ email: "lead@itsupport.local", name: "Nguyễn Văn An", role: "unknown_role" }));
        reporter.check("Auth", "Role không hợp lệ làm session invalid", window.AppAuth.isValidSession() === false);

        resetCoreData();
    }

    function testPermissions(reporter) {
        resetCoreData();

        setActor("technical_lead");
        reporter.check("Permissions", "Lead xem Reports", window.AppPermissions.hasPermission("reports") === true);
        reporter.check("Permissions", "Lead quản lý Users", window.AppPermissions.hasPermission("users") === true);

        setActor("technician");
        reporter.check("Permissions", "Technician xem Network", window.AppPermissions.hasPermission("network") === true);
        reporter.check("Permissions", "Technician không xem Users", window.AppPermissions.hasPermission("users") === false);
        reporter.check("Permissions", "Technician không xem Reports", window.AppPermissions.hasPermission("reports") === false);

        setActor("user");
        reporter.check("Permissions", "User xem Tickets", window.AppPermissions.hasPermission("tickets") === true);
        reporter.check("Permissions", "User xem Settings", window.AppPermissions.hasPermission("settings") === true);
        reporter.check("Permissions", "User không xem Devices", window.AppPermissions.hasPermission("devices") === false);
        reporter.check("Permissions", "User không xem Network", window.AppPermissions.hasPermission("network") === false);
    }

    function testTickets(reporter) {
        resetCoreData();
        addLegacyResults(reporter, "Ticket Regression", window.TicketRegression.run());
        resetCoreData();

        setActor("technical_lead");
        const invalidUserAssignee = window.TicketOperations.assignTicket("TKT-0001", "user@itsupport.local");
        reporter.check("Ticket Integrity", "Không phân công ticket cho user thường", invalidUserAssignee.ok === false && invalidUserAssignee.reason === "invalid_assignee", invalidUserAssignee.reason);

        const unknownAssignee = window.TicketOperations.assignTicket("TKT-0001", "ghost@itsupport.local");
        reporter.check("Ticket Integrity", "Không phân công cho email không tồn tại", unknownAssignee.ok === false && unknownAssignee.reason === "invalid_assignee", unknownAssignee.reason);

        const directInvalid = window.TicketStorage.assignTicket("TKT-0001", "user@itsupport.local");
        reporter.check("Ticket Integrity", "Storage boundary cũng chặn assignee không hợp lệ", directInvalid === null);

        const invalidDeviceCreate = window.TicketOperations.validateCreateTicket({
            id: "TKT-9999",
            title: "Regression invalid device",
            description: "Kiểm tra tham chiếu thiết bị.",
            category: "hardware",
            priority: "medium",
            status: "open",
            requesterEmail: "lead@itsupport.local",
            assigneeEmail: null,
            deviceId: "DEV-999",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            resolvedAt: null
        });
        reporter.check("Ticket Integrity", "Create ticket chặn device không tồn tại", invalidDeviceCreate.ok === false && invalidDeviceCreate.reason === "invalid_device", invalidDeviceCreate.reason);

        const invalidDeviceUpdate = window.TicketOperations.updateTicket("TKT-0001", { deviceId: "DEV-999" });
        reporter.check("Ticket Integrity", "Update ticket chặn device không tồn tại", invalidDeviceUpdate.ok === false && invalidDeviceUpdate.reason === "invalid_device", invalidDeviceUpdate.reason);

        const summary = window.TicketsIntegration.getTicketSummary(window.AppSeedData.tickets);
        reporter.check("Ticket Summary", "Phiếu mở tính cả reopened", summary.open === 2, JSON.stringify(summary));
        reporter.check("Ticket Summary", "Đang xử lý tính assigned + in_progress", summary.inProgress === 2, JSON.stringify(summary));
        reporter.check("Ticket Summary", "Đang chờ chỉ tính pending", summary.pending === 1, JSON.stringify(summary));
        reporter.check("Ticket Summary", "Đã giải quyết tính resolved + closed", summary.resolved === 2, JSON.stringify(summary));

        const validSettings = window.SettingsModule.saveSystemSettings({
            companyName: "TPCOMS IT Support",
            timezone: "Asia/Ho_Chi_Minh",
            language: "vi",
            defaultPriority: "high",
            slaHours: 8
        });
        reporter.check("Ticket Settings", "Lưu priority mặc định", validSettings.ok === true);
        reporter.check("Ticket Settings", "Create ticket đọc priority mặc định", window.TicketsIntegration.getDefaultPriority() === "high", window.TicketsIntegration.getDefaultPriority());
    }

    function testTicketPrivacy(reporter) {
        resetCoreData();

        window.AppStorage.set("ticketActivities", {
            "TKT-0001": [
                { id: "ACT-TKT-0001-0001", ticketId: "TKT-0001", type: "system", message: "System event", actorEmail: "lead@itsupport.local", actorName: "Nguyễn Văn An", actorRole: "technical_lead", createdAt: "2026-09-01T08:00:00", metadata: null },
                { id: "ACT-TKT-0001-0002", ticketId: "TKT-0001", type: "work_note", message: "Internal work note", actorEmail: "technician@itsupport.local", actorName: "Trần Văn Bình", actorRole: "technician", createdAt: "2026-09-01T08:05:00", metadata: null },
                { id: "ACT-TKT-0001-0003", ticketId: "TKT-0001", type: "comment", message: "Public comment", actorEmail: "user@itsupport.local", actorName: "Lê Minh Anh", actorRole: "user", createdAt: "2026-09-01T08:10:00", metadata: null }
            ]
        });

        setActor("user");
        const userActivities = window.TicketActivity.getTicketActivities("TKT-0001");
        reporter.check("Ticket Privacy", "User không đọc được work note", userActivities.every(function (item) { return item.type !== "work_note"; }), userActivities.map(function (item) { return item.type; }).join(","));
        reporter.check("Ticket Privacy", "getWorkNotes trả rỗng cho user", window.TicketActivity.getWorkNotes("TKT-0001").length === 0);
        reporter.check("Ticket Privacy", "User vẫn thấy system history", window.TicketActivity.getHistory("TKT-0001").some(function (item) { return item.type === "system"; }));

        setActor("technical_lead");
        reporter.check("Ticket Privacy", "Lead đọc được work note", window.TicketActivity.getWorkNotes("TKT-0001").length === 1);
    }

    function testDevices(reporter) {
        resetCoreData();
        addLegacyResults(reporter, "Device Regression", window.DeviceRegression.run());
        resetCoreData();

        setActor("technician");
        reporter.check("Device Integrity", "Gán active user hợp lệ", window.DeviceStorage.validateUserAssignment("user@itsupport.local").ok === true);
        reporter.check("Device Integrity", "Chặn user không tồn tại", window.DeviceStorage.validateUserAssignment("ghost@itsupport.local").reason === "invalid_user");
        reporter.check("Device Integrity", "Chặn user đang locked", window.DeviceStorage.validateUserAssignment("cuong.hoang@accounting.local").reason === "invalid_user");

        const invalidCreate = window.DeviceStorage.createDevice({
            id: "DEV-999",
            name: "REG-INVALID-USER",
            type: "laptop",
            status: "storage",
            userEmail: "ghost@itsupport.local",
            department: "Kỹ thuật",
            ipAddress: "192.168.250.10",
            serialNumber: "REG-INVALID-999",
            purchaseDate: "2026-09-01",
            notes: "Regression"
        });
        reporter.check("Device Integrity", "Storage CRUD chặn user assignment sai", invalidCreate.ok === false && invalidCreate.reason === "invalid_user", invalidCreate.reason);

        setActor("technical_lead");
        reporter.check("Cross Module", "DEV-001 có ticket liên kết", window.DeviceStorage.getLinkedTicketCount("DEV-001") > 0, String(window.DeviceStorage.getLinkedTicketCount("DEV-001")));
    }

    function testUsers(reporter) {
        resetCoreData();
        addLegacyResults(reporter, "User Regression", window.UserRegression.run());
        resetCoreData();

        setActor("technical_lead");
        const selfRole = window.UserStorage.updateUser("USR-001", { role: "technician" });
        reporter.check("User Integrity", "Lead không tự đổi role", selfRole.ok === false && selfRole.reason === "self_protection", selfRole.reason);

        const selfStatus = window.UserStorage.updateUser("USR-001", { status: "locked" });
        reporter.check("User Integrity", "Lead không tự khóa qua updateUser", selfStatus.ok === false && selfStatus.reason === "self_protection", selfStatus.reason);

        const regularUser = window.UserStorage.getUserByEmail("user@itsupport.local");
        const links = window.UserStorage.getUserLinks(regularUser);
        reporter.check("Cross Module", "User links đọc được ticket liên quan", links.tickets.length > 0, String(links.tickets.length));
        reporter.check("Cross Module", "User links đọc được device được gán", links.devices.length > 0, String(links.devices.length));
    }

    function testNetwork(reporter) {
        resetCoreData();
        addLegacyResults(reporter, "Network Regression", window.NetworkRegression.run());
    }

    function buildDashboardFixture() {
        const fixture = document.createElement("div");
        fixture.id = "regression-dashboard-fixture";
        fixture.hidden = true;
        fixture.innerHTML = [
            '<article class="dashboard__panel" data-test-panel="devices"><div class="device-card"><span data-dashboard="devices-total"></span></div></article>',
            '<article class="dashboard__panel" data-test-panel="system">',
            '<div class="device-card" data-test-card="users"><span data-dashboard="users-active"></span></div>',
            '<div class="device-card" data-test-card="network-online"><span data-dashboard="network-online"></span></div>',
            '<div class="device-card" data-test-card="network-alert"><span data-dashboard="network-alert"></span></div>',
            '</article>'
        ].join("");
        document.body.appendChild(fixture);
        return fixture;
    }

    function testDashboard(reporter) {
        resetCoreData();

        setActor("user");
        reporter.check("Dashboard", "User chỉ thấy ticket của mình", window.DashboardIntegration.getVisibleTickets().length === 4, String(window.DashboardIntegration.getVisibleTickets().length));
        setActor("technician");
        reporter.check("Dashboard", "Technician chỉ thấy ticket được giao", window.DashboardIntegration.getVisibleTickets().length === 5, String(window.DashboardIntegration.getVisibleTickets().length));
        setActor("technical_lead");
        reporter.check("Dashboard", "Lead thấy toàn bộ ticket", window.DashboardIntegration.getVisibleTickets().length === 7, String(window.DashboardIntegration.getVisibleTickets().length));

        const fixture = buildDashboardFixture();
        try {
            setActor("user");
            window.DashboardIntegration.applyMetricPermissions();
            reporter.check("Dashboard Permissions", "User không thấy device panel", fixture.querySelector('[data-test-panel="devices"]').hidden === true);
            reporter.check("Dashboard Permissions", "User không thấy system inventory panel", fixture.querySelector('[data-test-panel="system"]').hidden === true);

            setActor("technician");
            window.DashboardIntegration.applyMetricPermissions();
            reporter.check("Dashboard Permissions", "Technician thấy device panel", fixture.querySelector('[data-test-panel="devices"]').hidden === false);
            reporter.check("Dashboard Permissions", "Technician không thấy user metric", fixture.querySelector('[data-test-card="users"]').hidden === true);
            reporter.check("Dashboard Permissions", "Technician thấy network metric", fixture.querySelector('[data-test-card="network-online"]').hidden === false);

            setActor("technical_lead");
            window.DashboardIntegration.applyMetricPermissions();
            reporter.check("Dashboard Permissions", "Lead thấy user metric", fixture.querySelector('[data-test-card="users"]').hidden === false);
            reporter.check("Dashboard Permissions", "Lead thấy network metric", fixture.querySelector('[data-test-card="network-alert"]').hidden === false);
        } finally {
            fixture.remove();
        }
    }

    function buildReportFixture() {
        const fixture = document.createElement("div");
        fixture.id = "regression-report-fixture";
        fixture.hidden = true;
        fixture.innerHTML = [
            '<select id="report-range"><option value="all">All</option><option value="custom">Custom</option></select>',
            '<input id="report-from" type="date">',
            '<input id="report-to" type="date">'
        ].join("");
        document.body.appendChild(fixture);
        return fixture;
    }

    function testReports(reporter) {
        resetCoreData();

        const fixture = buildReportFixture();
        try {
            const range = fixture.querySelector("#report-range");
            const from = fixture.querySelector("#report-from");
            const to = fixture.querySelector("#report-to");
            range.value = "custom";
            from.value = "2026-09-03";
            to.value = "2026-09-01";
            const invalidRange = window.ReportsModule.resolveRange();
            reporter.check("Reports", "Chặn khoảng ngày đảo ngược", invalidRange.valid === false, invalidRange.message);

            from.value = "2026-08-15";
            to.value = "2026-08-21";
            const validRange = window.ReportsModule.resolveRange();
            reporter.check("Reports", "Custom date hợp lệ được chấp nhận", validRange.valid === true);
        } finally {
            fixture.remove();
        }

        const allFiltered = window.ReportsModule.filterTicketsByRange(window.AppSeedData.tickets, { from: null, to: null, valid: true });
        reporter.check("Reports", "All-time filter giữ đủ ticket", allFiltered.length === 7, String(allFiltered.length));

        const resolved = window.AppSeedData.tickets.filter(function (ticket) { return ticket.resolvedAt; });
        reporter.check("Reports", "Tính thời gian xử lý trung bình", window.ReportsModule.averageResolutionHours(resolved) > 0);
        reporter.check("Reports", "CSV chặn formula injection", window.ReportsModule.protectSpreadsheetFormula("=HYPERLINK(\"x\")").startsWith("'="));
        reporter.check("Reports", "CSV giữ text bình thường", window.ReportsModule.protectSpreadsheetFormula("TKT-0001") === "TKT-0001");
    }

    function testSettings(reporter) {
        resetCoreData();

        setActor("user");
        const denied = window.SettingsModule.saveSystemSettings({
            companyName: "Denied",
            timezone: "Asia/Ho_Chi_Minh",
            language: "vi",
            defaultPriority: "medium",
            slaHours: 8
        });
        reporter.check("Settings", "User không sửa system settings", denied.ok === false);

        const preference = window.SettingsModule.saveUserSettings({
            theme: "dark",
            notifyNewTicket: true,
            notifyAssigned: false,
            notifyUpdated: true,
            notifyEmail: false
        });
        reporter.check("Settings", "User lưu preference", preference.ok === true);
        reporter.check("Settings", "Preference đọc lại đúng", window.SettingsModule.getUserSettings().theme === "dark");

        setActor("technical_lead");
        const badTimezone = window.SettingsModule.saveSystemSettings({
            companyName: "TPCOMS IT Support",
            timezone: "Mars/Olympus",
            language: "vi",
            defaultPriority: "medium",
            slaHours: 8
        });
        reporter.check("Settings", "Chặn timezone ngoài danh sách", badTimezone.ok === false);

        const badSla = window.SettingsModule.saveSystemSettings({
            companyName: "TPCOMS IT Support",
            timezone: "Asia/Ho_Chi_Minh",
            language: "vi",
            defaultPriority: "medium",
            slaHours: 8.5
        });
        reporter.check("Settings", "SLA phải là số nguyên", badSla.ok === false);

        const valid = window.SettingsModule.saveSystemSettings({
            companyName: "TPCOMS IT Support Regression",
            timezone: "Asia/Ho_Chi_Minh",
            language: "vi",
            defaultPriority: "critical",
            slaHours: 12
        });
        reporter.check("Settings", "Lead lưu system settings hợp lệ", valid.ok === true, valid.message);
        reporter.check("Settings", "System settings đọc lại đúng", window.SettingsModule.getSystemSettings().defaultPriority === "critical");

        const renamed = window.SettingsModule.updateProfileName("Nguyễn Văn An Regression");
        const directoryLead = window.UserStorage.getUserByEmail("lead@itsupport.local");
        reporter.check("Settings", "Đổi tên cập nhật user directory", renamed.ok === true && directoryLead.name === "Nguyễn Văn An Regression", renamed.message);
        reporter.check("Settings", "Đổi tên cập nhật current session", window.AppAuth.getCurrentUser().name === "Nguyễn Văn An Regression", window.AppAuth.getCurrentUser().name);
    }

    function renderResults(report) {
        const tbody = document.getElementById("regression-results");
        const summary = document.getElementById("regression-summary");

        if (tbody) {
            tbody.replaceChildren();
            report.results.forEach(function (item) {
                const row = document.createElement("tr");
                [item.group, item.name, item.result, item.details].forEach(function (value, index) {
                    const cell = document.createElement("td");
                    cell.textContent = value || "";
                    if (index === 2) {
                        cell.className = item.result === "PASS" ? "pass" : "fail";
                    }
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
        }

        if (summary) {
            summary.textContent = "Full regression: " + (report.ok ? "PASS" : "FAIL") + " " + report.passed + "/" + report.total + " | FAIL: " + report.failed;
        }
    }

    function run() {
        const original = snapshotStorage();
        const reporter = createReporter();

        try {
            resetCoreData();
            testAvailability(reporter);
            testAuth(reporter);
            testPermissions(reporter);
            testTickets(reporter);
            testTicketPrivacy(reporter);
            testDevices(reporter);
            testUsers(reporter);
            testNetwork(reporter);
            testDashboard(reporter);
            testReports(reporter);
            testSettings(reporter);
        } catch (error) {
            reporter.check("Runner", "Không phát sinh exception", false, error && error.stack ? error.stack : String(error));
        } finally {
            restoreStorage(original);
        }

        const passed = reporter.results.filter(function (item) { return item.result === "PASS"; }).length;
        const failed = reporter.results.length - passed;
        const report = {
            ok: failed === 0,
            passed,
            failed,
            total: reporter.results.length,
            results: reporter.results
        };

        renderResults(report);
        if (typeof console.table === "function") {
            console.table(reporter.results);
        }
        console.log("Full regression: " + (report.ok ? "PASS" : "FAIL") + " " + passed + "/" + report.total);
        return report;
    }

    window.FullRegression = { run };

    function init() {
        const button = document.getElementById("run-full-regression");
        if (button) {
            button.addEventListener("click", run);
        }
        run();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
