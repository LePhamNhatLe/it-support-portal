# Source Release Guide

This document defines the final source-code release package for **IT Support Portal**.

## Release Scope

The source package contains the complete application source required to run, customize, test, and deploy the project:

- Vanilla HTML/CSS/JavaScript frontend
- Node.js + Express backend
- MySQL repository layer
- Database migration and seed scripts
- JWT authentication and role authorization
- Automated backend/API smoke tests
- Frontend regression page
- Deployment-ready configuration examples
- Technical documentation

The package intentionally does **not** include private credentials, production secrets, local environment files, private CA files, `node_modules`, or generated deployment metadata.

## Production Reference

Current hosted demo architecture:

```text
Browser
  ↓
Vercel frontend
  ↓
Render Express API
  ↓
Aiven MySQL
```

Live demo:

```text
https://it-support-portal-snowy.vercel.app
```

Backend health endpoint:

```text
https://it-support-portal-api.onrender.com/api/v1/health
```

## Buyer / Evaluator Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and provide your own values for database credentials, JWT secret, CORS origin, and SSL settings.

Never reuse credentials from another deployment and never commit `.env` to source control.

### 3. Prepare MySQL

```bash
npm run db:ping
npm run db:migrate
npm run db:seed
```

### 4. Run backend locally

```bash
npm run dev
```

### 5. Serve frontend

Serve the repository root with a static web server such as VS Code Live Server.

When using a different hosted backend, set the frontend API base URL accordingly before deployment.

## Demo Accounts

After running the seed script:

| Role | Email | Password |
| --- | --- | --- |
| Technical Lead | `lead@itsupport.local` | `123456` |
| Technician | `technician@itsupport.local` | `123456` |
| User | `user@itsupport.local` | `123456` |

These are demonstration credentials only. Change or remove them for any real deployment.

## Validation Before Delivery

Recommended release checks:

```bash
npm run check:server
npm run test:api
npm run db:ping
```

Current API/security smoke suite contains 17 tests and is expected to pass before packaging.

Also verify manually:

- Login for all three roles
- Ticket visibility and workflow permissions
- Device and network modules
- User-management restrictions
- Settings persistence
- Logout/login persistence
- Production frontend can reach the configured backend
- Backend can connect to the configured MySQL database

## Files That Must Stay Private

Do not distribute real production values for:

- `.env`
- `.env.local`
- database passwords
- JWT secrets
- private SSL certificates
- service-provider API tokens
- deployment account credentials

The repository includes `.env.example` only as a configuration template.

## Build a Clean ZIP on Windows

The repository includes a PowerShell packaging script that creates a sanitized source ZIP and excludes environment files, Vercel metadata, `node_modules`, `.git`, and private certificate/key files.

From the project root, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\package-release.ps1
```

The generated package is written to:

```text
release/it-support-portal-source.zip
```

The script also creates a staging folder at `release/it-support-portal-source/` so the package contents can be inspected before delivery.

## Suggested Delivery Package

A clean customer/evaluator ZIP should contain the repository source while excluding:

```text
.git/
node_modules/
.env
.env.*
!.env.example
server/certs/*.pem
server/certs/*.crt
server/certs/*.key
.vercel/
```

Include at minimum:

```text
README.md
.env.example
package.json
package-lock.json
index.html
pages/
css/
js/
server/
tests/
docs/
scripts/
```

## Deployment Notes

For a hosted setup similar to the demo:

- Frontend: Vercel or another static host
- Backend: Render or another Node.js host
- Database: Aiven MySQL or another MySQL 8+ provider
- Configure backend `CORS_ORIGIN` to the exact frontend origin
- Configure SSL CA through `DB_CA_CERT` or `DB_CA_PATH` when required
- Keep all production secrets in host environment variables

## Release Status

P27 Final Portfolio / Source Release is complete when:

- README reflects the hosted demo
- deployment has been validated
- this source-release guide is included
- automated tests pass
- the clean packaging script is available for source delivery

Licensing and commercial usage terms are intentionally not defined in this repository. The distributor should provide the appropriate license or sales terms separately when selling or transferring the source code.
