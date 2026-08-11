# IT Support Portal - Project Specification

## 1. Project Overview

IT Support Portal is an internal web application for managing IT support operations in a company.

The system allows users to submit support requests, technicians to handle technical issues, and technical leads to manage the overall IT support process.

## 2. Objectives

- Manage IT support tickets
- Manage company IT devices
- Manage users
- Manage network devices
- Track ticket status and troubleshooting history
- Provide statistics for IT management

## 3. User Roles

### Technical Lead

Responsible for managing the IT support team and the overall system.

Main permissions:
- View and manage all tickets
- Assign and reassign technicians
- Manage users
- Manage devices
- Manage network devices
- View reports
- Manage system settings

### Technician

Responsible for handling technical support requests.

Main permissions:
- View assigned tickets
- Update ticket status
- Add comments
- Add troubleshooting logs
- Add resolution information
- Manage technical device information

### User

Company employee who requests IT support.

Main permissions:
- Create tickets
- View own tickets
- Add comments
- Reopen unresolved tickets
- View assigned devices

## 4. Main Modules

1. Login
2. Dashboard
3. Tickets
4. Devices
5. Users
6. Network
7. Reports
8. Settings

## 5. Ticket Workflow

```text
OPEN
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ↓
PENDING
  ↓
RESOLVED
  ↓
CLOSED