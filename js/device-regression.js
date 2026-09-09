(function () {
    const STORAGE_KEYS = ["devices", "tickets", "currentUser"];

    function cloneStorage() {
        const snapshot = {};
        STORAGE_KEYS.forEach(function (key) {
            snapshot[key] = window.localStorage.getItem(key);
        });
        return snapshot;
    }

    function restoreStorage(snapshot) {
        STORAGE_KEYS.forEach(function (key) {
            const value = snapshot[key];
            if (value === null || value === undefined) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, value);
            }
        });
    }

    function setActor(role) {
        const accounts = {
            technical_lead: {
                email: "lead@itsupport.local",
                name: "Nguyễn Văn An",
                role: "technical_lead"
            },
            technician: {
                email: "technician@itsupport.local",
                name: "Trần Văn Bình",
                role: "technician"
            },
            user: {
                email: "user@itsupport.local",
                name: "Lê Minh Anh",
                role: "user"
            }
        };
        window.localStorage.setItem("currentUser", JSON.stringify(accounts[role]));
    }

    function run() {
        const snapshot = cloneStorage();
        const results = [];

        function check(name, condition, details) {
            results.push({
                name,
                result: condition ? "PASS" : "FAIL",
                details: details || ""
            });
        }

        try {
            if (!window.DeviceStorage) {
                throw new Error("DeviceStorage chưa được load.");
            }

            setActor("user");
            check("User không được quản lý thiết bị", DeviceStorage.canManageDevices() === false);

            setActor("technician");
            check("Technician được quản lý thiết bị", DeviceStorage.canManageDevices() === true);
            check("Technician không được xóa thiết bị", DeviceStorage.canDeleteDevices() === false);

            const testId = DeviceStorage.generateNextDeviceId();
            const createResult = DeviceStorage.createDevice({
                id: testId,
                name: "REGRESSION-DEVICE",
                type: "laptop",
                status: "storage",
                userEmail: "",
                department: "Kỹ thuật",
                ipAddress: "192.168.99.50",
                serialNumber: "REG-DEVICE-001",
                purchaseDate: "2026-09-01",
                notes: "Thiết bị phục vụ regression test."
            });
            check("Technician tạo thiết bị", createResult.ok === true, createResult.reason);
            check("Thiết bị được lưu", Boolean(DeviceStorage.getDeviceById(testId)));

            const updateResult = DeviceStorage.updateDevice(testId, {
                name: "REGRESSION-DEVICE-UPDATED",
                status: "maintenance"
            });
            check(
                "Technician cập nhật thiết bị",
                updateResult.ok === true && updateResult.data.status === "maintenance",
                updateResult.reason
            );

            const invalidIpResult = DeviceStorage.updateDevice(testId, {
                ipAddress: "999.10.10.10"
            });
            check("IPv4 sai bị chặn", invalidIpResult.ok === false && invalidIpResult.reason === "invalid_ip");

            setActor("technical_lead");
            check("Lead được xóa thiết bị", DeviceStorage.canDeleteDevices() === true);
            const deleteResult = DeviceStorage.deleteDevice(testId);
            check("Lead xóa thiết bị không liên kết ticket", deleteResult.ok === true, deleteResult.reason);
            check("Thiết bị đã bị xóa", DeviceStorage.getDeviceById(testId) === null);

            const linkedDelete = DeviceStorage.deleteDevice("DEV-001");
            check(
                "Không xóa thiết bị đang liên kết ticket",
                linkedDelete.ok === false && linkedDelete.reason === "device_in_use",
                linkedDelete.reason
            );
        } catch (error) {
            results.push({
                name: "Regression runner",
                result: "FAIL",
                details: error.message
            });
        } finally {
            restoreStorage(snapshot);
        }

        const passed = results.filter(function (item) {
            return item.result === "PASS";
        }).length;
        const failed = results.length - passed;
        const output = {
            ok: failed === 0,
            passed,
            failed,
            total: results.length,
            results
        };

        console.table(results);
        console.log("Device regression: " + (output.ok ? "PASS" : "FAIL") + " " + passed + "/" + results.length);
        return output;
    }

    window.DeviceRegression = { run };
})();
