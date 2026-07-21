# BMVEI Library Management System

An enterprise-grade Library Management System built for **Bishoftu Motor Vehicle
Engineering Industry (BMVEI)** — replacing paper-based library records with a
secure, role-based, LAN-deployable web application.

---

## 1. Tech Stack

**Frontend:** React 18 + Vite, Tailwind CSS, React Router, Axios, React Hook Form + Zod,
TanStack Query & Table, Zustand, React Hot Toast, Recharts, Lucide Icons, Framer Motion, Day.js

**Backend:** Node.js + Express, MySQL (via `mysql2`), JWT auth, bcrypt, layered
architecture (Controllers → Services → Repositories → Database)

**Security:** Helmet, CORS allow-list, rate limiting, HPP, input sanitization (XSS),
parameterized queries (SQLi-safe), RBAC, account lockout, audit logging, centralized
error handling

---

## 2. Project Structure

```
bmvei-lms/
├── backend/
│   ├── src/
│   │   ├── config/          # env, database pool, logger
│   │   ├── controllers/     # HTTP request/response handling
│   │   ├── services/        # business logic
│   │   ├── repositories/    # SQL data access (parameterized queries only)
│   │   ├── routes/          # Express routers
│   │   ├── middleware/      # auth, RBAC, security, error handling, uploads
│   │   ├── validators/      # express-validator input rules
│   │   ├── utils/           # AppError, token helpers, export utils
│   │   ├── jobs/            # background jobs (overdue flagging)
│   │   ├── app.js           # Express app wiring
│   │   └── server.js        # entrypoint
│   ├── database/
│   │   ├── schema.sql       # full normalized MySQL schema
│   │   ├── migrate.js       # applies schema.sql
│   │   └── seed.js          # creates the admin account (real bcrypt hash)
│   ├── uploads/              # book covers + generated QR codes (gitignored)
│   ├── logs/                 # rotating application/error logs (gitignored)
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/               # axios client + endpoint definitions
    │   ├── components/        # ui/, layout/, books/, borrow/, users/, common/
    │   ├── pages/              # route-level pages
    │   ├── store/               # zustand auth + UI state
    │   ├── hooks/                # useDebounce, useLookups
    │   └── utils/                # formatting helpers
    └── .env.example
```

---

## 3. Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+ (MySQL Workbench recommended for inspecting the schema)

### 3.1 Database
```bash
mysql -u root -p -e "CREATE USER 'bmvei_app'@'%' IDENTIFIED BY 'change_me_strong_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON bmvei_lms.* TO 'bmvei_app'@'%'; FLUSH PRIVILEGES;"
```

### 3.2 Backend
```bash
cd backend
cp .env.example .env
# Edit .env: set DB_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (32+ random chars each),
# and ADMIN_DEFAULT_PASSWORD for the seed step below.

npm install
npm run migrate     # applies backend/database/schema.sql
npm run seed         # creates the admin account using a real bcrypt hash (never hardcoded)
npm run dev            # starts the API on http://localhost:5000 with nodemon
```

