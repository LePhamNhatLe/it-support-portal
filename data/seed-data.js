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

const TICKETS_STORAGE_KEY = "tickets";

if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    if (!window.localStorage.getItem(TICKETS_STORAGE_KEY)) {
        window.localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(seedTickets));
    }
}