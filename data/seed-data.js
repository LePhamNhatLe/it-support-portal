const seedTickets = [
    {
        id: "TKT-0001",
        title: "Không kết nối được WiFi tại văn phòng",
        description: "Laptop không thể kết nối vào mạng WiFi của văn phòng trong phòng họp.",
        category: "network",
        priority: "high",
        status: "open",
        requesterEmail: "user@itsupport.local",
        assigneeEmail: null,
        deviceId: "DEV-001",
        createdAt: "2026-08-21T08:00:00",
        updatedAt: "2026-08-21T08:00:00",
        resolvedAt: null
    },
    {
        id: "TKT-0002",
        title: "Máy tính khởi động chậm",
        description: "Máy tính để mất khoảng 10 phút để khởi động xong và có thể sử dụng bình thường.",
        category: "hardware",
        priority: "medium",
        status: "assigned",
        requesterEmail: "lead@itsupport.local",
        assigneeEmail: "technician@itsupport.local",
        deviceId: "DEV-002",
        createdAt: "2026-08-20T09:30:00",
        updatedAt: "2026-08-20T10:15:00",
        resolvedAt: null
    },
    {
        id: "TKT-0003",
        title: "Máy in không nhận lệnh in",
        description: "Máy in bộ phận kế toán đang offline và không nhận lệnh in từ các máy trạm.",
        category: "printer",
        priority: "high",
        status: "in_progress",
        requesterEmail: "user@itsupport.local",
        assigneeEmail: "technician@itsupport.local",
        deviceId: "DEV-003",
        createdAt: "2026-08-19T13:20:00",
        updatedAt: "2026-08-19T14:05:00",
        resolvedAt: null
    },
    {
        id: "TKT-0004",
        title: "Tài khoản bị khóa sau khi đổi mật khẩu",
        description: "Tài khoản người dùng bị khóa do nhập sai mật khẩu nhiều lần sau khi thực hiện đổi mật khẩu.",
        category: "account",
        priority: "critical",
        status: "pending",
        requesterEmail: "lead@itsupport.local",
        assigneeEmail: "technician@itsupport.local",
        deviceId: null,
        createdAt: "2026-08-18T11:10:00",
        updatedAt: "2026-08-18T12:00:00",
        resolvedAt: null
    },
    {
        id: "TKT-0005",
        title: "Ứng dụng CRM liên tục bị lỗi",
        description: "Ứng dụng CRM trên máy tính bị treo ngay sau khi đăng nhập trên nhiều máy khác nhau.",
        category: "software",
        priority: "high",
        status: "resolved",
        requesterEmail: "user@itsupport.local",
        assigneeEmail: "technician@itsupport.local",
        deviceId: "DEV-005",
        createdAt: "2026-08-17T09:00:00",
        updatedAt: "2026-08-17T09:45:00",
        resolvedAt: "2026-08-17T09:45:00"
    },
    {
        id: "TKT-0006",
        title: "Màn hình chập chờn không ổn định",
        description: "Màn hình chập chờn trong quá trình làm việc, gây mỏi mắt cho nhân viên.",
        category: "hardware",
        priority: "low",
        status: "closed",
        requesterEmail: "lead@itsupport.local",
        assigneeEmail: "technician@itsupport.local",
        deviceId: "DEV-006",
        createdAt: "2026-08-16T15:40:00",
        updatedAt: "2026-08-16T16:30:00",
        resolvedAt: "2026-08-16T16:30:00"
    },
    {
        id: "TKT-0007",
        title: "Docking station không sạc được laptop",
        description: "Laptop không sạc được khi được cắm vào docking station tại văn phòng.",
        category: "hardware",
        priority: "medium",
        status: "reopened",
        requesterEmail: "user@itsupport.local",
        assigneeEmail: null,
        deviceId: "DEV-007",
        createdAt: "2026-08-15T10:25:00",
        updatedAt: "2026-08-21T07:30:00",
        resolvedAt: null
    }
];

