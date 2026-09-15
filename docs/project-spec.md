# IT Support Portal - Project Specification

## 1. Project Overview

IT Support Portal is a browser-based internal IT Helpdesk application used to simulate practical support operations inside a company.

The current release is frontend-only and uses HTML, CSS, Vanilla JavaScript, seed data, and LocalStorage. It models realistic relationships between support tickets, employees, IT assets, network devices, permissions, and operational reports.

## 2. Objectives

- Receive and track IT support tickets
- Enforce role-based ticket visibility and actions
- Assign technicians and manage ticket lifecycle transitions
- Record comments, work notes, and activity history
- Manage company IT assets and ownership information
- Manage internal users and account status
- Maintain network-device inventory and addressing information
- Provide role-aware dashboard metrics and reports
- Model cross-module dependency protection
- Provide a stable frontend baseline before backend integration

## 3. User Roles

### Technical Lead

Responsible for overall IT support operations.

Permissions include:

- View and manage all tickets
- Assign and reassign technicians
- Edit ticket details and status
- Manage users
- Manage devices
- Manage network inventory
- View reports
- Manage system settings

### Technician

Responsible for operational support work.

Permissions include:

- View assigned tickets
- Process support requests
- Update allowed ticket states
- Add comments and private work notes
- Manage device information
- Manage network inventory
- Access personal settings

### User

Company employee requesting IT support.

Permissions include:

- Create support tickets
- View own tickets
- Add comments to accessible tickets
- Reopen eligible tickets
- Access personal settings

## 4. Main Modules

1. Login
2. Dashboard
3. Tickets
4. Ticket Detail
5. Devices
6. Users
7. Network
8. Reports
9. Settings
10. Frontend Regression Runner

## 5. Ticket Access Rules

- Technical Lead: all tickets
- Technician: tickets assigned to the signed-in technician
- User: tickets requested by the signed-in user

Unauthorized page or ticket access must fail closed.

## 6. Ticket Workflow

```text
OPEN
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ├─→ PENDING
  └─→ RESOLVED
         ↓
       CLOSED
         ↓
      REOPENED
         ↓
      ASSIGNED
```

The frontend validates both role permissions and allowed next states before applying a status transition.

## 7. Ticket Data and Activity

A ticket can contain:

- Ticket ID
- Title
- Description
- Category
- Priority
- Status
- Requester identity
- Assigned technician
- Department
- Linked device ID
- Created and updated timestamps
- Comments
- Private work notes
- Activity/history entries

## 8. Device Management

The device inventory models common IT assets such as desktops, laptops, printers, routers, switches, access points, servers, and other equipment.

Tracked information includes:

- Device ID and name
- Device type
- Status
- Assigned user
- Department
- IPv4 address
- Serial number
- Purchase date
- Notes

Business rules include IPv4 validation and delete protection for devices referenced by support tickets.

## 9. User Management

The user module supports:

- Internal user inventory
- Roles
- Department information
- Phone number
- Active, disabled, and locked status
- Create and edit operations
- Lock and unlock actions
- Administrative self-protection
- Dependency protection when a user is referenced by tickets or devices

## 10. Network Inventory

Tracked network fields include:

- Device ID and name
- Device type
- IPv4 address
- MAC address
- VLAN
- Subnet/CIDR
- Gateway
- Area/location
- Management URL
- Uptime
- Status
- Notes

Validation includes:

- IPv4 format
- MAC format
- VLAN range
- Subnet/CIDR format
- Gateway format
- Duplicate IP protection
- Duplicate MAC protection

## 11. Dashboard

Dashboard metrics are role-aware and summarize:

- Total accessible tickets
- Open tickets
- Processing tickets
- Resolved/closed tickets
- Recent tickets
- Device status totals
- Active users
- Network online and alert totals

## 12. Reports

The reports module provides:

- Date-range filtering
- Ticket distribution by status
- Ticket distribution by priority
- Ticket distribution by category
- Resolution rate
- Processing rate
- Average resolution time
- Device and network summaries
- Technician performance table
- Print support
- CSV export with spreadsheet formula-injection protection

## 13. Settings

Settings include:

- Current display name
- Light/dark theme preference
- Notification preferences
- Technical Lead-only company settings
- Timezone
- Language
- Default priority
- Default SLA hours

Per-user settings are stored separately by account.

## 14. Shared Frontend Services

The frontend uses shared global APIs where required:

- `window.AppStorage`
- `window.AppPermissions`
- `window.AppUI`

The stored current user object is intentionally limited to:

```text
{ email, name, role }
```

## 15. UI / UX Requirements

The frontend release includes:

- Responsive desktop/tablet/mobile layout
- Mobile sidebar navigation
- Shared topbar
- Light and dark technology-oriented themes
- Modal-based CRUD flows
- Shared action-button hierarchy
- Responsive card grids
- Table overflow containment
- Long-label wrapping

## 16. Testing

The regression runner is located at:

```text
tests/regression.html
```

It covers authentication, sessions, permissions, ticket behavior and privacy, device/user/network operations, dashboard data, reports, settings, cross-module references, and module regression suites.

Regression scripts remain separate from production pages.

## 17. Frontend Release Status

- P11 Ticket Module: DONE
- P12 Device Management: DONE
- P13 User Management: DONE
- P14 Network Inventory: DONE
- P15 Dashboard Integration: DONE
- P16 Reports: DONE
- P17 Settings: DONE
- P18 Full Frontend Regression: DONE
- P19 UI / UX Polish: DONE
- P20 README and Frontend Portfolio Release: DONE

The next implementation phase is P21 Node.js + Express Backend.

## 18. Known Frontend Limitations

- Authentication is demo-only
- Data is browser-local
- No backend API exists yet
- No database exists yet
- No server-side authorization exists yet
- Password changes and account deletion are deferred to backend implementation
- Multi-device sessions are not supported
