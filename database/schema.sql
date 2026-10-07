-- Smart Hostel Life & Management System
-- Database: hostel_management
-- Run: mysql -u root -p hostel_management < database/schema.sql

SET FOREIGN_KEY_CHECKS = 0;

-- ── users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin', 'warden', 'student') NOT NULL DEFAULT 'student',
  phone       VARCHAR(15),
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_email (email)
);

-- ── hostels ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostels (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  address     TEXT,
  warden_id   INT UNSIGNED,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_hostel_warden
    FOREIGN KEY (warden_id) REFERENCES users (id)
    ON DELETE SET NULL
);

-- ── rooms ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id   INT UNSIGNED  NOT NULL,
  room_number VARCHAR(20)   NOT NULL,
  floor       TINYINT       NOT NULL DEFAULT 0,
  type        ENUM('single', 'double', 'triple') NOT NULL DEFAULT 'double',
  capacity    TINYINT       NOT NULL DEFAULT 2,
  status      ENUM('available', 'full', 'maintenance') NOT NULL DEFAULT 'available',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_room_hostel
    FOREIGN KEY (hostel_id) REFERENCES hostels (id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_room_per_hostel (hostel_id, room_number),
  INDEX idx_status (status)
);

-- ── students ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED  NOT NULL UNIQUE,
  student_code  VARCHAR(30)   NOT NULL UNIQUE,  -- college roll/enroll number
  course        VARCHAR(100)  NOT NULL,
  year          TINYINT       NOT NULL DEFAULT 1,
  parent_name   VARCHAR(100),
  parent_phone  VARCHAR(15),
  address       TEXT,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  INDEX idx_student_code (student_code)
);

-- ── allocations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS allocations (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id      INT UNSIGNED  NOT NULL,
  room_id         INT UNSIGNED  NOT NULL,
  allocated_date  DATE          NOT NULL DEFAULT (CURRENT_DATE),
  vacated_date    DATE,
  status          ENUM('active', 'vacated') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_alloc_student
    FOREIGN KEY (student_id) REFERENCES students (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_alloc_room
    FOREIGN KEY (room_id) REFERENCES rooms (id)
    ON DELETE CASCADE,
  -- Active-allocation uniqueness is enforced at application level
  INDEX idx_alloc_student (student_id),
  INDEX idx_alloc_status (status)
);

-- ── complaints ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id  INT UNSIGNED  NOT NULL,
  category    ENUM('maintenance', 'food', 'security', 'hygiene', 'other') NOT NULL DEFAULT 'other',
  description TEXT          NOT NULL,
  status      ENUM('pending', 'in_progress', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
  response    TEXT,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_complaint_student
    FOREIGN KEY (student_id) REFERENCES students (id)
    ON DELETE CASCADE,
  INDEX idx_complaint_status (status)
);

-- ── leave_requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id    INT UNSIGNED  NOT NULL,
  from_date     DATE          NOT NULL,
  to_date       DATE          NOT NULL,
  reason        TEXT          NOT NULL,
  status        ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  approved_by   INT UNSIGNED,   -- warden user id
  remarks       VARCHAR(255),
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_leave_student
    FOREIGN KEY (student_id) REFERENCES students (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_leave_approver
    FOREIGN KEY (approved_by) REFERENCES users (id)
    ON DELETE SET NULL,
  INDEX idx_leave_status (status)
);

-- ── notices ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  author_id   INT UNSIGNED  NOT NULL,
  title       VARCHAR(200)  NOT NULL,
  content     TEXT          NOT NULL,
  target_role ENUM('all', 'student', 'warden') NOT NULL DEFAULT 'all',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notice_author
    FOREIGN KEY (author_id) REFERENCES users (id)
    ON DELETE CASCADE,
  INDEX idx_target_role (target_role)
);

SET FOREIGN_KEY_CHECKS = 1;
