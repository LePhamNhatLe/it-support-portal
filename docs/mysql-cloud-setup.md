# P22 MySQL Cloud Setup

The backend is designed to keep the laptop lightweight. No MySQL Server, MySQL Workbench, Docker, phpMyAdmin, or other database GUI is required locally.

## Architecture

```text
Browser frontend
      |
Node.js + Express (local during development)
      |
mysql2 connection pool
      |
MySQL-compatible cloud database
      |
Provider web dashboard
```

## 1. Create a cloud database

Use a MySQL-compatible cloud provider with a web dashboard. Create one database and copy the connection values supplied by the provider:

- host
- port
- username
- password
- database name
- SSL requirement

Do not commit credentials to GitHub.

## 2. Create local .env

Copy `.env.example` to `.env` and set:

```env
DATA_SOURCE=mysql
DB_HOST=your-cloud-host
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=it_support_portal
DB_SSL=true
DB_CONNECTION_LIMIT=4
```

A connection limit of 4 is intentionally conservative for development and low laptop resource usage.

## 3. Install the lightweight driver

```bash
npm install
```

Only `mysql2` is added. No local database service is required.

## 4. Test the connection

```bash
npm run db:ping
```

## 5. Create schema

```bash
npm run db:migrate
```

This executes `server/database/schema.sql`.

## 6. Add demo data

```bash
npm run db:seed
```

The seed is idempotent and can be run again without creating duplicate demo IDs.

## 7. Start the API

```bash
npm run dev
```

Then test:

```text
http://localhost:3000/api/v1/health
http://localhost:3000/api/v1/users
http://localhost:3000/api/v1/tickets
http://localhost:3000/api/v1/devices
http://localhost:3000/api/v1/network
```

## Development fallback

If cloud credentials are unavailable, keep:

```env
DATA_SOURCE=memory
```

The same API routes continue to work using the P21 in-memory store. Switching to `mysql` changes the repository implementation without changing the route URLs.

## Security notes

- `.env` is ignored by Git.
- Keep cloud credentials private.
- Use SSL for cloud MySQL when supported or required.
- Authentication/JWT and production authorization remain part of P24.
