# BMVEI Library Management System

An enterprise-grade Library Management System built for **Bishoftu Motor Vehicle Engineering Industry (BMVEI)**. This system digitizes the library workflow, replacing paper-based records with a secure, role-based, LAN-deployable web application.

---

## Table of Contents
1. [Overview & Features](#overview--features)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Local Development](#local-development)
5. [Production Deployment](#production-deployment)
6. [Security Architecture](#security-architecture)
7. [User Roles & Permissions](#user-roles--permissions)

---

## Overview & Features

The BMVEI Library Management System provides a comprehensive solution for managing physical library assets across the organization.

**Key Features:**
- **Digital Catalog:** Search, filter, and browse the complete library inventory.
- **Borrowing & Returns:** Track active loans, due dates, and manage returns.
- **Reservations:** Reserve unavailable books and receive automated notifications upon availability.
- **QR Code Integration:** Generate and scan QR codes for quick book identification.
- **Role-Based Access Control:** Distinct workflows for Admins, Librarians, and general Employees.
- **Reporting & Analytics:** Generate insights on library usage, overdue items, and popular resources.
- **Audit Logging:** Comprehensive tracking of all administrative and user actions for accountability.

## Technology Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS, Framer Motion
- **State & Data Fetching:** Zustand, TanStack Query
- **Routing:** React Router
- **Forms & Validation:** React Hook Form + Zod
- **Icons & Charts:** Lucide React, Recharts

### Backend
- **Framework:** Node.js + Express
- **Database:** MySQL 8.0 (via `mysql2`)
- **Authentication:** JWT (JSON Web Tokens), bcrypt
- **Architecture:** Layered Architecture (Controllers → Services → Repositories)
- **Background Tasks:** Scheduled jobs for overdue flagging

## Project Structure

```text
bmvei-lms/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment variables, database pool configuration
│   │   ├── controllers/     # HTTP request handling and response formatting
│   │   ├── services/        # Core business logic
│   │   ├── repositories/    # Database queries and data access layer
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Authentication, authorization, and error handling
│   │   ├── validators/      # Request payload validation rules
│   │   ├── utils/           # Helper functions and custom error classes
│   │   ├── jobs/            # Scheduled background tasks
│   │   └── server.js        # Application entry point
│   ├── database/
│   │   ├── schema.sql       # MySQL database schema definition
│   │   ├── migrate.js       # Database migration execution script
│   │   └── seed.js          # Initial data seeding script
│   └── uploads/             # Storage for book covers and QR codes
└── frontend/
    ├── src/
    │   ├── api/             # Axios client and API endpoint configurations
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Application views and routing components
    │   ├── store/           # Global state management
    │   ├── hooks/           # Custom React hooks
    │   └── utils/           # Utility functions and formatters
    └── public/              # Static assets (images, fonts)
```

## Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MySQL (v8.0 or higher)

### Database Setup
Execute the following commands in your MySQL environment to prepare the database:
```sql
CREATE DATABASE IF NOT EXISTS bmvei_lms;
CREATE USER 'bmvei_app'@'%' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON bmvei_lms.* TO 'bmvei_app'@'%';
FLUSH PRIVILEGES;
```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   *Update the `.env` file with your database credentials and generate secure JWT secrets.*
3. Install dependencies and initialize the database:
   ```bash
   npm install
   npm run migrate
   npm run seed
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The API will be available at `http://localhost:5000`.*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies and start the application:
   ```bash
   npm install
   npm run dev
   ```
   *The web application will be accessible at `http://localhost:5173`.*

## Production Deployment

This system is engineered for internal deployment on the BMVEI Local Area Network (LAN).

### Build Process
1. Build the frontend assets:
   ```bash
   cd frontend
   npm run build
   ```
2. The generated static files will be located in `frontend/dist/`.

### Deployment Configuration (Nginx Example)
A standard Nginx configuration acting as a reverse proxy for the Node.js backend and serving the static frontend files:

```nginx
server {
    listen 80;
    server_name 192.168.1.50; # Replace with actual LAN IP

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

*Ensure the backend is running continuously using a process manager like PM2 (`pm2 start src/server.js`).*

## Security Architecture

The application implements enterprise security standards to protect institutional data:

- **Authentication:** Secure login using bcrypt password hashing and short-lived JWT access tokens paired with HttpOnly refresh cookies.
- **Authorization:** Strict, route-level Role-Based Access Control (RBAC) enforced on the server.
- **Data Protection:** Prevention of SQL Injection through parameterized queries (via `mysql2`).
- **Input Validation:** Comprehensive XSS prevention and request sanitization.
- **Rate Limiting:** Protection against brute-force attacks and DDOS via request throttling.
- **Account Security:** Automatic account lockout mechanisms after consecutive failed login attempts.
- **Audit Trails:** Immutable logging of all sensitive actions, user modifications, and system events.

## User Roles & Permissions

| Role | System Capabilities |
|------|---------------------|
| **Admin** | Complete system access. Manages users, system settings, lookup data, views audit logs, and can access all reports. |
| **Librarian** | Manages library inventory, processes borrows/returns, fulfills reservations, and views relevant operational reports. |
| **Employee** | Can search the catalog, view their own borrowing history, reserve books, and manage their personal profile. |

---
*© BMVEI - Internal Use Only*
