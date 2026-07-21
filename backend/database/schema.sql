-- ============================================================================
-- Bishoftu Motor Vehicle Engineering Industry (BMVEI)
-- Library Management System - Database Schema
-- MySQL 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS bmvei_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bmvei_lms;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,          -- admin | librarian | user
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- DEPARTMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- USERS  (admin, librarian, employee/member)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) DEFAULT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  department_id INT DEFAULT NULL,
  status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  avatar_url VARCHAR(255) DEFAULT NULL,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME DEFAULT NULL,
  last_login_at DATETIME DEFAULT NULL,
  password_changed_at DATETIME DEFAULT NULL,
  reset_password_token VARCHAR(255) DEFAULT NULL,
  reset_password_expires DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE,
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_users_email (email),
  INDEX idx_users_username (username),
  INDEX idx_users_role (role_id),
  INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- AUTHORS
-- ----------------------------------------------------------------------------
CREATE TABLE authors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  bio TEXT DEFAULT NULL,
  nationality VARCHAR(80) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_author_name (full_name)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- PUBLISHERS
-- ----------------------------------------------------------------------------
CREATE TABLE publishers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  address VARCHAR(255) DEFAULT NULL,
  website VARCHAR(255) DEFAULT NULL,
  contact_email VARCHAR(150) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- CATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  parent_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- SHELVES
-- ----------------------------------------------------------------------------
CREATE TABLE shelves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,          -- e.g. A1, B2-ENG
  location_description VARCHAR(255) DEFAULT NULL,
  capacity INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- BOOKS
-- ----------------------------------------------------------------------------
CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  isbn VARCHAR(20) NOT NULL UNIQUE,
  author_id INT DEFAULT NULL,
  publisher_id INT DEFAULT NULL,
  category_id INT DEFAULT NULL,
  shelf_id INT DEFAULT NULL,
  edition VARCHAR(50) DEFAULT NULL,
  publication_year SMALLINT DEFAULT NULL,
  language VARCHAR(50) DEFAULT 'English',
  description TEXT DEFAULT NULL,
  cover_image_url VARCHAR(255) DEFAULT NULL,
  qr_code_path VARCHAR(255) DEFAULT NULL,
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  status ENUM('available','unavailable','archived') NOT NULL DEFAULT 'available',
  added_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_books_author FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
  CONSTRAINT fk_books_publisher FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE SET NULL,
  CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_books_shelf FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE SET NULL,
  CONSTRAINT fk_books_added_by FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_copies CHECK (available_copies >= 0 AND available_copies <= total_copies),
  INDEX idx_books_title (title),
  INDEX idx_books_isbn (isbn),
  INDEX idx_books_status (status),
  FULLTEXT INDEX ft_books_search (title, description)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- BORROW RECORDS  (issue + return tracked in one lifecycle row)
-- ----------------------------------------------------------------------------
CREATE TABLE borrow_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  user_id INT NOT NULL,
  issued_by INT DEFAULT NULL,               -- librarian who processed it
  returned_to INT DEFAULT NULL,              -- librarian who processed return
  borrow_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE DEFAULT NULL,
  status ENUM('borrowed','returned','overdue','lost') NOT NULL DEFAULT 'borrowed',
  renewal_count INT NOT NULL DEFAULT 0,
  notes VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_borrow_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  CONSTRAINT fk_borrow_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_borrow_issued_by FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_borrow_returned_to FOREIGN KEY (returned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_borrow_status (status),
  INDEX idx_borrow_due_date (due_date),
  INDEX idx_borrow_user (user_id),
  INDEX idx_borrow_book (book_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- RESERVATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  user_id INT NOT NULL,
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT NULL,
  status ENUM('pending','fulfilled','cancelled','expired') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservation_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reservation_status (status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  action VARCHAR(100) NOT NULL,              -- e.g. BOOK_CREATED, USER_LOGIN, BORROW_RECORD_CREATED
  entity_type VARCHAR(50) DEFAULT NULL,
  entity_id INT DEFAULT NULL,
  description VARCHAR(500) DEFAULT NULL,
  ip_address VARCHAR(64) DEFAULT NULL,
  user_agent VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_user (user_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- SYSTEM SETTINGS (key-value)
-- ----------------------------------------------------------------------------
CREATE TABLE system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(500) DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  updated_by INT DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- SEED DATA
-- ----------------------------------------------------------------------------
INSERT INTO roles (name, description) VALUES
  ('admin', 'Full system administrator'),
  ('librarian', 'Daily library operations staff'),
  ('user', 'Employee / library member');

INSERT INTO departments (name, code) VALUES
  ('Engineering', 'ENG'),
  ('Production', 'PRD'),
  ('Human Resources', 'HR'),
  ('Quality Assurance', 'QA'),
  ('Administration', 'ADM');

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('loan_period_days', '14', 'Default number of days a book may be borrowed'),
  ('max_renewals', '2', 'Maximum number of times a loan can be renewed'),
  ('max_books_per_user', '3', 'Maximum concurrent active loans per user'),
  ('reservation_hold_hours', '48', 'Hours a fulfilled reservation is held before expiring'),
  ('org_name', 'Bishoftu Motor Vehicle Engineering Industry', 'Organization display name');

-- NOTE: The default admin account is NOT created here with a hardcoded hash.
-- Run `npm run seed` (backend/database/seed.js) after setting up .env — it creates
-- the admin user with a properly generated bcrypt hash for the password you choose
-- (or the ADMIN_DEFAULT_PASSWORD value from .env). This avoids ever shipping a
-- known password hash in source control.

-- Added dynamically for Broadcast Messages feature
CREATE TABLE IF NOT EXISTS broadcasts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  target_role ENUM('all', 'librarian', 'user') NOT NULL DEFAULT 'all',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity ENUM('info', 'warning', 'danger') NOT NULL DEFAULT 'info',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_dismissed_notifications (
  user_id INT NOT NULL,
  notification_id VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, notification_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