Generate strong JWT secrets, e.g.:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3.3 Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev    # starts Vite dev server on http://localhost:5173, proxies /api to :5000
```

Log in with the username/password you set as `ADMIN_DEFAULT_USERNAME` /
`ADMIN_DEFAULT_PASSWORD` in `backend/.env` before seeding. **Change this password
immediately** via the Profile page after first login.

---

## 4. Building For Production

```bash
cd frontend
npm run build      # outputs static assets to frontend/dist/
```

Serve `frontend/dist/` with any static file server or reverse proxy (nginx example below).
The backend runs as a standalone Node process (`npm start` from `backend/`, or under a
process manager like `pm2`/`systemd` for production).

---

## 5. LAN Deployment (Local Server)

This system is designed to run on a dedicated internal server on BMVEI's LAN, accessible
to workstations via the server's local IP.

1. **Provision the server**: Node.js 18+, MySQL 8+, nginx (recommended reverse proxy).
2. **Clone/copy this project** to the server, e.g. `/opt/bmvei-lms`.
3. **Backend**: follow section 3.2 above with production values in `.env`
   (`NODE_ENV=production`, strong secrets, real DB credentials). Run with a process
   manager so it restarts on crash/reboot:
   ```bash
   npm install -g pm2
   cd /opt/bmvei-lms/backend
   pm2 start src/server.js --name bmvei-lms-api
   pm2 save
   pm2 startup
   ```
4. **Frontend**: build static assets (`npm run build` in `frontend/`) and serve them
   via nginx, proxying `/api` and `/uploads` to the backend:

   ```nginx
   server {
       listen 80;
       server_name 192.168.1.50;   # the server's LAN IP or internal hostname

       root /opt/bmvei-lms/frontend/dist;
       index index.html;

       location / {
           try_files $uri /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /uploads/ {
           proxy_pass http://127.0.0.1:5000;
       }
   }
   ```
5. Update `backend/.env`: `CLIENT_URL=http://192.168.1.50` (matches the CORS allow-list).
6. Workstations on the LAN access the system at `http://192.168.1.50`.
7. **Cloud migration path**: because the backend is a stateless Express API behind
   environment-driven config, this same codebase can be redeployed to any cloud VM,
   container platform, or PaaS later — just point `DB_HOST` at a managed MySQL instance
   and update `CLIENT_URL`/CORS accordingly. No code changes required.

---

## 6. Security Notes

- **Passwords**: hashed with bcrypt (cost factor configurable, default 12). Policy enforced
  both client- and server-side: 8+ chars, upper, lower, number, special character.
- **Account lockout**: after `MAX_FAILED_LOGIN_ATTEMPTS` (default 5) failed logins, the
  account locks for `ACCOUNT_LOCK_MINUTES` (default 15).
- **JWT**: short-lived access tokens (15 min default) + httpOnly, sameSite=strict refresh
  cookie (7 days default). Access tokens are never stored in a cookie.
- **RBAC**: enforced server-side on every protected route via `authorize(...)` middleware —
  the frontend nav/route guards are a UX convenience, not the security boundary.
- **SQL injection**: all queries go through parameterized placeholders via `mysql2`;
  multi-statement execution is disabled by default on the runtime pool.
- **XSS**: all request bodies/params/query strings are sanitized before reaching
  controllers.
- **Rate limiting**: general API limiter + a stricter limiter on `/auth/*` endpoints to
  slow brute-force attempts.
- **Audit logging**: every create/update/delete, login attempt, password change, and
  report export is recorded in `audit_logs` with actor, IP, and timestamp.
- **File uploads**: restricted to JPEG/PNG/WEBP, size-capped, renamed to random filenames
  (no path traversal / overwrite risk).
- **Secrets**: nothing sensitive is hardcoded. `backend/.env` is gitignored; only
  `.env.example` (no real values) is committed. The admin account is created via
  `npm run seed`, which generates a genuine bcrypt hash at run time — never a
  precomputed/shared hash in source control.

**Before going live:** change the seeded admin password, generate fresh JWT secrets,
set `NODE_ENV=production`, and review `backend/.env` for any placeholder values.

---

## 7. Default Roles & Permissions

| Role | Capabilities |
|---|---|
| **Admin** | Full access: user management, all lookup data, reports, audit logs, system settings |
| **Librarian** | Book/borrow/return/reservation management, member lookup, reports |
| **User (Employee)** | Search catalog, view own borrowing history, reserve unavailable books, manage own profile |

---

## 8. Known Simplifications / Follow-ups

These are flagged intentionally rather than silently built in:

- **Email delivery** for password resets is not wired to a real provider — in
  non-production mode the API returns the reset token directly in the response so the
  flow is testable end-to-end. Wire in SMTP/SendGrid/SES in `authService.requestPasswordReset`
  before production use.
- **RFID/barcode scanning** is not implemented (out of scope per the spec, which asked
  only that the QR module be designed to support this later). The QR payload format
  (`{ type, bookId }`) is deliberately simple so it's easy to extend to other scan types.
- **Backup management** (mentioned under Admin permissions) is an infrastructure/ops
  concern — set up routine `mysqldump` cron jobs and file-system backups of `backend/uploads/`
  as part of your deployment, rather than a UI feature.

---

## 9. License / Internal Use

Built for internal use by Bishoftu Motor Vehicle Engineering Industry. Not intended for
public distribution.