const seedDevices = [
    {
        id: "DEV-001",
        name: "LAPTOP-USER-01",
        type: "laptop",
        status: "in_use",
        userEmail: "user@itsupport.local",
        department: "Kinh doanh",
        ipAddress: "192.168.10.21",
        serialNumber: "LP-USER-001",
        purchaseDate: "2025-02-15",
        notes: "Laptop Windows 11 dùng cho nhân viên văn phòng.",
        createdAt: "2026-08-01T08:00:00",
        updatedAt: "2026-08-01T08:00:00"
    },
    {
        id: "DEV-002",
        name: "PC-TECH-02",
        type: "desktop",
        status: "in_use",
        userEmail: "technician@itsupport.local",
        department: "Kỹ thuật",
        ipAddress: "192.168.10.35",
        serialNumber: "PC-TECH-002",
        purchaseDate: "2024-11-08",
        notes: "Máy trạm kỹ thuật dùng kiểm tra và hỗ trợ người dùng.",
        createdAt: "2026-08-01T08:00:00",
        updatedAt: "2026-08-01T08:00:00"
    },
    {
        id: "DEV-003",
        name: "PRN-ACC-01",
        type: "printer",
        status: "maintenance",
        userEmail: null,
        department: "Kế toán",
        ipAddress: "192.168.30.45",
        serialNumber: "PRN-ACC-001",
        purchaseDate: "2023-04-10",
        notes: "Máy in mạng của phòng Kế toán.",
        createdAt: "2026-08-01T08:00:00",
        updatedAt: "2026-08-19T14:05:00"
    },
    {
        id: "DEV-004",
        name: "SW-CORE-01",
        type: "switch",
        status: "in_use",
        userEmail: null,
        department: "Kỹ thuật",
        ipAddress: "10.0.0.2",
        serialNumber: "SW-CORE-001",
        purchaseDate: "2022-05-20",
        notes: "Switch core phòng mạng.",
        createdAt: "2026-08-01T08:00:00",
        updatedAt: "2026-08-01T08:00:00"
    },
    {
        id: "DEV-005",
        name: "PC-SALES-05",
        type: "desktop",
        status: "in_use",
        userEmail: "user@itsupport.local",
        department: "Kinh doanh",
        ipAddress: "192.168.10.52",
        serialNumber: "PC-SALES-005",
        purchaseDate: "2024-03-12",
        notes: "Máy dùng CRM và phần mềm văn phòng.",
        createdAt: "2026-08-01T08:00:00",
        updatedAt: "2026-08-17T09:45:00"
    },
    {
        id: "DEV-006",
        name: "MONITOR-IT-06",
        type: "other",
        status: "retired",
        userEmail: null,
        department: "Kỹ thuật",
        ipAddress: null,
        serialNumber: "MON-IT-006",
        purchaseDate: "2020-06-23",
        notes: "Màn hình đã ngưng sử dụng sau sự cố chập chờn.",
        createdAt: "2026-08-01T08:00:00",
        updatedAt: "2026-08-16T16:30:00"
    },
    {
        id: "DEV-007",
        name: "DOCK-USER-07",
        type: "other",
        status: "maintenance",
        userEmail: "user@itsupport.local",
        department: "Kinh doanh",
        ipAddress: null,
        serialNumber: "DOCK-USER-007",
        purchaseDate: "2025-01-09",
        notes: "Docking station đang kiểm tra lỗi sạc laptop.",
        createdAt: "2026-08-01T08:00:00",
        updatedAt: "2026-08-21T07:30:00"
    },
    {
        id: "DEV-008",
        name: "AP-OFFICE-01",
        type: "access_point",
        status: "storage",
        userEmail: null,
        department: "Hành chính",
        ipAddress: "192.168.20.15",
        serialNumber: "AP-OFFICE-008",
        purchaseDate: "2023-09-03",
        notes: "Access Point dự phòng.",
        createdAt: "2026-08-01T08:00:00",
        updatedAt: "2026-08-01T08:00:00"
    }
];

const seedUsers = [
    { id: "USR-001", name: "Nguyễn Văn An", email: "lead@itsupport.local", department: "IT", role: "technical_lead", phone: "0901000001", status: "active", createdAt: "2026-06-01T08:00:00" },
    { id: "USR-002", name: "Trần Văn Bình", email: "technician@itsupport.local", department: "Kỹ thuật", role: "technician", phone: "0901000002", status: "active", createdAt: "2026-06-01T08:05:00" },
    { id: "USR-003", name: "Lê Minh Anh", email: "user@itsupport.local", department: "Kinh doanh", role: "user", phone: "0901000003", status: "active", createdAt: "2026-06-01T08:10:00" },
    { id: "USR-004", name: "Phạm Thị Hương", email: "huong.pham@hr.local", department: "Nhân sự", role: "user", phone: "0975210987", status: "active", createdAt: "2026-06-02T09:00:00" },
    { id: "USR-005", name: "Hoàng Văn Cường", email: "cuong.hoang@accounting.local", department: "Kế toán", role: "user", phone: "0944778221", status: "locked", createdAt: "2026-06-03T09:00:00" },
    { id: "USR-006", name: "Nguyễn Thị Lan", email: "lan.nguyen@marketing.local", department: "Marketing", role: "user", phone: "0931555010", status: "active", createdAt: "2026-06-04T09:00:00" },
    { id: "USR-007", name: "Đinh Văn Long", email: "long.dinh@operation.local", department: "Vận hành", role: "technician", phone: "0964900221", status: "active", createdAt: "2026-06-05T09:00:00" },
    { id: "USR-008", name: "Vũ Minh Quân", email: "quan.vu@itsupport.local", department: "IT", role: "technician", phone: "0922334556", status: "disabled", createdAt: "2026-06-06T09:00:00" }
];

