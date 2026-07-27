# BMVEI Library Management System - Technical Specifications

**Bishoftu Motor Vehicle Engineering Industry (BMVEI)**

## 1. System Overview

### 1.1 Business Context
The Bishoftu Motor Vehicle Engineering Industry operates an internal technical library containing specialized automotive, engineering, and operational literature. Previously, library management relied on manual logbooks, leading to inconsistencies, difficulties in tracking overdue books, and limited visibility into the catalog. 

This Library Management System (LMS) was developed from the ground up to digitize the entire workflow. It serves librarians by providing efficient check-out/check-in workflows and serves employees by providing a searchable digital catalog and reservation system.

### 1.2 Core Capabilities
* **Real-time Catalog Management:** Track exact counts of total copies versus available copies on the shelf.
* **Borrowing Lifecycle:** Issue books, track due dates, and process returns.
* **Reservation System:** Allow employees to place holds on currently unavailable books. The system seamlessly transitions reservations into active loans upon fulfillment.
* **Automated Overdue Tracking:** A background chron-job automatically audits active loans and flags overdue items.
* **Immutable Auditing:** All critical actions (logins, borrowing, returning, data modifications) are recorded in an append-only audit log for accountability.

## 2. Technical Architecture

### 2.1 Stack Components
* **Client Application:** React 18, bootstrapped via Vite for optimal development experience. State management is split between React Query (server state/caching) and Zustand (client UI state). Styling leverages Tailwind CSS for utility-first design.
* **API Server:** Node.js powered by Express. Structured in a clean layered architecture to decouple routing from business logic.
* **Relational Database:** MySQL 8.0 handles all data persistence, utilizing strict foreign key constraints and InnoDB engine for ACID compliance.

### 2.2 Layered Backend Design
To ensure maintainability, the backend codebase is strictly organized into functional layers:
1. **Routes & Middleware Layer:** Intercepts HTTP requests, validates JWTs, extracts user roles for RBAC (Role-Based Access Control), and sanitizes inputs using Zod schemas.
2. **Controller Layer:** Acts as the traffic cop. It reads validated data from the request object, calls the appropriate service method, and formats the JSON response. Controllers contain zero business logic.
3. **Service Layer:** The core of the application. It orchestrates business workflows, such as checking user borrowing quotas or coordinating a reservation fulfillment.
4. **Repository Layer:** Encapsulates all raw SQL queries (`mysql2` parameterized queries). It abstract the database from the service layer.

## 3. Database Schema Design

The schema is fully normalized (3NF) to prevent data anomalies.

### 3.1 Primary Entities
* `departments`: Lookup table mapping department IDs to department names.
* `users`: Stores all employee, librarian, and admin accounts. Passwords are securely hashed with bcrypt.
* `books`: The central catalog. Includes fields for ISBN, title, author, category, publisher, and tracked quantities (`total_copies`, `available_copies`).
* `borrow_records`: Tracks the lifecycle of a loan. Key fields include `user_id`, `book_id`, `borrow_date`, `due_date`, `return_date`, and `status` (ENUM: 'borrowed', 'returned', 'overdue', 'lost').
* `reservations`: Queue for books with zero available copies. Status transitions from 'pending' to 'fulfilled' or 'cancelled'.
* `audit_logs`: Records `action`, `entity_type`, `entity_id`, and `user_id` alongside a timestamp.

## 4. Key Business Workflows

### 4.1 The Borrowing Transaction
Issuing a book is a critical operation requiring strict concurrency controls.
1. The system checks if the user has reached their maximum allowed active loans.
2. The system verifies the user does not currently hold a copy of the requested book.
3. A MySQL transaction begins.
4. The system executes `SELECT ... FROM books WHERE id = ? FOR UPDATE`. This row-level lock ensures no other process can claim the last available copy concurrently.
5. If `available_copies > 0`, a new row is inserted into `borrow_records` and `books.available_copies` is decremented.
6. The transaction is committed.

### 4.2 Reservation Fulfillment
When a user attempts to borrow a book that is out of stock, they can reserve it. 
When a librarian receives a returned copy, they review the reservation queue. Fulfilling a reservation automatically triggers the borrowing transaction (described above) in the background. The reservation status is updated, and the employee's dashboard dynamically updates to reflect the active loan.

### 4.3 Background Jobs
A dedicated `node-cron` job runs at midnight (server time). It executes an atomic `UPDATE` query against `borrow_records`, changing the status of any record where `status = 'borrowed'` and `due_date < CURRENT_DATE` to `'overdue'`.

## 5. Security & Deployment

### 5.1 Security Measures
* **Authentication:** Dual-token JWT architecture. Short-lived access tokens (15 minutes) are held in memory. Long-lived refresh tokens (7 days) are stored in secure, `HttpOnly`, `SameSite=Strict` cookies to prevent XSS exfiltration and CSRF attacks.
* **SQL Injection:** Absolutely no string concatenation is used for SQL queries. All queries utilize prepared statements via `mysql2`.
* **Rate Limiting:** Protects the `/auth/login` endpoint against brute-force dictionary attacks.

### 5.2 Server Configuration
The production environment utilizes Nginx as a reverse proxy. 
* The React frontend is compiled into static assets (`npm run build`) and served directly by Nginx for high performance.
* API requests (`/api/v1/*`) are proxy-passed to the Node.js process.
* The Node.js application is managed by PM2, ensuring automatic restarts upon crashes and load-balancing across available CPU cores.
