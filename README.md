# IT Support Portal

Full-stack IT Helpdesk & Infrastructure Management Portal built for technical support workflows, asset tracking, user administration, network inventory, reporting, and role-based operations.

**Languages:** [English](#english) | [Tiếng Việt](#tiếng-việt)

---

# English

## Overview

**IT Support Portal** is a full-stack internal support system that simulates the day-to-day workflow of an IT Helpdesk / Technical Support team.

The project includes ticket management, device inventory, user and role administration, network inventory, dashboards, reports, settings, backend authentication, and MySQL persistence.

It is designed as a practical portfolio project and as a reusable source-code base for learning, demos, customization, and further internal-tool development.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js 20+
- Express 5
- MySQL 8+
- `mysql2`
- JWT authentication
- `bcryptjs` password hashing
- LocalStorage compatibility cache / browser preferences
- Aiven-compatible cloud MySQL setup

## Main Features

- Technical Lead, Technician, and User role model
- JWT-based backend authentication
- Password hashing with bcrypt
- Authenticated `/api/v1` REST API
- Role-based route protection
- Ticket creation, assignment, status tracking, comments, notes, and history
- IT device / asset inventory
- User management with role and account status controls
- Network device inventory
- Dashboard with role-aware operational data
- Reports for tickets, devices, network devices, and technicians
- System settings persisted through the backend
- Personal browser preferences stored locally
- Responsive light/dark interface
- Frontend regression runner
- Backend/API smoke tests
- GitHub Actions backend checks

## Architecture

```text
Browser / Vanilla JavaScript frontend
        ↓
AppApi integration layer
        ↓
Express REST API /api/v1
        ↓
Authentication + authorization middleware
        ↓
Repository selector
   ├─ MySQL store      main full-stack path
   └─ Memory store     zero-setup development/testing fallback
        ↓
MySQL / Aiven cloud database
```

LocalStorage is retained for frontend compatibility caching and personal browser preferences. Operational records are persisted through the backend when the API/MySQL path is active.

## Modules

| Module | Purpose |
| --- | --- |
| Login | Backend login with JWT session token |
| Dashboard | Role-aware operational overview |
| Tickets | Create, filter, assign, process, and track support requests |
| Ticket Detail | Workflow actions, comments, notes, activity history, and device context |
| Devices | IT asset inventory and user assignment |
| Users | Internal users, roles, account status, phone, and access administration |
| Network | Router, switch, AP, firewall, server, modem, and infrastructure inventory |
| Reports | Ticket, device, network, and technician summaries |
| Settings | Personal preferences and backend-persisted system defaults |

## Demo Accounts

After database seed, the default demo accounts are:

| Role | Email | Password |
| --- | --- | --- |
| Technical Lead | `lead@itsupport.local` | `123456` |
| Technician | `technician@itsupport.local` | `123456` |
| User | `user@itsupport.local` | `123456` |

Passwords are stored as hashes in the backend data store. Accounts created through the Users module can also be used for backend login after a password is configured.

## API

Default local API:

```text
http://localhost:3000/api/v1
```

Main endpoints:

```text
GET    /health
POST   /auth/login
GET    /auth/me

GET    /tickets
POST   /tickets
PATCH  /tickets/:id
DELETE /tickets/:id

GET    /devices
POST   /devices
PATCH  /devices/:id
DELETE /devices/:id

GET    /users
POST   /users
PATCH  /users/:id
DELETE /users/:id

GET    /network
POST   /network
PATCH  /network/:id
DELETE /network/:id

GET    /reports/summary
GET    /settings
PATCH  /settings
```

`GET /health` is public and reports the active data source without exposing credentials.

Protected endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Role Access

Current backend route-level access model:

| Resource | Technical Lead | Technician | User |
| --- | --- | --- | --- |
| Tickets | Yes | Yes | Yes |
| Devices | Yes | Yes | No |
| Users | Yes | No | No |
| Network | Yes | Yes | No |
| Reports | Yes | No | No |
| Settings | Yes | Yes | Yes |

User-management self-protection is enforced on the backend, including protection against self-demotion, self-locking, self-disabling, and self-deletion.

Ticket-level ownership and assignee authorization is still being hardened before the final release. The current branch should not be treated as production-ready until the final security and integration pass is complete.

## MySQL

The MySQL path uses InnoDB, `utf8mb4`, relational constraints, uniqueness rules, and migration/seed scripts.

Persisted data includes:

- Users and authentication hashes
- Tickets
- Devices
- Network inventory
- System settings
- User/device/ticket relationships

Cloud MySQL is supported through environment variables and SSL CA configuration.

## Environment Setup

Create `.env` from `.env.example`.

Example development configuration:

```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1
CORS_ORIGIN=http://127.0.0.1:5500

DATA_SOURCE=mysql
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database
DB_SSL=true
DB_CA_PATH=server/certs/ca.pem
DB_CONNECTION_LIMIT=4

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
```

Never commit `.env`, database passwords, JWT secrets, or private certificates.

## Run Locally

```bash
git clone https://github.com/LePhamNhatLe/it-support-portal.git
cd it-support-portal
git switch develop
npm install
```

For MySQL:

```bash
npm run db:ping
npm run db:migrate
npm run db:seed
```

Start the backend:

```bash
npm run dev
```

Serve the frontend with a static server such as VS Code Live Server.

## Testing

Backend syntax checks:

```bash
npm run check:server
```

API smoke/security tests:

```bash
npm run test:api
```

Database connectivity:

```bash
npm run db:ping
```

Frontend regression page:

```text
tests/regression.html
```

Recommended manual persistence check:

```text
create/update record in frontend
→ verify API response
→ refresh browser
→ record must still exist
```

## Data Validation and Protection

Implemented protections include:

- IPv4 validation
- MAC address validation
- VLAN validation
- Subnet/CIDR validation
- Duplicate IP/MAC checks
- Unique user email constraints
- Unique device serial constraints
- Foreign-key protection for related records
- Semantic API errors for duplicate and reference violations
- User dependency protection
- Backend user self-protection
- JWT authentication
- bcrypt password hashing
- CSV spreadsheet formula-injection protection
- `.env` and private certificate exclusion through `.gitignore`

## Project Status

- P11 Ticket Module: **DONE**
- P12 Device Management: **DONE**
- P13 User Management: **DONE**
- P14 Network Inventory: **DONE**
- P15 Dashboard Integration: **DONE**
- P16 Reports: **DONE**
- P17 Settings: **DONE**
- P18 Full Frontend Regression: **DONE**
- P19 UI / UX Polish: **DONE**
- P20 Frontend Portfolio Release: **DONE**
- P21 Node.js + Express Backend: **DONE**
- P22 MySQL Integration: **DONE**
- P23 Frontend / Backend Integration: **DONE**
- P23.5 Integration Stabilization: **DONE**
- P24 Backend Authentication & Security: **IN PROGRESS - authentication foundation complete, final ticket authorization hardening remaining**
- P25 Integration & Database Testing: **PLANNED**
- P26 Deployment: **PLANNED**
- P27 Final Portfolio / Source Release: **PLANNED**

## Current Release Note

The authentication foundation is implemented and working with JWT, bcrypt, protected backend routes, MySQL-backed users, and backend user-management protections.

Before final commercial/production-style release, the project still requires:

1. Final ticket ownership / assignee authorization rules
2. Full role-based browser regression
3. Full MySQL persistence regression
4. Deployment validation
5. Final packaging and release documentation

## Documentation

- [Backend API](docs/backend-api.md)
- [MySQL Cloud Setup](docs/mysql-cloud-setup.md)
- [Project Specification](docs/project-spec.md)
- [Frontend Portfolio Release Notes](docs/frontend-portfolio-release.md)

## Author

**Lê Phạm Nhật Lễ**  
CPE & Network Support / IT Helpdesk

GitHub: [LePhamNhatLe](https://github.com/LePhamNhatLe)

---

# Tiếng Việt

## Giới thiệu

**IT Support Portal** là hệ thống Helpdesk và quản lý hạ tầng IT full-stack, mô phỏng quy trình làm việc thực tế của bộ phận IT Helpdesk / Technical Support.

Dự án bao gồm quản lý phiếu hỗ trợ, thiết bị IT, người dùng và phân quyền, thiết bị mạng, dashboard, báo cáo, cài đặt hệ thống, xác thực backend và lưu trữ MySQL.

Dự án được xây dựng theo hướng thực hành thực tế, portfolio kỹ thuật và có thể dùng làm source code nền để học tập, demo, tùy biến hoặc tiếp tục phát triển thành công cụ nội bộ.

## Công nghệ sử dụng

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js 20+
- Express 5
- MySQL 8+
- `mysql2`
- JWT authentication
- `bcryptjs` để hash mật khẩu
- LocalStorage cho cache tương thích và tùy chọn trình duyệt
- Hỗ trợ MySQL cloud tương thích Aiven

## Chức năng chính

- 3 nhóm quyền: Technical Lead, Technician và User
- Đăng nhập backend bằng JWT
- Hash mật khẩu bằng bcrypt
- REST API `/api/v1` có xác thực
- Phân quyền route ở backend
- Quản lý ticket từ tạo mới đến xử lý, phân công và theo dõi trạng thái
- Quản lý thiết bị / tài sản IT
- Quản lý người dùng, vai trò và trạng thái tài khoản
- Quản lý thiết bị mạng
- Dashboard theo quyền người dùng
- Báo cáo ticket, thiết bị, network và technician
- Cài đặt hệ thống lưu qua backend
- Tùy chọn cá nhân lưu theo trình duyệt
- Giao diện responsive, light/dark mode
- Frontend regression runner
- Backend/API smoke tests
- GitHub Actions kiểm tra backend

## Kiến trúc hệ thống

```text
Trình duyệt / Vanilla JavaScript frontend
        ↓
AppApi integration layer
        ↓
Express REST API /api/v1
        ↓
Middleware xác thực + phân quyền
        ↓
Repository selector
   ├─ MySQL store      luồng full-stack chính
   └─ Memory store     fallback cho development/testing
        ↓
MySQL / Aiven cloud database
```

LocalStorage vẫn được giữ lại để cache tương thích ở frontend và lưu các tùy chọn cá nhân của trình duyệt. Dữ liệu nghiệp vụ được lưu qua backend khi chạy API/MySQL.

## Các module

| Module | Chức năng |
| --- | --- |
| Login | Đăng nhập backend và nhận JWT |
| Dashboard | Tổng quan vận hành theo vai trò |
| Tickets | Tạo, lọc, phân công, xử lý và theo dõi phiếu hỗ trợ |
| Ticket Detail | Thao tác workflow, comment, work note, lịch sử và thiết bị liên quan |
| Devices | Quản lý tài sản IT và người sử dụng |
| Users | Quản lý người dùng, vai trò, trạng thái, số điện thoại và quyền truy cập |
| Network | Quản lý router, switch, AP, firewall, server, modem và thiết bị hạ tầng |
| Reports | Báo cáo ticket, thiết bị, network và technician |
| Settings | Tùy chọn cá nhân và cấu hình hệ thống lưu qua backend |

## Tài khoản demo

Sau khi chạy seed database:

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Technical Lead | `lead@itsupport.local` | `123456` |
| Technician | `technician@itsupport.local` | `123456` |
| User | `user@itsupport.local` | `123456` |

Mật khẩu được lưu dưới dạng hash ở backend. Người dùng được tạo từ module Users cũng có thể đăng nhập qua backend khi đã được cấu hình mật khẩu.

## API

API local mặc định:

```text
http://localhost:3000/api/v1
```

Các endpoint chính:

```text
GET    /health
POST   /auth/login
GET    /auth/me

GET    /tickets
POST   /tickets
PATCH  /tickets/:id
DELETE /tickets/:id

GET    /devices
POST   /devices
PATCH  /devices/:id
DELETE /devices/:id

GET    /users
POST   /users
PATCH  /users/:id
DELETE /users/:id

GET    /network
POST   /network
PATCH  /network/:id
DELETE /network/:id

GET    /reports/summary
GET    /settings
PATCH  /settings
```

`GET /health` là endpoint public và chỉ trả trạng thái dịch vụ / nguồn dữ liệu, không làm lộ credential.

Các endpoint được bảo vệ yêu cầu:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Phân quyền hiện tại

| Tài nguyên | Technical Lead | Technician | User |
| --- | --- | --- | --- |
| Tickets | Có | Có | Có |
| Devices | Có | Có | Không |
| Users | Có | Không | Không |
| Network | Có | Có | Không |
| Reports | Có | Không | Không |
| Settings | Có | Có | Có |

Backend đã có bảo vệ tài khoản đang đăng nhập, bao gồm không cho tự hạ role, tự khóa, tự vô hiệu hóa hoặc tự xóa tài khoản.

Phân quyền chi tiết ở cấp ticket theo requester / assignee vẫn đang được hoàn thiện trước bản release cuối. Vì vậy branch hiện tại chưa nên được xem là production-ready cho đến khi hoàn tất security pass và integration regression.

## MySQL

Luồng MySQL sử dụng InnoDB, `utf8mb4`, khóa ngoại, unique constraint, migration và seed script.

Dữ liệu được lưu gồm:

- Người dùng và password hash
- Ticket
- Thiết bị IT
- Thiết bị mạng
- Cài đặt hệ thống
- Các quan hệ giữa user / device / ticket

Có thể kết nối MySQL cloud thông qua biến môi trường và SSL CA.

## Cấu hình môi trường

Tạo `.env` từ `.env.example`.

Ví dụ:

```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1
CORS_ORIGIN=http://127.0.0.1:5500

DATA_SOURCE=mysql
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database
DB_SSL=true
DB_CA_PATH=server/certs/ca.pem
DB_CONNECTION_LIMIT=4

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
```

Không commit `.env`, mật khẩu database, JWT secret hoặc certificate riêng tư lên Git.

## Chạy project local

```bash
git clone https://github.com/LePhamNhatLe/it-support-portal.git
cd it-support-portal
git switch develop
npm install
```

Nếu dùng MySQL:

```bash
npm run db:ping
npm run db:migrate
npm run db:seed
```

Khởi động backend:

```bash
npm run dev
```

Frontend có thể chạy bằng static server như VS Code Live Server.

## Kiểm thử

Kiểm tra syntax backend:

```bash
npm run check:server
```

API smoke/security test:

```bash
npm run test:api
```

Kiểm tra kết nối database:

```bash
npm run db:ping
```

Frontend regression:

```text
tests/regression.html
```

Luồng kiểm tra persistence khuyến nghị:

```text
tạo / sửa dữ liệu trên frontend
→ kiểm tra API
→ refresh trình duyệt
→ dữ liệu vẫn phải tồn tại
```

## Validation và bảo vệ dữ liệu

Các lớp bảo vệ hiện có:

- Validate IPv4
- Validate MAC address
- Validate VLAN
- Validate subnet/CIDR
- Kiểm tra trùng IP/MAC
- Unique email người dùng
- Unique serial thiết bị
- Foreign key cho dữ liệu liên quan
- API error có ý nghĩa cho duplicate / invalid reference
- Bảo vệ dependency khi xóa user
- Backend self-protection cho tài khoản đang đăng nhập
- JWT authentication
- bcrypt password hashing
- Chống CSV spreadsheet formula injection
- `.gitignore` loại `.env` và private certificate khỏi repository

## Trạng thái dự án

- P11 Ticket Module: **DONE**
- P12 Device Management: **DONE**
- P13 User Management: **DONE**
- P14 Network Inventory: **DONE**
- P15 Dashboard Integration: **DONE**
- P16 Reports: **DONE**
- P17 Settings: **DONE**
- P18 Full Frontend Regression: **DONE**
- P19 UI / UX Polish: **DONE**
- P20 Frontend Portfolio Release: **DONE**
- P21 Node.js + Express Backend: **DONE**
- P22 MySQL Integration: **DONE**
- P23 Frontend / Backend Integration: **DONE**
- P23.5 Integration Stabilization: **DONE**
- P24 Backend Authentication & Security: **ĐANG LÀM - nền tảng authentication đã hoàn tất, còn hardening ticket authorization**
- P25 Integration & Database Testing: **PLANNED**
- P26 Deployment: **PLANNED**
- P27 Final Portfolio / Source Release: **PLANNED**

## Ghi chú release hiện tại

Nền tảng authentication đã hoạt động với JWT, bcrypt, protected backend routes, MySQL-backed users và các lớp bảo vệ ở module Users.

Trước khi phát hành bản thương mại / production-style cuối cùng, dự án còn cần:

1. Hoàn thiện phân quyền ticket theo requester / assignee
2. Full browser regression theo từng role
3. Full MySQL persistence regression
4. Kiểm tra deployment
5. Đóng gói và hoàn thiện tài liệu release

## Tài liệu

- [Backend API](docs/backend-api.md)
- [MySQL Cloud Setup](docs/mysql-cloud-setup.md)
- [Project Specification](docs/project-spec.md)
- [Frontend Portfolio Release Notes](docs/frontend-portfolio-release.md)

## Tác giả

**Lê Phạm Nhật Lễ**  
CPE & Network Support / IT Helpdesk

GitHub: [LePhamNhatLe](https://github.com/LePhamNhatLe)
