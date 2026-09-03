(function () {
    function setFeedback(message, isError) {
        const element = document.getElementById("device-feedback");
        if (!element) {
            return;
        }

        element.textContent = message || "";
        element.hidden = !message;
        element.dataset.state = isError ? "error" : "success";
    }

    function normalizeEmail(value) {
        return typeof value === "string" ? value.trim().toLowerCase() : "";
    }

    function getDirectoryUser(email) {
        const target = normalizeEmail(email);
        if (!target) {
            return null;
        }

        if (window.UserStorage && typeof window.UserStorage.getUserByEmail === "function") {
            return window.UserStorage.getUserByEmail(target);
        }

        if (!window.AppStorage || typeof window.AppStorage.get !== "function") {
            return null;
        }

        const users = window.AppStorage.get("users", []);
        return Array.isArray(users)
            ? users.find(function (user) {
                return user && normalizeEmail(user.email) === target;
            }) || null
            : null;
    }

    function validateUserAssignment(email) {
        const normalized = normalizeEmail(email);
        if (!normalized) {
            return { ok: true, reason: null, message: "Không gán người sử dụng." };
        }

        const user = getDirectoryUser(normalized);
        if (!user) {
            return { ok: false, reason: "invalid_user", message: "Người sử dụng không tồn tại trong danh sách tài khoản." };
        }

        if (user.status !== "active") {
            return { ok: false, reason: "invalid_user", message: "Không thể gán thiết bị cho tài khoản đang khóa hoặc bị vô hiệu hóa." };
        }

        return { ok: true, reason: null, message: "Người sử dụng hợp lệ.", data: user };
    }

    function patchDeviceStorage() {
        if (
            !window.DeviceStorage ||
            window.DeviceStorage.__userAssignmentPatched ||
            typeof window.DeviceStorage.createDevice !== "function" ||
            typeof window.DeviceStorage.updateDevice !== "function"
        ) {
            return;
        }

        const originalCreateDevice = window.DeviceStorage.createDevice;
        const originalUpdateDevice = window.DeviceStorage.updateDevice;

        window.DeviceStorage.createDevice = function (device) {
            const validation = validateUserAssignment(device && device.userEmail);
            if (!validation.ok) {
                return { ok: false, reason: validation.reason, message: validation.message, data: null };
            }
            return originalCreateDevice(device);
        };

        window.DeviceStorage.updateDevice = function (id, changes) {
            if (changes && Object.prototype.hasOwnProperty.call(changes, "userEmail")) {
                const validation = validateUserAssignment(changes.userEmail);
                if (!validation.ok) {
                    return { ok: false, reason: validation.reason, message: validation.message, data: null };
                }
            }
            return originalUpdateDevice(id, changes);
        };

        window.DeviceStorage.validateUserAssignment = validateUserAssignment;
        window.DeviceStorage.__userAssignmentPatched = true;
    }

    function handleDeviceFormSubmit(event) {
        const form = event.target.closest("#device-form");
        if (!form) {
            return;
        }

        const email = form.elements.userEmail ? form.elements.userEmail.value : "";
        const validation = validateUserAssignment(email);
        if (validation.ok) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        setFeedback(validation.message, true);
        window.alert(validation.message);
    }

    function scrollPanelIntoView(id) {
        const panel = document.getElementById(id);
        if (panel && !panel.hidden) {
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function showDeleteError(message) {
        setFeedback(message, true);
        const feedback = document.getElementById("device-feedback");
        if (feedback) {
            feedback.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        window.alert(message);
    }

    function handleDeviceAction(event) {
        const button = event.target.closest("button[data-action][data-device-id]");
        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const deviceId = button.dataset.deviceId;

        if (!["view-device", "edit-device", "delete-device"].includes(action)) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        if (!window.DevicesPage || !window.DeviceStorage) {
            setFeedback("Chức năng thiết bị chưa sẵn sàng.", true);
            return;
        }

        if (action === "view-device") {
            window.DevicesPage.showDeviceDetail(deviceId);
            scrollPanelIntoView("device-detail-panel");
            return;
        }

        if (action === "edit-device") {
            window.DevicesPage.openEditEditor(deviceId);
            scrollPanelIntoView("device-editor-panel");
            return;
        }

        if (action === "delete-device") {
            const device = window.DeviceStorage.getDeviceById(deviceId);
            if (!device) {
                showDeleteError("Không tìm thấy thiết bị.");
                return;
            }

            const linkedTicketCount = typeof window.DeviceStorage.getLinkedTicketCount === "function"
                ? window.DeviceStorage.getLinkedTicketCount(deviceId)
                : 0;

            if (linkedTicketCount > 0) {
                showDeleteError(
                    "Không thể xóa " + deviceId + " vì thiết bị đang được liên kết với " +
                    linkedTicketCount + " phiếu hỗ trợ."
                );
                return;
            }

            const confirmed = window.confirm(
                "Xóa thiết bị " + deviceId + " - " + (device.name || "") + "?"
            );

            if (!confirmed) {
                return;
            }

            const result = window.DeviceStorage.deleteDevice(deviceId);
            if (!result.ok) {
                showDeleteError(result.message);
                return;
            }

            if (window.DevicesPage && typeof window.DevicesPage.renderAll === "function") {
                window.DevicesPage.renderAll();
            }
            setFeedback(result.message, false);
        }
    }

    function handleCreateButton(event) {
        const button = event.target.closest('[data-action="open-create-device"]');
        if (!button) {
            return;
        }

        const idInput = document.getElementById("device-id");
        if (idInput) {
            idInput.readOnly = false;
        }
    }

    patchDeviceStorage();
    document.addEventListener("submit", handleDeviceFormSubmit, true);
    document.addEventListener("click", handleCreateButton, true);
    document.addEventListener("click", handleDeviceAction, true);
})();
