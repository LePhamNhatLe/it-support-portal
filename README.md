# IT Support Portal

A frontend portfolio project that simulates an internal IT Helpdesk / Technical Support portal for handling support tickets, IT assets, users, network devices, reports, and role-based workflows.

The project is built with **HTML5, CSS3, Vanilla JavaScript, and LocalStorage**. It focuses on practical Helpdesk / CPE / IT Support scenarios first, before the backend and database phases are introduced.

## Portfolio Highlights

- Role-based access for **Technical Lead, Technician, and User**
- End-to-end ticket workflow with assignment, status transitions, comments, work notes, and activity history
- IT asset inventory with user/device relationships and linked-ticket protection
- User administration with role/status controls and self-protection rules
- Network inventory with IPv4, MAC, VLAN, subnet/CIDR, and gateway validation
- Role-aware dashboard metrics and recent-ticket views
- Reports with date filtering, technician performance summaries, printing, and CSV export
- Per-user settings, light/dark themes, and Technical Lead system settings
- Shared responsive UI system for desktop, tablet, and mobile
- Frontend regression runner covering cross-module business rules

## What This Project Demonstrates

This repository is designed to demonstrate practical skills relevant to **IT Helpdesk, Technical Support, CPE, Network Support, and junior system-support roles**:

- Understanding of ticket lifecycle and support escalation flow
- Translating IT operations into usable internal tools
- User, device, and network inventory management
- Validation of IPv4, MAC, VLAN, subnet/CIDR, and gateway data
- Role-based authorization and fail-closed page guards
- Troubleshooting history and operational traceability
- LocalStorage data modelling and cross-module references
- Responsive UI implementation and frontend regression testing
- Git / GitHub development workflow using a dedicated `develop` branch

## Main Modules

| Module | Purpose |
| --- | --- |
| Login | Demo authentication and session handling |
| Dashboard | Role-scoped ticket, device, user, and network summaries |
| Tickets | Create, filter, assign, process, comment, and track support requests |
| Ticket Detail | Workflow actions, work notes, comments, history, and linked device context |
| Devices | IT asset inventory, ownership, IP, status, and lifecycle management |
| Users | Internal user inventory, roles, status, lock/unlock, and dependency protection |
| Network | Router/switch/AP/firewall/server/modem inventory and network validation |
| Reports | Operational summaries, technician performance, print, and CSV export |
| Settings | Account preferences, theme, notifications, and system defaults |

## User Roles

### Technical Lead

- View and manage all tickets
- Assign and reassign technicians
- Manage devices, users, and network inventory
- View reports
- Manage system settings

### Technician

- View assigned tickets
- Process technical support requests
- Update ticket status
- Add troubleshooting work notes
- Manage device and network information

### User

- Create support tickets
- View own tickets
- Add comments to accessible tickets
- Manage personal preferences

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Technical Lead | `lead@itsupport.local` | `123456` |
| Technician | `technician@itsupport.local` | `123456` |
| User | `user@itsupport.local` | `123456` |

## Ticket Workflow

```text
OPEN
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ↓
PENDING / RESOLVED
  ↓
CLOSED
  ↓
REOPENED
  ↓
ASSIGNED
```

The frontend validates allowed next states and role permissions before applying ticket operations.

## Technical Architecture

```text
index.html
   ↓
Login / route guard
   ↓
Role-aware application pages
   ↓
Shared JS services
   ├─ AppStorage
   ├─ Auth / session
   ├─ AppPermissions
   ├─ Ticket operations
   ├─ AppUI
   └─ Module controllers
   ↓
LocalStorage-backed demo data
```

Key implementation rules:

- `window.AppStorage` is the shared storage API
- `window.AppPermissions` is the shared permission API
- `currentUser` contains only `email`, `name`, and `role`
- Page guards fail closed when permissions are missing
- Ticket access is scoped by role and requester/assignee ownership
- CRUD operations return structured results where applicable
- Production pages do not load regression scripts

## Validation and Data Integrity

The frontend includes validation and dependency protection for practical IT-management data:

- IPv4 address validation
- MAC address validation
- VLAN range validation
- Subnet/CIDR validation
- Gateway validation
- Duplicate IP/MAC checks in network inventory
- Device deletion protection when referenced by tickets
- User deletion protection when referenced by tickets or devices
- Administrative self-protection rules
- CSV spreadsheet formula-injection protection

## UI / UX

P19 UI / UX polish is complete at code level.

Highlights include:

- Technology-oriented light and dark themes
- Shared rounded card surfaces
- Modal-based CRUD flows
- Unified blue action-button hierarchy
- Responsive topbar and mobile navigation
- Responsive overview grids
- Table overflow containment
- Long-label wrapping
- Shared desktop/tablet/mobile layout behavior
- CSS loading cleanup to reduce theme/action-style flashing

## Regression Testing

The project includes a frontend regression runner at:

```text
tests/regression.html
```

Coverage includes:

- Authentication and session behavior
- Page and action permissions
- Ticket lifecycle and privacy
- Device management
- User management
- Network inventory
- Dashboard metrics
- Reports
- Settings
- Cross-module data references
- Module-level regression suites

The regression runner is isolated from production pages. Manual browser smoke testing remains recommended before release because the repository does not yet use GitHub Actions.

## Demo Walkthrough

For a quick portfolio review:

1. Sign in as **Technical Lead** to review the complete portal, reports, users, devices, network inventory, and system settings.
2. Open **Tickets** and inspect assignment, edit, status-transition, comment, and work-note flows.
3. Open **Devices** to review IT asset ownership, IP information, filtering, and dependency protection.
4. Open **Network** to review network-device fields and validation rules.
5. Sign in as **Technician** to confirm scoped ticket access and operational actions.
6. Sign in as **User** to confirm requester-only ticket visibility and personal settings.
7. Open `tests/regression.html` to run the frontend regression suite.

## Project Structure

```text
it-support-portal/
├─ css/                 Shared styles, theme, polish, reports, action system
├─ data/                Seed data
├─ docs/                Project specification and portfolio release notes
├─ js/                  Auth, permissions, storage, modules, UI, regression helpers
├─ pages/               Application pages
├─ tests/               Full frontend regression runner
├─ index.html           Entry point
└─ README.md            Portfolio overview
```

## Run Locally

```bash
git clone https://github.com/LePhamNhatLe/it-support-portal.git
cd it-support-portal
git switch develop
```

Open the project with a local static server. VS Code Live Server is recommended.

Example local entry point:

```text
http://127.0.0.1:5500/
```

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
- P21 Node.js + Express Backend: **NEXT**
- P22 MySQL: **PLANNED**
- P23 Frontend / Backend Integration: **PLANNED**
- P24 Backend Authentication and Security: **PLANNED**
- P25 Integration and Database Testing: **PLANNED**
- P26 Deployment: **PLANNED**
- P27 Final Portfolio Release: **PLANNED**

## Frontend Demo Limitations

This release is intentionally frontend-only:

- Authentication is demo authentication, not production security
- Data is stored in browser LocalStorage
- No backend API or database exists yet
- Password changes and account deletion are intentionally deferred
- Multi-device sessions are not available
- Server-side authorization is not implemented yet

These limitations become implementation targets beginning with P21.

## Documentation

- [Project Specification](docs/project-spec.md)
- [Frontend Portfolio Release Notes](docs/frontend-portfolio-release.md)

## Author

**Lê Phạm Nhật Lễ**  
CPE & Network Support / IT Helpdesk

GitHub: [LePhamNhatLe](https://github.com/LePhamNhatLe)
