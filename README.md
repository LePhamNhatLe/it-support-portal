# IT Support Portal

A portfolio project that simulates an internal IT Helpdesk / Technical Support portal for support tickets, IT assets, users, network devices, reports, settings, and role-based workflows.

The current stack is **HTML5, CSS3, Vanilla JavaScript, Node.js, Express, and MySQL**. The frontend can use LocalStorage as a compatibility cache/fallback while operational data is synchronized through the backend API.

## Portfolio Highlights

- Technical Lead, Technician, and User role model
- End-to-end ticket workflow with assignment, status transitions, comments, work notes, and activity history
- IT asset inventory with ownership, IP data, lifecycle status, and ticket references
- User management with roles, lock/disable status, phone, and dependency protection
- Network inventory with IPv4, MAC, VLAN, subnet/CIDR, gateway, status, and uptime
- Role-aware dashboard and operational reports
- System settings persisted through Express/MySQL
- Personal UI preferences stored locally per browser/user
- Responsive technology-oriented light/dark UI
- Frontend regression runner and backend API smoke tests

## Architecture

```text
Browser / Vanilla JS frontend
        ↓
AppApi + P23 integration bridge
        ↓
Express REST API /api/v1
        ↓
Repository selector
   ├─ MySQL store     production-like development path
   └─ Memory store    zero-setup fallback/testing
        ↓
MySQL / Aiven cloud database
```

The frontend still uses LocalStorage for compatibility caching and personal browser preferences. Operational records such as users, devices, network inventory, tickets, and system settings are synchronized through the backend.

## Main Modules

| Module | Purpose |
| --- | --- |
| Login | Demo authentication until P24 backend authentication |
| Dashboard | Role-scoped operational overview |
| Tickets | Create, filter, assign, process, and track support requests |
| Ticket Detail | Workflow actions, notes, comments, history, and device context |
| Devices | IT asset inventory and assignment |
| Users | Internal users, roles, status, phone, and access administration |
| Network | Router/switch/AP/firewall/server/modem inventory |
| Reports | Ticket, device, network, and technician summaries |
| Settings | Personal preferences and server-persisted system defaults |

## Demo Accounts

Authentication is still frontend demo authentication until P24.

| Role | Email | Password |
| --- | --- | --- |
| Technical Lead | `lead@itsupport.local` | `123456` |
| Technician | `technician@itsupport.local` | `123456` |
| User | `user@itsupport.local` | `123456` |

Accounts created through the Users module are stored in MySQL, but they will not become real login credentials until P24 adds backend authentication and password hashes.

## API

Default local API:

```text
http://localhost:3000/api/v1
```

Main endpoints:

```text
GET    /health
GET    /reports/summary
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
GET    /settings
PATCH  /settings
```

`GET /health` reports the active `dataSource` (`mysql` or `memory`) without exposing credentials.

## MySQL

The database uses InnoDB and `utf8mb4` with foreign keys and uniqueness rules for operational data.

P23.5 aligns the server model with the frontend by persisting:

- User `phone`, `createdAt`, and `updatedAt`
- Ticket `resolvedAt`
- System settings
- Existing user/device/ticket/network relationships

The migration script is idempotent and upgrades databases created before P23.5.

## Run Locally

```bash
git clone https://github.com/LePhamNhatLe/it-support-portal.git
cd it-support-portal
git switch develop
npm install
```

Copy `.env.example` to `.env`. For the cloud-MySQL path set:

```env
DATA_SOURCE=mysql
```

Then run:

```bash
npm run db:ping
npm run db:migrate
npm run db:seed
npm run dev
```

Serve the frontend with a small static server such as VS Code Live Server.

## Testing

Frontend regression runner:

```text
tests/regression.html
```

Backend/API checks:

```bash
npm run check:server
npm run test:api
```

Useful manual persistence check:

```text
create/update record in frontend
→ verify through /api/v1/... endpoint
→ refresh frontend
→ record must remain
```

For MySQL specifically, `GET /api/v1/health` should report:

```json
{"dataSource":"mysql"}
```

inside the standard API response data object.

## Validation and Data Integrity

Current protections include:

- IPv4 validation
- MAC validation
- VLAN and subnet/CIDR validation
- Duplicate IP/MAC checks
- Unique user email and device serial constraints
- Foreign-key protection for related users/devices/tickets
- Semantic API mapping for duplicate and foreign-key database errors
- Device/user dependency protection in frontend workflows
- CSV spreadsheet formula-injection protection

P24 will move authorization enforcement and authentication security to the backend.

## Current Roadmap

- P11 Ticket Module: **DONE**
- P12 Device Management: **DONE**
- P13 User Management: **DONE**
- P14 Network Inventory: **DONE**
- P15 Dashboard Integration: **DONE**
- P16 Reports: **DONE**
- P17 Settings: **DONE**
- P18 Full Frontend Regression: **DONE**
- P19 UI / UX Polish: **DONE**
- P20 README and Frontend Portfolio Release: **DONE**
- P21 Node.js + Express Backend: **DONE**
- P22 MySQL: **DONE**
- P23 Frontend / Backend Integration: **DONE**
- P23.5 Integration Stabilization: **DONE at code level, runtime verification required after migration**
- P24 Backend Authentication and Security: **NEXT**
- P25 Integration and Database Testing: **PLANNED**
- P26 Deployment: **PLANNED**
- P27 Final Portfolio Release: **PLANNED**

## Current Security Limitation

The API and MySQL layers are implemented, but login is still the legacy demo authentication mechanism. Server-side authentication, password hashing, authenticated sessions/tokens, and server-side role authorization are intentionally deferred to P24.

Do not treat the current branch as production-secure before P24 and P25 are complete.

## Documentation

- [Backend API](docs/backend-api.md)
- [MySQL Cloud Setup](docs/mysql-cloud-setup.md)
- [Project Specification](docs/project-spec.md)
- [Frontend Portfolio Release Notes](docs/frontend-portfolio-release.md)

## Author

**Lê Phạm Nhật Lễ**  
CPE & Network Support / IT Helpdesk

GitHub: [LePhamNhatLe](https://github.com/LePhamNhatLe)
