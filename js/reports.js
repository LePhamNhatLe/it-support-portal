(function () {
    const STATUS_LABELS = { open: "Mở", assigned: "Đã phân công", in_progress: "Đang xử lý", pending: "Chờ", resolved: "Đã giải quyết", closed: "Đã đóng", reopened: "Mở lại" };
    const PRIORITY_LABELS = { low: "Thấp", medium: "Trung bình", high: "Cao", critical: "Khẩn cấp" };
    const CATEGORY_LABELS = { hardware: "Phần cứng", software: "Phần mềm", network: "Mạng", account: "Tài khoản", printer: "Máy in", other: "Khác" };

    function read(key) {
        if (!window.AppStorage || typeof window.AppStorage.get !== "function") return [];
        const value = window.AppStorage.get(key, []);
        return Array.isArray(value) ? value : [];
    }

    function parseDate(value) {
        const date = new Date(value || "");
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function startOfDay(date) {
        const copy = new Date(date);
        copy.setHours(0, 0, 0, 0);
        return copy;
    }

    function endOfDay(date) {
        const copy = new Date(date);
        copy.setHours(23, 59, 59, 999);
        return copy;
    }

    function resolveRange() {
        const select = document.getElementById("report-range");
        const fromInput = document.getElementById("report-from");
        const toInput = document.getElementById("report-to");
        const value = select ? select.value : "all";
        const now = new Date();
        let from = null;
        let to = endOfDay(now);

        if (value === "today") from = startOfDay(now);
        else if (value === "7") { from = startOfDay(now); from.setDate(from.getDate() - 6); }
        else if (value === "30") { from = startOfDay(now); from.setDate(from.getDate() - 29); }
        else if (value === "90") { from = startOfDay(now); from.setDate(from.getDate() - 89); }
        else if (value === "custom") {
            from = fromInput && fromInput.value ? startOfDay(new Date(fromInput.value + "T00:00:00")) : null;
            to = toInput && toInput.value ? endOfDay(new Date(toInput.value + "T00:00:00")) : null;
        } else {
            to = null;
        }

        const valid = !(from && to && from > to);
        return {
            from,
            to,
            valid,
            message: valid ? "" : "Từ ngày không được lớn hơn Đến ngày."
        };
    }

    function filterTicketsByRange(tickets, range) {
        if (!range || range.valid === false) return [];
        return tickets.filter(function (ticket) {
            const created = parseDate(ticket && ticket.createdAt);
            if (!created) return false;
            if (range.from && created < range.from) return false;
            if (range.to && created > range.to) return false;
            return true;
        });
    }

    function countBy(items, field) {
        return items.reduce(function (result, item) {
            const key = item && item[field] ? item[field] : "unknown";
            result[key] = (result[key] || 0) + 1;
            return result;
        }, {});
    }

    function percent(part, total) {
        return total ? Math.round((part / total) * 100) + "%" : "0%";
    }

    function averageResolutionHours(tickets) {
        const values = tickets.map(function (ticket) {
            const created = parseDate(ticket.createdAt);
            const resolved = parseDate(ticket.resolvedAt);
            if (!created || !resolved || resolved < created) return null;
            return (resolved - created) / 3600000;
        }).filter(function (value) { return typeof value === "number"; });
        if (!values.length) return 0;
        return values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
    }

    function setText(selector, value) {
        const element = document.querySelector(selector);
        if (element) element.textContent = String(value);
    }

    function renderDistribution(containerId, counts, labels) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.replaceChildren();
        const entries = Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; });
        if (!entries.length) {
            const p = document.createElement("p"); p.textContent = "Không có dữ liệu."; container.appendChild(p); return;
        }
        entries.forEach(function (entry) {
            const row = document.createElement("div"); row.className = "report-category-item";
            const label = document.createElement("span"); label.textContent = labels[entry[0]] || entry[0];
            const value = document.createElement("strong"); value.textContent = String(entry[1]);
            row.append(label, value); container.appendChild(row);
        });
    }

    function renderDeviceReport(devices, network) {
        const inUse = devices.filter(function (d) { return d.status === "in_use"; }).length;
        const maintenance = devices.filter(function (d) { return d.status === "maintenance"; }).length;
        const retired = devices.filter(function (d) { return d.status === "retired"; }).length;
        setText('[data-report="devices-total"]', devices.length);
        setText('[data-report="devices-in-use"]', inUse);
        setText('[data-report="devices-maintenance"]', maintenance);
        setText('[data-report="devices-retired"]', retired);
        setText('[data-report="network-total"]', network.length);
        setText('[data-report="network-online"]', network.filter(function (d) { return d.status === "online"; }).length);
        setText('[data-report="network-issues"]', network.filter(function (d) { return d.status === "offline" || d.status === "warning" || d.status === "maintenance"; }).length);
    }

    function renderPerformance(tickets, users) {
        const tbody = document.getElementById("report-performance-body");
        if (!tbody) return;
        tbody.replaceChildren();
        const technicians = users.filter(function (user) { return user.role === "technician" || user.role === "technical_lead"; });
        technicians.forEach(function (user) {
            const assigned = tickets.filter(function (ticket) { return String(ticket.assigneeEmail || "").toLowerCase() === String(user.email || "").toLowerCase(); });
            const resolved = assigned.filter(function (ticket) { return ticket.status === "resolved" || ticket.status === "closed"; });
            const processing = assigned.filter(function (ticket) { return ["assigned", "in_progress", "pending"].includes(ticket.status); }).length;
            const avg = averageResolutionHours(resolved);
            const row = document.createElement("tr");
            [user.name || user.email, assigned.length, resolved.length, processing, avg ? avg.toFixed(1) + " giờ" : "-"].forEach(function (value) {
                const cell = document.createElement("td"); cell.textContent = String(value); row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
    }

    function render() {
        const allTickets = read("tickets");
        const range = resolveRange();
        const tickets = filterTicketsByRange(allTickets, range);
        const devices = read("devices");
        const network = read("networkDevices");
        const users = read("users");
        const resolved = tickets.filter(function (ticket) { return ticket.status === "resolved" || ticket.status === "closed"; });
        const processing = tickets.filter(function (ticket) { return ["assigned", "in_progress", "pending"].includes(ticket.status); });
        const avgHours = averageResolutionHours(resolved);

        setText('[data-report="tickets-total"]', tickets.length);
        setText('[data-report="tickets-resolved"]', resolved.length);
        setText('[data-report="tickets-resolved-rate"]', percent(resolved.length, tickets.length));
        setText('[data-report="tickets-processing"]', processing.length);
        setText('[data-report="tickets-processing-rate"]', percent(processing.length, tickets.length));
        setText('[data-report="avg-resolution"]', avgHours ? avgHours.toFixed(1) + " giờ" : "-");

        renderDistribution("report-status-list", countBy(tickets, "status"), STATUS_LABELS);
        renderDistribution("report-priority-list", countBy(tickets, "priority"), PRIORITY_LABELS);
        renderDistribution("report-category-list", countBy(tickets, "category"), CATEGORY_LABELS);
        renderDeviceReport(devices, network);
        renderPerformance(tickets, users);

        return { tickets, devices, network, users, range };
    }

    function applyFilters() {
        const range = resolveRange();
        if (!range.valid) {
            window.alert(range.message);
            return false;
        }
        render();
        return true;
    }

    function resetFilters() {
        const range = document.getElementById("report-range");
        const from = document.getElementById("report-from");
        const to = document.getElementById("report-to");
        if (range) range.value = "all";
        if (from) from.value = "";
        if (to) to.value = "";
        render();
    }

    function protectSpreadsheetFormula(value) {
        const text = String(value == null ? "" : value);
        return /^[\t\r ]*[=+\-@]/.test(text) ? "'" + text : text;
    }

    function escapeCsv(value) {
        const text = protectSpreadsheetFormula(value);
        return '"' + text.replace(/"/g, '""') + '"';
    }

    function exportCsv() {
        const range = resolveRange();
        if (!range.valid) {
            window.alert(range.message);
            return false;
        }

        const data = render();
        const rows = [["Mã phiếu", "Tiêu đề", "Danh mục", "Ưu tiên", "Trạng thái", "Người yêu cầu", "Người phụ trách", "Ngày tạo", "Ngày giải quyết"]];
        data.tickets.forEach(function (ticket) {
            rows.push([ticket.id, ticket.title, CATEGORY_LABELS[ticket.category] || ticket.category, PRIORITY_LABELS[ticket.priority] || ticket.priority, STATUS_LABELS[ticket.status] || ticket.status, ticket.requesterEmail, ticket.assigneeEmail || "", ticket.createdAt || "", ticket.resolvedAt || ""]);
        });
        const csv = "\uFEFF" + rows.map(function (row) { return row.map(escapeCsv).join(","); }).join("\r\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "it-support-report.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
        window.alert("Đã xuất báo cáo CSV.");
        return true;
    }

    function init() {
        document.getElementById("report-apply")?.addEventListener("click", applyFilters);
        document.getElementById("report-reset")?.addEventListener("click", resetFilters);
        document.getElementById("report-export")?.addEventListener("click", exportCsv);
        document.getElementById("report-print")?.addEventListener("click", function () { window.print(); });
        render();
    }

    window.ReportsModule = {
        render,
        applyFilters,
        exportCsv,
        resetFilters,
        resolveRange,
        filterTicketsByRange,
        averageResolutionHours,
        protectSpreadsheetFormula,
        escapeCsv
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
