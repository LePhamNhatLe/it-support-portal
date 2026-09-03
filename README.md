# IT Support Portal

IT Support Portal is a web-based internal system for managing IT support tickets, devices, users, and network infrastructure.

## Project Purpose

The project simulates an internal IT support system used by a company to manage technical support requests and IT assets.

## User Roles

### Technical Lead
- Manage and assign tickets
- Manage devices
- Manage users
- View reports
- Manage system settings

### Technician
- View assigned tickets
- Handle technical issues
- Update ticket status
- Add troubleshooting notes
- Manage device information

### User
- Create support tickets
- View own tickets
- Add comments

## Completed Modules

### P11 - Ticket Module
- Ticket seed data and LocalStorage persistence
- Create and edit ticket
- Search and filter
- Ticket detail rendering
- Status workflow
- Technician assignment
- Role-based visibility
- Action permissions
- Structured operation results and validation
- Comments and work notes
- Automatic system activity history
- Ticket summary integration
- Ticket regression runner

### P12 - Device Management
- Device seed data linked to ticket `deviceId`
- Device LocalStorage CRUD
- Device validation
- IPv4 validation
- Search and filter by type, status and department
- Dynamic device summary
- Device detail view
- Create and edit UI
- Role-based device management
- Delete protection for devices linked to tickets
- Device regression runner

## Remaining Modules

- Dashboard integration
- User management
- Network inventory
- Reports
- Settings
- Full project regression
- UI polish and portfolio release

## Technology

- HTML5
- CSS3
- JavaScript ES6+
- LocalStorage
- Git
- GitHub
- GitHub Copilot

## Demo Accounts

- Technical Lead: `lead@itsupport.local` / `123456`
- Technician: `technician@itsupport.local` / `123456`
- User: `user@itsupport.local` / `123456`

## Project Status

- P11 Ticket Module: DONE
- P12 Device Management: DONE
- Next: P13 User Management
