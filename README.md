# IT Support Portal

IT Support Portal is a web-based internal system for managing IT support tickets, devices, users, and network infrastructure.

## Project Purpose

The project simulates an internal IT support system used by a company to manage technical support requests and IT assets.

## User Roles

### Technical Lead
- Manage and assign tickets
- Manage devices
- Manage users
- Manage network inventory
- View reports
- Manage system settings

### Technician
- View assigned tickets
- Handle technical issues
- Update ticket status
- Add troubleshooting notes
- Manage device information
- Manage network inventory

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

### P13 - User Management
- User seed data aligned with demo accounts
- User LocalStorage CRUD
- Search and filter by role and status
- Dynamic user summary
- User detail view
- Create and edit UI
- Role and status management
- Lock and unlock actions
- Self-lock and self-delete protection
- Delete protection for users linked to tickets or devices
- User regression runner

### P14 - Network Inventory
- Network device seed data and LocalStorage CRUD
- Router, switch, access point, firewall, server, modem and other device types
- IPv4, MAC, VLAN, subnet/CIDR and gateway validation
- Duplicate IP/MAC protection
- Search and filter by type, status and area
- Dynamic network summary
- Network device detail view
- Create and edit actions
- Technical Lead and Technician management permissions
- Delete restricted to Technical Lead
- Alert-based operation feedback for the current logic-first phase
- Network regression runner

## Remaining Modules

- Dashboard integration
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
- P13 User Management: DONE
- P14 Network Inventory: DONE
- Next: P15 Dashboard Integration
