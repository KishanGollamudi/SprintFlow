-- ═══════════════════════════════════════════════════════════════
-- SprintFlow — MySQL Deployment Schema
-- DB   : sprintflow_db
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ═══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS sprintflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sprintflow_db;

-- ── 1. USERS ─────────────────────────────────────────────────────
-- Covers: MANAGER, HR, TRAINER roles
-- trainer_role is only populated for TRAINER users (e.g. Manager-Trainings)
CREATE TABLE IF NOT EXISTS users (
  id                BIGINT          NOT NULL AUTO_INCREMENT,
  name              VARCHAR(100)    NOT NULL,
  email             VARCHAR(150)    NOT NULL,
  password          VARCHAR(255)    NOT NULL,
  role              ENUM('MANAGER','HR','TRAINER') NOT NULL,
  phone             VARCHAR(15),
  department        VARCHAR(100),
  trainer_role      VARCHAR(50),                        -- TRAINER only
  status            VARCHAR(10)     NOT NULL DEFAULT 'Active',  -- Active | Inactive
  joined_date       DATE,
  temp_password     VARCHAR(255),
  password_changed  TINYINT(1)      NOT NULL DEFAULT 0,
  smtp_email        VARCHAR(150),                        -- MANAGER only: sender address
  smtp_password     VARCHAR(255),                        -- AES-256 encrypted App Password
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── 2. EMPLOYEES ─────────────────────────────────────────────────
-- Trainees / employees enrolled in sprints.
-- technology: Java | Python | Devops | DotNet | SalesForce
-- cohort    : JC1, JC2, JC3, PC1, DC1, etc.
CREATE TABLE IF NOT EXISTS employees (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  emp_id       VARCHAR(20)  NOT NULL,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150),
  phone        VARCHAR(15),
  technology   VARCHAR(20)  NOT NULL,
  cohort       VARCHAR(50)  NOT NULL,
  department   VARCHAR(100),
  status       VARCHAR(10)  NOT NULL DEFAULT 'Active',  -- Active | Inactive
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_emp_id (emp_id),
  UNIQUE KEY uq_employees_email  (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── 3. SPRINTS ───────────────────────────────────────────────────
-- A sprint is a scheduled training session.
-- cohorts_json stores multi-cohort JSON: [{"technology":"Java","cohort":"JC2"},...]
-- status: Scheduled | On Hold | Completed
CREATE TABLE IF NOT EXISTS sprints (
  id                BIGINT       NOT NULL AUTO_INCREMENT,
  title             VARCHAR(150) NOT NULL,
  technology        VARCHAR(20),
  cohort            VARCHAR(50),                        -- primary cohort
  cohorts_json      TEXT,                               -- JSON array for multi-cohort
  trainer_id        BIGINT,                             -- FK → users (TRAINER)
  created_by        BIGINT,                             -- FK → users (HR/MANAGER)
  room              VARCHAR(100),
  start_date        DATE         NOT NULL,
  end_date          DATE         NOT NULL,
  sprint_start_time VARCHAR(20),                        -- e.g. 09:00 AM
  sprint_end_time   VARCHAR(20),                        -- e.g. 05:00 PM
  status            VARCHAR(15)  NOT NULL DEFAULT 'Scheduled',
  instructions      TEXT,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_sprints_trainer    FOREIGN KEY (trainer_id)  REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_sprints_created_by FOREIGN KEY (created_by)  REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_sprints_trainer   (trainer_id),
  INDEX idx_sprints_status    (status),
  INDEX idx_sprints_dates     (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── 4. SPRINT_EMPLOYEES ──────────────────────────────────────────
-- Junction table: which employees are enrolled in which sprint.
-- status: ENROLLED | DROPPED | COMPLETED
CREATE TABLE IF NOT EXISTS sprint_employees (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  sprint_id    BIGINT      NOT NULL,
  employee_id  BIGINT      NOT NULL,
  status       VARCHAR(15) NOT NULL DEFAULT 'ENROLLED',
  enrolled_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sprint_employee (sprint_id, employee_id),
  CONSTRAINT fk_se_sprint   FOREIGN KEY (sprint_id)   REFERENCES sprints   (id) ON DELETE CASCADE,
  CONSTRAINT fk_se_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
  INDEX idx_se_sprint   (sprint_id),
  INDEX idx_se_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── 5. ATTENDANCE ────────────────────────────────────────────────
-- One row per (sprint, employee, date).
-- status   : Present | Late | Absent
-- submitted: locked after trainer submits the day's attendance
CREATE TABLE IF NOT EXISTS attendance (
  id               BIGINT      NOT NULL AUTO_INCREMENT,
  sprint_id        BIGINT      NOT NULL,
  employee_id      BIGINT      NOT NULL,
  attendance_date  DATE        NOT NULL,
  status           VARCHAR(10) NOT NULL,               -- Present | Late | Absent
  check_in_time    VARCHAR(20),                        -- e.g. 09:15 AM
  notes            VARCHAR(255),
  submitted        TINYINT(1)  NOT NULL DEFAULT 0,
  marked_by        BIGINT,                             -- FK → users (TRAINER)
  created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance (sprint_id, employee_id, attendance_date),
  CONSTRAINT fk_att_sprint   FOREIGN KEY (sprint_id)   REFERENCES sprints   (id) ON DELETE CASCADE,
  CONSTRAINT fk_att_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
  CONSTRAINT fk_att_marker   FOREIGN KEY (marked_by)   REFERENCES users     (id) ON DELETE SET NULL,
  INDEX idx_att_sprint  (sprint_id),
  INDEX idx_att_employee(employee_id),
  INDEX idx_att_date    (attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── 6. CHAT_MESSAGES ─────────────────────────────────────────────
-- Real-time 1-to-1 messages via STOMP/WebSocket.
-- delivered: true once pushed to recipient's STOMP queue
-- read_at  : null = unread
CREATE TABLE IF NOT EXISTS chat_messages (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  sender_email     VARCHAR(150) NOT NULL,
  sender_name      VARCHAR(100) NOT NULL,
  sender_role      VARCHAR(20)  NOT NULL,
  recipient_email  VARCHAR(150) NOT NULL,
  content          TEXT         NOT NULL,
  sent_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered        TINYINT(1)   NOT NULL DEFAULT 0,
  read_at          DATETIME,

  PRIMARY KEY (id),
  INDEX idx_cm_sender    (sender_email),
  INDEX idx_cm_recipient (recipient_email),
  INDEX idx_cm_convo     (sender_email, recipient_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── 7. MESSAGES ──────────────────────────────────────────────────
-- Persistent message store (mirrors chat_messages; used by MessageController).
CREATE TABLE IF NOT EXISTS messages (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  sender_email     VARCHAR(150) NOT NULL,
  sender_name      VARCHAR(100),
  sender_role      VARCHAR(20),
  recipient_email  VARCHAR(150) NOT NULL,
  content          TEXT         NOT NULL,
  sent_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at          DATETIME,
  delivered        TINYINT(1)   NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  INDEX idx_msg_sender    (sender_email),
  INDEX idx_msg_recipient (recipient_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
