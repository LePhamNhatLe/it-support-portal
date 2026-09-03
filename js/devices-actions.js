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

    function scrollPanelIntoView(id) {
        const panel = document.getElementById(id);
        if (panel && !panel.hidden) {
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
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
                setFeedback("Không tìm thấy thiết bị.", true);
                return;
            }

            const confirmed = window.confirm(
                "Xóa thiết bị " + deviceId + " - " + (device.name || "") + "?"
            );

            if (!confirmed) {
                return;
            }

            const result = window.DeviceStorage.deleteDevice(deviceId);
            if (window.DevicesPage && typeof window.DevicesPage.renderAll === "function") {
                window.DevicesPage.renderAll();
            }
            setFeedback(result.message, !result.ok);
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

    document.addEventListener("click", handleCreateButton, true);
    document.addEventListener("click", handleDeviceAction, true);
})();
