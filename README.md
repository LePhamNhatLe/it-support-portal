# IT Support Portal

A browser-based practice project that simulates an internal IT Helpdesk workflow for creating, assigning, tracking, and resolving technical support requests.

## Current Features

- Create tickets with title, category, priority, requester, and issue description
- Generate incident IDs automatically
- Assign a technician
- Move tickets through the support workflow
- Record troubleshooting and resolution notes
- Filter tickets by status
- View totals for all, open, in-progress, and resolved tickets
- Delete tickets
- Save prototype data in browser LocalStorage
- Responsive layout for desktop and mobile

## Ticket Workflow

`New → Assigned → In Progress → Waiting for User → Resolved → Closed`

Each ticket can contain:

- Category and priority
- Requester and assigned technician
- Symptoms and issue details
- Troubleshooting steps
- Resolution notes
- Current status

## Technology

- HTML5
- CSS3
- JavaScript
- LocalStorage
- Git and GitHub

## Run Locally

No installation or backend is required.

```bash
git clone https://github.com/LePhamNhatLe/it-support-portal.git
cd it-support-portal
```

Open `index.html` in a modern web browser.

## Project Status

**Working prototype.**

The current version demonstrates the main ticket lifecycle. Planned improvements include:

- [ ] Separate Technical Lead, Technician, and End User roles
- [ ] User and device records
- [ ] Ticket comments and status history
- [ ] Search, category filters, and SLA indicators
- [ ] Backend API and database
- [ ] Authentication and role-based access control
- [ ] Reports and asset-management modules

## Purpose

This project supports practical learning in:

- IT Helpdesk ticket workflows
- Incident prioritization
- Technician assignment
- Troubleshooting documentation
- Root-cause and resolution recording
- Basic IT support system design

## Author

**Lê Phạm Nhật Lễ**  
CPE & Network Support / IT Helpdesk

[GitHub Profile](https://github.com/LePhamNhatLe)
