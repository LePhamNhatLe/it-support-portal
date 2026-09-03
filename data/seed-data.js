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

const TICKETS_STORAGE_KEY = "tickets";
const DEVICES_STORAGE_KEY = "devices";

if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    if (!window.localStorage.getItem(TICKETS_STORAGE_KEY)) {
        window.localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(seedTickets));
    }

    if (!window.localStorage.getItem(DEVICES_STORAGE_KEY)) {
        window.localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(seedDevices));
    }
}