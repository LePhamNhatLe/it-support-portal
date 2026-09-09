(function () {
    function snapshotStorage() {
        return {
            users: localStorage.getItem("users"),
            currentUser: localStorage.getItem("currentUser")
        };
    }

    function restoreStorage(snapshot) {
        if (snapshot.users === null) localStorage.removeItem("users"); else localStorage.setItem("users", snapshot.users);
        if (snapshot.currentUser === null) localStorage.removeItem("currentUser"); else localStorage.setItem("currentUser", snapshot.currentUser);
    }

    function setLeadSession() {
        localStorage.setItem("currentUser", JSON.stringify({
            email: "lead@itsupport.local",
            name: "Nguyễn Văn An",
            role: "technical_lead"
        }));
    }

    function run() {
        const snapshot = snapshotStorage();
        const results = [];
        function check(name, condition, details) {
            results.push({ test: name, result: condition ? "PASS" : "FAIL", details: details || "" });
            return condition;
        }

        try {
            setLeadSession();
            if (!window.UserStorage) throw new Error("UserStorage chưa sẵn sàng.");

            const testId = "USR-999";
            const testEmail = "regression.user@itsupport.local";
            const existing = UserStorage.getUserById(testId);
            if (existing) {
                const users = UserStorage.getUsers().filter(function (user) { return user.id !== testId; });
                UserStorage.saveUsers(users);
            }

            check("Seed users tồn tại", UserStorage.getUsers().length >= 3);
            check("Validate email sai", UserStorage.validateUser({ id: testId, name: "Regression User", email: "bad-email", department: "Khác", role: "user", phone: "", status: "active" }, true).ok === false);

            const created = UserStorage.createUser({
                id: testId,
                name: "Regression User",
                email: testEmail,
                department: "Khác",
                role: "user",
                phone: "0909999999",
                status: "active"
            });
            check("Tạo user", created.ok === true, created.message);
            check("Không cho email trùng", UserStorage.createUser({
                id: "USR-998",
                name: "Duplicate Email",
                email: testEmail,
                department: "Khác",
                role: "user",
                phone: "",
                status: "active"
            }).reason === "duplicate_email");

            const updated = UserStorage.updateUser(testId, { name: "Regression Updated", role: "technician", department: "Kỹ thuật", status: "active" });
            check("Cập nhật user", updated.ok === true && updated.data.role === "technician", updated.message);

            const locked = UserStorage.changeUserStatus(testId, "locked");
            check("Khóa user", locked.ok === true && locked.data.status === "locked", locked.message);
            const unlocked = UserStorage.changeUserStatus(testId, "active");
            check("Mở khóa user", unlocked.ok === true && unlocked.data.status === "active", unlocked.message);

            const links = UserStorage.getUserLinks(UserStorage.getUserById(testId));
            check("Đếm liên kết", Array.isArray(links.tickets) && Array.isArray(links.devices));

            const deleted = UserStorage.deleteUser(testId);
            check("Xóa user không liên kết", deleted.ok === true, deleted.message);
            check("User đã biến mất", UserStorage.getUserById(testId) === null);

            const selfLock = UserStorage.changeUserStatus("USR-001", "locked");
            check("Bảo vệ tài khoản đang đăng nhập", selfLock.reason === "self_protection", selfLock.message);
        } catch (error) {
            results.push({ test: "Runner", result: "FAIL", details: error.message });
        } finally {
            restoreStorage(snapshot);
        }

        const passed = results.filter(function (item) { return item.result === "PASS"; }).length;
        const failed = results.length - passed;
        console.table(results);
        console.log("User regression: " + (failed === 0 ? "PASS" : "FAIL") + " " + passed + "/" + results.length);
        return { ok: failed === 0, passed, failed, total: results.length, results };
    }

    window.UserRegression = { run };
})();
