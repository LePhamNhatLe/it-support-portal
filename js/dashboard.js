(function () {
    const STATUS_LABELS = {
        open: "Mở",
        assigned: "Đã phân công",
        in_progress: "Đang xử lý",
        pending: "Chờ",
        resolved: "Đã giải quyết",
        closed: "Đã đóng",
        reopened: "Mở lại"
    };

    const PRIORITY_LABELS = {
        low: "Thấp",
        medium: "Trung bình",
        high: "Cao",
        critical: "Khẩn cấp"
    };

    function read(key) {
        if (!window.AppStorage || typeof window.AppStorage.get !== "function") return [];
        const value = window.AppStorage.get(key, []);
        return Array.isArray(value) ? value : [];
    }

    function hasPermission(permission) {
        return Boolean(
            window.AppPermissions &&
            typeof window.AppPermissions.hasPermission === "function" &&
            window.AppPermissions.hasPermission(permission)
        );
    }

    function getVisibleTickets() {
        if (window.TicketAccess && typeof window.TicketAccess.getVisibleTickets === "function") {
            return window.TicketAccess.getVisibleTickets();
        }
        if (window.TicketStorage && typeof window.TicketStorage.getTickets === "function") {
            return window.TicketStorage.getTickets();
        }
        return read("tickets");
    }

    function countBy(items, key, value) {
        return items.filter(function (item) { return item && item[key] === value; }).length;
    }

    function setText(selector, value) {
        const element = document.querySelector(selector);
        if (element) element.textContent = String(value);
    }

    function setMetricCardVisibility(metricKey, visible) {
        const metric = document.querySelector('[data-dashboard="' + metricKey + '"]');
        const card = metric ? metric.closest(".device-card") : null;
        if (card) {
            card.hidden = !visible;
        }
    }

    function applyMetricPermissions() {
        const canViewDevices = hasPermission("devices");
        const canViewUsers = hasPermission("users");
        const canViewNetwork = hasPermission("network");

        const deviceMetric = document.querySelector('[data-dashboard="devices-total"]');
        const devicePanel = deviceMetric ? deviceMetric.closest(".dashboard__panel") : null;
        if (devicePanel) {
            devicePanel.hidden = !canViewDevices;
        }

        setMetricCardVisibility("users-active", canViewUsers);
        setMetricCardVisibility("network-online", canViewNetwork);
        setMetricCardVisibility("network-alert", canViewNetwork);

        const systemMetric = document.querySelector('[data-dashboard="users-active"]');
        const systemPanel = systemMetric ? systemMetric.closest(".dashboard__panel") : null;
        if (systemPanel) {
            systemPanel.hidden = !canViewUsers && !canViewNetwork;
        }

        return { canViewDevices, canViewUsers, canViewNetwork };
    }

    function renderMetrics() {
        const tickets = getVisibleTickets();
        const devices = read("devices");
        const users = read("users");
        const network = read("networkDevices");

        setText('[data-dashboard="tickets-total"]', tickets.length);
        setText('[data-dashboard="tickets-open"]', countBy(tickets, "status", "open") + countBy(tickets, "status", "reopened"));
        setText('[data-dashboard="tickets-processing"]', countBy(tickets, "status", "assigned") + countBy(tickets, "status", "in_progress") + countBy(tickets, "status", "pending"));
        setText('[data-dashboard="tickets-resolved"]', countBy(tickets, "status", "resolved") + countBy(tickets, "status", "closed"));
        setText('[data-dashboard="devices-total"]', devices.length);
        setText('[data-dashboard="devices-in-use"]', countBy(devices, "status", "in_use"));
        setText('[data-dashboard="devices-maintenance"]', countBy(devices, "status", "maintenance"));
        setText('[data-dashboard="devices-retired"]', countBy(devices, "status", "retired"));
        setText('[data-dashboard="users-active"]', countBy(users, "status", "active"));
        setText('[data-dashboard="network-online"]', countBy(network, "status", "online"));
        setText('[data-dashboard="network-alert"]', countBy(network, "status", "warning") + countBy(network, "status", "offline") + countBy(network, "status", "maintenance"));

        return { tickets, devices, users, network };
    }

    function renderRecentTickets(tickets) {
        const tbody = document.getElementById("dashboard-recent-tickets");
        if (!tbody) return;
        const latest = tickets.slice().sort(function (a, b) {
            return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
        }).slice(0, 5);
        tbody.replaceChildren();

        latest.forEach(function (ticket) {
            const row = document.createElement("tr");
            const values = [
                ticket.id || "-",
                ticket.title || "Không có tiêu đề",
                PRIORITY_LABELS[ticket.priority] || ticket.priority || "-",
                STATUS_LABELS[ticket.status] || ticket.status || "-",
                ticket.assigneeEmail || "Chưa phân công"
            ];
            values.forEach(function (value) {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });

        const empty = document.getElementById("dashboard-ticket-empty");
        if (empty) empty.hidden = latest.length !== 0;
    }

    function render() {
        const data = renderMetrics();
        renderRecentTickets(data.tickets);
        applyMetricPermissions();
        return data;
    }

    window.DashboardIntegration = {
        render,
        getVisibleTickets,
        applyMetricPermissions
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render); else render();
})();
