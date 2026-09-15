# IT Support Portal

Full-stack IT Helpdesk & Infrastructure Management Portal built for technical support workflows, asset tracking, user administration, network inventory, reporting, and role-based operations.

**Languages:** [English](#english) | [Tiếng Việt](#tiếng-việt)

---

# English

## Overview

**IT Support Portal** is a full-stack internal support system that simulates the day-to-day workflow of an IT Helpdesk / Technical Support team.

The project includes ticket management, device inventory, user and role administration, network inventory, dashboards, reports, settings, backend authentication, and MySQL persistence.

It is designed as a portfolio-ready and reusable source-code base for demos, customization, and further internal-tool development.

## Live Demo

Frontend:

```text
https://it-support-portal-snowy.vercel.app
```

Backend health endpoint:

```text
https://it-support-portal-api.onrender.com/api/v1/health
```

Production architecture:

```text
Vercel frontend
      ↓
Render Express API
      ↓
Aiven MySQL
```

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
- Ticket ownership / assignee authorization
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

Ticket-level rules are also enforced on the backend:

- Technical Lead can view and manage all tickets, assign technicians, manage workflow, and delete tickets.
- Technician can only view tickets assigned to that technician and can only perform allowed workflow transitions.
- User can only view tickets requested by that user, cannot spoof requester identity, cannot self-assign a technician, and cannot modify protected workflow fields.

User-management self-protection is enforced on the backend, including protection against self-demotion, self-locking, self-disabling, and self-deletion.

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

Current security/API smoke suite: **17 tests / 17 passing**.

Database connectivity:

```bash
npm run db:ping
```

Frontend regression page:

```text
tests/regression.html
```

Manual regression has been completed across the three demo roles for login, ticket flow, ticket assignment/workflow, Users, Devices, Network, Settings, refresh persistence, and logout/login persistence with the MySQL path active.

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
- Ticket requester / assignee authorization
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
- P24 Backend Authentication & Security: **DONE**
- P25 Integration & Database Testing: **DONE**
- P26 Deployment: **DONE**
- P27 Final Portfolio / Source Release: **DONE**

## Current Release Note

Authentication and authorization are implemented with JWT, bcrypt, protected backend routes, user-management protections, ticket ownership/assignee rules, and direct-API authorization checks.

The API security smoke suite passes 17/17 tests, manual role-based / MySQL persistence regression is complete, and the hosted production path has been validated through Vercel frontend → Render API → Aiven MySQL.

The project now includes final source-release documentation and is ready for portfolio presentation or clean source packaging. Production credentials and secrets are intentionally excluded from the repository.

## Documentation

- [Backend API](docs/backend-api.md)
- [MySQL Cloud Setup](docs/mysql-cloud-setup.md)
- [Project Specification](docs/project-spec.md)
- [Frontend Portfolio Release Notes](docs/frontend-portfolio-release.md)
- [Source Release Guide](docs/source-release.md)

## Author

**Lê Phạm Nhật Lễ**  
CPE & Network Support / IT Helpdesk

GitHub: [LePhamNhatLe](https://github.com/LePhamNhatLe)

---

# Tiếng Việt

## Giới thiệu

**IT Support Portal** là hệ thống Helpdesk và quản lý hạ tầng IT full-stack, mô phỏng quy trình làm việc thực tế của bộ phận IT Helpdesk / Technical Support.

Dự án bao gồm quản lý phiếu hỗ trợ, thiết bị IT, người dùng và phân quyền, thiết bị mạng, dashboard, báo cáo, cài đặt hệ thống, xác thực backend và lưu trữ MySQL.

Dự án được xây dựng theo hướng portfolio kỹ thuật và source code có thể tái sử dụng để demo, tùy biến hoặc tiếp tục phát triển thành công cụ nội bộ.

## Demo trực tuyến

Frontend:

```text
https://it-support-portal-snowy.vercel.app
```

Backend health endpoint:

```text
https://it-support-portal-api.onrender.com/api/v1/health
```

Kiến trúc production:

```text
Vercel frontend
      ↓
Render Express API
      ↓
Aiven MySQL
```

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
- Phân quyền ticket theo requester / assignee ở backend
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

Backend còn áp dụng quyền chi tiết ở cấp ticket:

- Technical Lead xem và quản lý toàn bộ ticket, phân công technician, quản lý workflow và xóa ticket.
- Technician chỉ xem ticket được assign cho chính mình và chỉ được chuyển các trạng thái workflow được phép.
- User chỉ xem ticket do chính mình tạo, không thể giả requester, tự assign technician hoặc thay đổi các trường workflow được bảo vệ.

Backend cũng bảo vệ tài khoản đang đăng nhập, bao gồm không cho tự hạ role, tự khóa, tự vô hiệu hóa hoặc tự xóa tài khoản.

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

Bộ API/security smoke test hiện tại: **17 test / 17 pass**.

Kiểm tra kết nối database:

```bash
npm run db:ping
```

Frontend regression:

```text
tests/regression.html
```

Manual regression đã được kiểm tra qua 3 role demo đối với login, ticket flow, phân công/xử lý ticket, Users, Devices, Network, Settings, refresh persistence và logout/login persistence khi chạy với MySQL.

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
- Phân quyền ticket theo requester / assignee
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
- P24 Backend Authentication & Security: **DONE**
- P25 Integration & Database Testing: **DONE**
- P26 Deployment: **DONE**
- P27 Final Portfolio / Source Release: **DONE**

## Ghi chú release hiện tại

Authentication và authorization đã hoàn tất với JWT, bcrypt, protected backend routes, bảo vệ module Users, phân quyền ticket theo requester/assignee và kiểm tra quyền ở direct API.

Bộ API/security smoke test đang pass 17/17, manual regression theo role và MySQL persistence đã hoàn tất, đồng thời luồng production đã được xác nhận qua Vercel frontend → Render API → Aiven MySQL.

Dự án hiện đã có tài liệu source release cuối và sẵn sàng dùng làm portfolio hoặc đóng gói source sạch để phát hành/bán. Credential và secret production được cố ý loại khỏi repository.

## Tài liệu

- [Backend API](docs/backend-api.md)
- [MySQL Cloud Setup](docs/mysql-cloud-setup.md)
- [Project Specification](docs/project-spec.md)
- [Frontend Portfolio Release Notes](docs/frontend-portfolio-release.md)
- [Source Release Guide](docs/source-release.md)

## Tác giả

**Lê Phạm Nhật Lễ**  
CPE & Network Support / IT Helpdesk

GitHub: [LePhamNhatLe](https://github.com/LePhamNhatLe)
