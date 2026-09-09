INSERT INTO users (id, name, email, role, department, status, created_at) VALUES
  ('USR-001','Nguyễn Văn An','lead@itsupport.local','technical_lead','Kỹ thuật','active','2026-08-01 08:00:00.000'),
  ('USR-002','Trần Văn Bình','technician@itsupport.local','technician','Kỹ thuật','active','2026-08-01 08:05:00.000'),
  ('USR-003','Lê Minh Anh','user@itsupport.local','user','Vận hành','active','2026-08-01 08:10:00.000')
ON DUPLICATE KEY UPDATE
  name = VALUES(name), role = VALUES(role), department = VALUES(department), status = VALUES(status);

INSERT INTO devices (id, name, type, status, user_email, department, ip_address, serial_number, purchase_date, notes) VALUES
  ('DEV-001','Laptop văn phòng','laptop','in_use','user@itsupport.local','Vận hành','192.168.10.25','DEMO-LAP-001','2026-01-10','Thiết bị demo backend.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name), status = VALUES(status), user_email = VALUES(user_email), department = VALUES(department), ip_address = VALUES(ip_address), notes = VALUES(notes);

INSERT INTO network_devices (id, name, type, status, ip_address, mac_address, area, vlan, subnet, gateway, management_url, uptime_hours, notes) VALUES
  ('NET-001','Core Router','router','online','10.0.0.1','AA:BB:CC:DD:EE:01','Phòng máy chủ',10,'10.0.0.0/24','10.0.0.1','https://10.0.0.1',240,'Thiết bị mạng demo.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name), status = VALUES(status), area = VALUES(area), vlan = VALUES(vlan), subnet = VALUES(subnet), gateway = VALUES(gateway), management_url = VALUES(management_url), uptime_hours = VALUES(uptime_hours), notes = VALUES(notes);

DELETE FROM tickets WHERE id = 'TKT-001';

INSERT INTO tickets (id, title, description, category, priority, status, requester_email, assignee_email, device_id, created_at, updated_at) VALUES
  ('TKT-0001','Không truy cập được Wi-Fi văn phòng','Thiết bị mất kết nối Wi-Fi tại khu vực làm việc.','network','high','assigned','user@itsupport.local','technician@itsupport.local',NULL,'2026-09-01 02:00:00.000','2026-09-01 02:10:00.000')
ON DUPLICATE KEY UPDATE
  title = VALUES(title), description = VALUES(description), category = VALUES(category), priority = VALUES(priority), status = VALUES(status), requester_email = VALUES(requester_email), assignee_email = VALUES(assignee_email), device_id = VALUES(device_id), updated_at = VALUES(updated_at);

INSERT INTO system_settings (id, company_name, timezone, language, default_priority, sla_hours) VALUES
  (1,'TPCOMS IT Support Demo','Asia/Ho_Chi_Minh','vi','medium',24)
ON DUPLICATE KEY UPDATE
  company_name = VALUES(company_name), timezone = VALUES(timezone), language = VALUES(language), default_priority = VALUES(default_priority), sla_hours = VALUES(sla_hours);
