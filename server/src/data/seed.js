module.exports = {
  users: [
    { id: "USR-001", name: "Nguyễn Văn An", email: "lead@itsupport.local", role: "technical_lead", department: "Kỹ thuật", status: "active", createdAt: "2026-08-01T08:00:00.000Z" },
    { id: "USR-002", name: "Trần Văn Bình", email: "technician@itsupport.local", role: "technician", department: "Kỹ thuật", status: "active", createdAt: "2026-08-01T08:05:00.000Z" },
    { id: "USR-003", name: "Lê Minh Anh", email: "user@itsupport.local", role: "user", department: "Vận hành", status: "active", createdAt: "2026-08-01T08:10:00.000Z" }
  ],
  tickets: [
    { id: "TKT-0001", title: "Không truy cập được Wi-Fi văn phòng", description: "Thiết bị mất kết nối Wi-Fi tại khu vực làm việc.", category: "network", priority: "high", status: "assigned", requesterEmail: "user@itsupport.local", assigneeEmail: "technician@itsupport.local", deviceId: null, createdAt: "2026-09-01T02:00:00.000Z", updatedAt: "2026-09-01T02:10:00.000Z" }
  ],
  devices: [
    { id: "DEV-001", name: "Laptop văn phòng", type: "laptop", status: "in_use", userEmail: "user@itsupport.local", department: "Vận hành", ipAddress: "192.168.10.25", serialNumber: "DEMO-LAP-001", purchaseDate: "2026-01-10", notes: "Thiết bị demo backend." }
  ],
  network: [
    { id: "NET-001", name: "Core Router", type: "router", status: "online", ipAddress: "10.0.0.1", macAddress: "AA:BB:CC:DD:EE:01", area: "Phòng máy chủ", vlan: 10, subnet: "10.0.0.0/24", gateway: "10.0.0.1", managementUrl: "https://10.0.0.1", uptimeHours: 240, notes: "Thiết bị mạng demo." }
  ],
  settings: {
    companyName: "TPCOMS IT Support Demo",
    timezone: "Asia/Ho_Chi_Minh",
    language: "vi",
    defaultPriority: "medium",
    slaHours: 24
  }
};
