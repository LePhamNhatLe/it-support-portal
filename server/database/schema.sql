CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  role ENUM('technical_lead','technician','user') NOT NULL,
  department VARCHAR(120) NULL,
  phone VARCHAR(32) NULL,
  password_hash VARCHAR(255) NULL,
  status ENUM('active','disabled','locked') NOT NULL DEFAULT 'active',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type ENUM('desktop','laptop','printer','router','switch','access_point','server','other') NOT NULL,
  status ENUM('in_use','maintenance','storage','broken','retired') NOT NULL,
  user_email VARCHAR(160) NULL,
  department VARCHAR(120) NULL,
  ip_address VARCHAR(45) NULL,
  serial_number VARCHAR(120) NULL,
  purchase_date DATE NULL,
  notes TEXT NULL,
  CONSTRAINT fk_devices_user_email FOREIGN KEY (user_email) REFERENCES users(email)
    ON UPDATE CASCADE ON DELETE SET NULL,
  UNIQUE KEY uq_devices_serial_number (serial_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS network_devices (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type ENUM('router','switch','access_point','firewall','server','modem','other') NOT NULL,
  status ENUM('online','offline','maintenance','warning') NOT NULL,
  ip_address VARCHAR(45) NOT NULL UNIQUE,
  mac_address VARCHAR(32) NULL UNIQUE,
  area VARCHAR(120) NULL,
  vlan INT NULL,
  subnet VARCHAR(64) NULL,
  gateway VARCHAR(45) NULL,
  management_url VARCHAR(255) NULL,
  uptime_hours INT NULL,
  notes TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(40) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('hardware','software','network','account','printer','other') NOT NULL,
  priority ENUM('low','medium','high','critical') NOT NULL,
  status ENUM('open','assigned','in_progress','pending','resolved','closed','reopened') NOT NULL,
  requester_email VARCHAR(160) NULL,
  assignee_email VARCHAR(160) NULL,
  device_id VARCHAR(40) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  resolved_at DATETIME(3) NULL,
  CONSTRAINT fk_tickets_requester FOREIGN KEY (requester_email) REFERENCES users(email)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_tickets_assignee FOREIGN KEY (assignee_email) REFERENCES users(email)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_tickets_device FOREIGN KEY (device_id) REFERENCES devices(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  KEY idx_tickets_status (status),
  KEY idx_tickets_priority (priority),
  KEY idx_tickets_requester (requester_email),
  KEY idx_tickets_assignee (assignee_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
  id TINYINT UNSIGNED PRIMARY KEY,
  company_name VARCHAR(120) NOT NULL,
  timezone VARCHAR(80) NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'vi',
  default_priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  sla_hours INT UNSIGNED NOT NULL DEFAULT 24
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
