(function () {
    function setCurrentUser(user) {
        window.localStorage.setItem("currentUser", JSON.stringify(user));
    }

    function run() {
        const originalNetwork = window.localStorage.getItem("networkDevices");
        const originalUser = window.localStorage.getItem("currentUser");
        const results = [];

        function test(name, condition, details) {
            results.push({ test: name, result: condition ? "PASS" : "FAIL", details: details || "" });
        }

        try {
            if (!window.NetworkStorage || !window.NetworkPage) {
                throw new Error("Network module chưa được load.");
            }

            const lead = { email: "lead@itsupport.local", name: "Nguyễn Văn An", role: "technical_lead" };
            const technician = { email: "technician@itsupport.local", name: "Trần Văn Bình", role: "technician" };

            setCurrentUser(technician);
            const testId = window.NetworkStorage.generateNextNetworkId();
            const payload = {
                id: testId,
                name: "SW-REGRESSION-01",
                type: "switch",
                ipAddress: "172.31.250.10",
                macAddress: "02:AA:BB:CC:DD:10",
                area: "Phòng kỹ thuật",
                status: "online",
                vlan: 250,
                subnet: "172.31.250.0/24",
                gateway: "172.31.250.1",
                managementUrl: "",
                uptimeHours: 24,
                notes: "Regression test"
            };

            test("Technician can manage network", window.NetworkStorage.canManageNetwork() === true);
            test("Technician cannot delete network", window.NetworkStorage.canDeleteNetwork() === false);

            const invalidIp = window.NetworkStorage.validateNetworkDevice({ ...payload, ipAddress: "999.1.1.1" }, true);
            test("Reject invalid IPv4", invalidIp.ok === false && invalidIp.reason === "invalid_ip", invalidIp.reason);

            const invalidMac = window.NetworkStorage.validateNetworkDevice({ ...payload, macAddress: "BAD-MAC" }, true);
            test("Reject invalid MAC", invalidMac.ok === false && invalidMac.reason === "invalid_mac", invalidMac.reason);

            const invalidVlan = window.NetworkStorage.validateNetworkDevice({ ...payload, vlan: 5000 }, true);
            test("Reject invalid VLAN", invalidVlan.ok === false && invalidVlan.reason === "invalid_vlan", invalidVlan.reason);

            const invalidSubnet = window.NetworkStorage.validateNetworkDevice({ ...payload, subnet: "172.31.250.0/99" }, true);
            test("Reject invalid CIDR", invalidSubnet.ok === false && invalidSubnet.reason === "invalid_subnet", invalidSubnet.reason);

            const created = window.NetworkStorage.createNetworkDevice(payload);
            test("Technician creates network device", created.ok === true, created.reason);
            test("Created device can be read", Boolean(window.NetworkStorage.getNetworkDeviceById(testId)));

            const duplicateAddress = window.NetworkStorage.createNetworkDevice({ ...payload, id: "NET-9999", name: "DUPLICATE" });
            test("Reject duplicate IP/MAC", duplicateAddress.ok === false && duplicateAddress.reason === "duplicate_address", duplicateAddress.reason);

            const updated = window.NetworkStorage.updateNetworkDevice(testId, { ...payload, status: "warning", uptimeHours: 48, notes: "Updated" });
            test("Technician updates network device", updated.ok === true && updated.data.status === "warning", updated.reason);

            const filtered = window.NetworkPage.filterNetworkDevices(window.NetworkStorage.getNetworkDevices(), { query: "172.31.250.10", type: "switch", status: "warning", area: "Phòng kỹ thuật" });
            test("Search and filters find test device", filtered.some(function (device) { return device.id === testId; }));

            const techDelete = window.NetworkStorage.deleteNetworkDevice(testId);
            test("Technician delete is blocked", techDelete.ok === false && techDelete.reason === "forbidden", techDelete.reason);

            setCurrentUser(lead);
            test("Lead can delete network", window.NetworkStorage.canDeleteNetwork() === true);
            const deleted = window.NetworkStorage.deleteNetworkDevice(testId);
            test("Lead deletes network device", deleted.ok === true, deleted.reason);
            test("Deleted device is gone", window.NetworkStorage.getNetworkDeviceById(testId) === null);
        } catch (error) {
            results.push({ test: "Regression runner", result: "FAIL", details: error.message });
        } finally {
            if (originalNetwork === null) window.localStorage.removeItem("networkDevices");
            else window.localStorage.setItem("networkDevices", originalNetwork);

            if (originalUser === null) window.localStorage.removeItem("currentUser");
            else window.localStorage.setItem("currentUser", originalUser);

            if (window.NetworkPage && typeof window.NetworkPage.renderAll === "function") {
                window.NetworkPage.renderAll();
            }
        }

        const passed = results.filter(function (item) { return item.result === "PASS"; }).length;
        const failed = results.length - passed;
        console.table(results);
        console.log("Network regression: " + (failed === 0 ? "PASS" : "FAIL") + " " + passed + "/" + results.length);
        return { ok: failed === 0, passed: passed, failed: failed, total: results.length, results: results };
    }

    window.NetworkRegression = { run: run };
})();
