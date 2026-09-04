# IT Support Portal

IT Support Portal is a browser-based internal IT Helpdesk practice project for managing support tickets, IT assets, users, and network infrastructure.

The current frontend is implemented with HTML, CSS, Vanilla JavaScript, and LocalStorage. The project is intentionally structured around practical IT Support / Helpdesk workflows before the backend phase is introduced.

## Project Purpose

The project simulates an internal support portal used by a company to:

- Receive and track IT support requests
- Assign and process tickets by role
- Manage devices and network inventory
- Manage internal users
- Record troubleshooting, comments, work notes, and ticket history
- Review dashboard metrics and reports
- Configure user and system preferences

## User Roles

### Technical Lead

- View all tickets
- Assign and manage tickets
- Manage devices
- Manage users
- Manage network inventory
- View reports
- Manage system settings

### Technician

- View assigned tickets
- Process support requests
- Update ticket status
- Add troubleshooting work notes
- Manage device information
- Manage network inventory

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

## Frontend Modules

### Authentication and Authorization

- Demo account authentication
- Session persistence with LocalStorage
- Role-based navigation
- Route guards
- Role-scoped ticket access
- Locked and disabled account protection

### Ticket Management

- Create and edit tickets
- Search and filter tickets
- Ticket detail view
- Ticket status workflow
- Technician assignment
- Role-based action permissions
- Comments and private work notes
- Automatic system activity history
- Linked device context
- Validation and operation result handling

### Device Management

- Device inventory stored in LocalStorage
- Search and filter by type, status, and department
- Create, edit, and view device details
- IPv4 validation
- Role-based management actions
- Delete protection for devices linked to tickets

### User Management

- Internal user inventory
- Search and filter by role and status
- Create, edit, lock, unlock, disable, and view users
- Self-protection rules for administrative actions
- Delete protection for users referenced by tickets or devices

### Network Inventory

- Router, switch, access point, firewall, server, modem, and other device types
- IPv4, MAC, VLAN, subnet/CIDR, and gateway validation
- Duplicate IP and MAC protection
- Search and filter by type, status, and area
- Role-based create and edit actions
- Technical Lead-only delete action

### Dashboard

- Role-scoped ticket totals
- Open, processing, and resolved ticket summaries
- Recent ticket list
- Device status summary
- Active user count
- Network online and alert summary

### Reports

- Date-range filtering
- Ticket distribution by status, priority, and category
- Resolution and processing metrics
- Average resolution time
- Device and network summaries
- Technician performance table
- Print support
- CSV export with spreadsheet formula-injection protection

### Settings

- Current profile name update
- Per-user preferences
- Light and dark theme preference
- Notification preferences
- Technical Lead-only system settings
- Company name, timezone, language, default priority, and SLA settings

## Regression Coverage

P18 introduced a full frontend regression runner at:

```text
tests/regression.html
```

The runner covers authentication, session handling, permissions, tickets, ticket privacy, devices, users, network inventory, dashboard data, reports, settings, cross-module references, and the module-level regression suites.

Before a release merge, the regression page should be run manually in a browser and confirmed PASS because this repository currently has no automated GitHub Actions workflow.

## UI / UX Status

P19 is currently in progress.

Completed polish includes:

- Shared rounded content surfaces
- Modal-based CRUD flows
- Dark and light themes
- Settings redesign
- Reports layout polish
- Login redesign
- Network overview layout polish
- Dashboard layout polish

Remaining P19 work is primarily responsive cleanup across tablet and mobile breakpoints, long-label wrapping, and horizontal-overflow checks.

## Technology

- HTML5
- CSS3
- JavaScript ES6+
- LocalStorage
- Git and GitHub

## Run Locally

Clone the repository and switch to `develop` while development is active:

```bash
git clone https://github.com/LePhamNhatLe/it-support-portal.git
cd it-support-portal
git switch develop
```

Open `index.html` in a modern browser. A local static server such as VS Code Live Server is recommended during development.

## Current Roadmap

- P11 Ticket Module: DONE
- P12 Device Management: DONE
- P13 User Management: DONE
- P14 Network Inventory: DONE
- P15 Dashboard Integration: DONE
- P16 Reports: DONE
- P17 Settings: DONE
- P18 Full Frontend Regression: DONE
- P19 UI / UX Polish: IN PROGRESS
- P20 README and Frontend Portfolio Release: NEXT
- P21 Node.js + Express Backend: PLANNED
- P22 MySQL: PLANNED
- P23 Frontend / Backend Integration: PLANNED
- P24 Backend Authentication and Security: PLANNED
- P25 Integration and Database Testing: PLANNED
- P26 Deployment: PLANNED
- P27 Final Portfolio Release: PLANNED

## Frontend Demo Limitations

This phase is intentionally frontend-only:

- Authentication is demo authentication, not production security
- Data is stored in browser LocalStorage
- Password changes and account deletion are not simulated as fake backend operations
- Multi-device sessions are not available
- No server-side authorization exists yet
- No database exists yet

These limitations are planned to be addressed during the backend phases.

## Author

**Lê Phạm Nhật Lễ**  
CPE & Network Support / IT Helpdesk

[GitHub Profile](https://github.com/LePhamNhatLe)
