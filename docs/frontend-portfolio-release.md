# Frontend Portfolio Release - P20

## Release Summary

P20 closes the frontend portfolio phase of the IT Support Portal.

The frontend now presents a complete browser-based simulation of an internal IT Helpdesk / Technical Support portal, including role-based access, ticket operations, device and user management, network inventory, reports, settings, responsive UI, and regression coverage.

## Release Scope

Completed frontend phases:

- P11 Ticket Module
- P12 Device Management
- P13 User Management
- P14 Network Inventory
- P15 Dashboard Integration
- P16 Reports
- P17 Settings
- P18 Full Frontend Regression
- P19 UI / UX Polish
- P20 README and Frontend Portfolio Release

## Portfolio Positioning

This project is intended to support applications for roles such as:

- IT Helpdesk
- IT Support
- Technical Support
- CPE Support
- Network Support
- Junior System / Infrastructure Support

The project emphasizes operational workflows rather than a generic CRUD demo.

## Key Operational Scenarios

### Support Ticket Lifecycle

The portal models ticket creation, assignment, processing, pending state, resolution, closure, and reopening.

Ticket visibility is role-scoped:

- Technical Lead sees all tickets
- Technician sees assigned tickets
- User sees tickets they requested

### Troubleshooting Traceability

Accessible ticket details can contain:

- Comments
- Private technical work notes
- Activity history
- Assignment changes
- Status changes
- Linked device context

### Asset Management

The device module models company IT assets and relationships between equipment, users, departments, IP information, and support tickets.

Deletion is protected when a device is already referenced by ticket data.

### User Administration

The user module includes role and status administration, lock/unlock behavior, self-protection rules, and dependency checks against ticket/device references.

### Network Inventory

The network module demonstrates practical infrastructure data handling:

- IPv4
- MAC addresses
- VLANs
- Subnet/CIDR
- Gateway
- Device area/location
- Uptime
- Management URL
- Duplicate IP/MAC prevention

### Reporting

Reports summarize ticket operations, infrastructure inventory, and technician performance. CSV export includes spreadsheet formula-injection protection.

## Frontend Architecture

The current frontend uses:

- HTML5 pages
- Shared CSS architecture
- Vanilla JavaScript modules
- Seed data
- LocalStorage-backed persistence
- Role guards and permission helpers
- Shared UI helpers for modal/notification behavior
- A dedicated frontend regression runner

## UI / UX Release State

Code-level P19 polish is complete.

Included:

- Responsive desktop/tablet/mobile behavior
- Shared topbar and mobile navigation
- Technology-oriented light/dark theme
- Responsive summary and overview cards
- Contained table overflow
- Long-label wrapping
- Modal CRUD flows
- Unified action-button styling
- Reduced CSS/theme flashing by static stylesheet loading

## Testing State

Regression runner:

```text
tests/regression.html
```

Coverage includes:

- Authentication
- Session handling
- Permissions
- Ticket workflows
- Ticket privacy
- Device operations
- User operations
- Network operations
- Dashboard metrics
- Reports
- Settings
- Cross-module references
- Module regression suites

A manual browser smoke test is still the final release habit because GitHub Actions has not yet been introduced.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Technical Lead | `lead@itsupport.local` | `123456` |
| Technician | `technician@itsupport.local` | `123456` |
| User | `user@itsupport.local` | `123456` |

## Suggested Portfolio Review Flow

1. Log in as Technical Lead.
2. Review Dashboard metrics and recent tickets.
3. Open Tickets and inspect assignment/status actions.
4. Open a Ticket Detail page and inspect work notes, comments, and history.
5. Review Devices and linked-ticket protection.
6. Review Users and account controls.
7. Review Network fields and validation.
8. Review Reports and CSV/print features.
9. Review Settings and theme behavior.
10. Run the regression page.
11. Repeat key pages with Technician and User accounts to verify role differences.

## Known Limitations

The frontend release is intentionally not a production deployment.

Not yet implemented:

- Node.js / Express API
- MySQL persistence
- Server-side authentication
- Server-side authorization
- Password management
- Multi-device session management
- Production deployment workflow

These are planned for P21-P27.

## Next Phase

**P21 - Node.js + Express Backend**

The next phase will introduce a backend API while preserving the current frontend workflows as the functional reference baseline.