const seedNetworkDevices = [
    { id: "NET-001", name: "RTR-CORE-01", type: "router", ipAddress: "10.0.0.1", macAddress: "00:1A:2B:3C:4D:5E", area: "Phòng máy chủ", status: "online", vlan: 10, subnet: "10.0.0.0/24", gateway: "10.0.0.1", managementUrl: null, uptimeHours: 288, notes: "Router core chính.", createdAt: "2026-06-01T08:00:00", updatedAt: "2026-06-01T08:00:00" },
    { id: "NET-002", name: "SW-CORE-01", type: "switch", ipAddress: "10.0.0.2", macAddress: "00:1A:2B:3C:4D:5F", area: "Phòng máy chủ", status: "online", vlan: 10, subnet: "10.0.0.0/24", gateway: "10.0.0.1", managementUrl: null, uptimeHours: 264, notes: "Switch core.", createdAt: "2026-06-01T08:05:00", updatedAt: "2026-06-01T08:05:00" },
    { id: "NET-003", name: "SW-FLOOR1-01", type: "switch", ipAddress: "10.0.1.10", macAddress: "00:1A:2B:3C:4D:6A", area: "Tầng 1", status: "maintenance", vlan: 20, subnet: "10.0.1.0/24", gateway: "10.0.1.1", managementUrl: null, uptimeHours: 120, notes: "Đang kiểm tra uplink.", createdAt: "2026-06-02T08:00:00", updatedAt: "2026-06-02T08:00:00" },
    { id: "NET-004", name: "AP-OFFICE-01", type: "access_point", ipAddress: "10.0.2.15", macAddress: "00:1A:2B:3C:4D:7B", area: "Văn phòng", status: "online", vlan: 30, subnet: "10.0.2.0/24", gateway: "10.0.2.1", managementUrl: null, uptimeHours: 168, notes: null, createdAt: "2026-06-03T08:00:00", updatedAt: "2026-06-03T08:00:00" },
    { id: "NET-005", name: "FW-EDGE-01", type: "firewall", ipAddress: "10.0.0.254", macAddress: "00:1A:2B:3C:4D:8C", area: "Phòng máy chủ", status: "online", vlan: 10, subnet: "10.0.0.0/24", gateway: "10.0.0.1", managementUrl: null, uptimeHours: 360, notes: "Firewall biên.", createdAt: "2026-06-04T08:00:00", updatedAt: "2026-06-04T08:00:00" },
    { id: "NET-006", name: "MDM-ISP-01", type: "modem", ipAddress: "10.0.3.22", macAddress: "00:1A:2B:3C:4D:9D", area: "Phòng kỹ thuật", status: "offline", vlan: 40, subnet: "10.0.3.0/24", gateway: "10.0.3.1", managementUrl: null, uptimeHours: 0, notes: "Mất kết nối uplink.", createdAt: "2026-06-05T08:00:00", updatedAt: "2026-06-05T08:00:00" },
    { id: "NET-007", name: "RTR-ACCESS-02", type: "router", ipAddress: "10.0.4.1", macAddress: "00:1A:2B:3C:4D:AA", area: "Tầng 2", status: "warning", vlan: 50, subnet: "10.0.4.0/24", gateway: "10.0.4.1", managementUrl: null, uptimeHours: 72, notes: "CPU cao, cần theo dõi.", createdAt: "2026-06-06T08:00:00", updatedAt: "2026-06-06T08:00:00" },
    { id: "NET-008", name: "SW-FLOOR2-01", type: "switch", ipAddress: "10.0.2.45", macAddress: "00:1A:2B:3C:4D:BB", area: "Tầng 2", status: "online", vlan: 30, subnet: "10.0.2.0/24", gateway: "10.0.2.1", managementUrl: null, uptimeHours: 216, notes: null, createdAt: "2026-06-07T08:00:00", updatedAt: "2026-06-07T08:00:00" }
];

const CORE_SEED_COLLECTIONS = {
    tickets: seedTickets,
    devices: seedDevices,
    users: seedUsers,
    networkDevices: seedNetworkDevices
};

if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    Object.entries(CORE_SEED_COLLECTIONS).forEach(function (entry) {
        const key = entry[0];
        const value = entry[1];
        if (window.localStorage.getItem(key) === null) {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
    });

    window.AppSeedData = {
        tickets: seedTickets,
        devices: seedDevices,
        users: seedUsers,
        networkDevices: seedNetworkDevices
    };
}
