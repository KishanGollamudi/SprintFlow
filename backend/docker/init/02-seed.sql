-- ═══════════════════════════════════════════════════════════════
-- SprintFlow — Updated Seed Script
-- ═══════════════════════════════════════════════════════════════

USE sprintflow_db;

-- ── 1. USERS ─────────────────────────────────────────────────────
-- Passwords reset by DataInitializer on startup to Admin@123

INSERT INTO users (name, email, password, role, phone, department, trainer_role, status, joined_date, password_changed, created_at, updated_at)
VALUES
  -- Managers
  ('Surya Prakash',  'surya@sprintflow.com',       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc5AlL2i', 'MANAGER', '9000000001', 'Management',    NULL,                 'Active', '2020-01-01', true, NOW(), NOW()),
  ('Aswini Pasam',   'a.pasam@ajacs.in',            '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc5AlL2i', 'MANAGER', '9000000002', 'Management',    NULL,                 'Active', '2020-01-01', true, NOW(), NOW()),
  -- HR
  ('Satwika',        's.lakkampally@ajacs.in',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc5AlL2i', 'HR',      '9000000003', 'HR',            NULL,                 'Active', '2021-06-01', true, NOW(), NOW()),
  ('Nikitha',        'nikitha@ajacs.in',             '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc5AlL2i', 'HR',      '9000000004', 'HR',            NULL,                 'Active', '2021-06-01', true, NOW(), NOW()),
  -- Trainer
  ('Surya Posanapally', 's.posanapally@ajacs.in',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc5AlL2i', 'TRAINER', '9000000005', 'Communication', 'Manager-Trainings',  'Active', '2020-07-10', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name       = VALUES(name),
  role       = VALUES(role),
  department = VALUES(department),
  trainer_role = VALUES(trainer_role),
  updated_at = NOW();

-- ── 2. SPRINTS ───────────────────────────────────────────────────

INSERT INTO sprints (title, technology, cohort, cohorts_json, trainer_id, created_by, room, start_date, end_date, sprint_start_time, sprint_end_time, status, instructions, created_at, updated_at)
VALUES
  -- Java Sprint JC2 + JC3
  ('Java Sprint - JC2/JC3', 'Java', 'JC2',
   '[{"technology":"Java","cohort":"JC2"},{"technology":"Java","cohort":"JC3"}]',
   (SELECT id FROM users WHERE email = 's.posanapally@ajacs.in'),
   (SELECT id FROM users WHERE email = 's.lakkampally@ajacs.in'),
   'Training Room 1',
   '2026-03-25', '2026-04-30',
   '12:00 PM', '01:00 PM',
   'Scheduled',
   'Java training for JC2 and JC3 cohorts. Session: 12:00-13:00.',
   NOW(), NOW()),

  -- Python Sprint PC1
  ('Python Sprint - PC1', 'Python', 'PC1',
   '[{"technology":"Python","cohort":"PC1"}]',
   (SELECT id FROM users WHERE email = 's.posanapally@ajacs.in'),
   (SELECT id FROM users WHERE email = 's.lakkampally@ajacs.in'),
   'Training Room 2',
   '2026-03-25', '2026-04-30',
   '02:00 PM', '03:00 PM',
   'Scheduled',
   'Python training for PC1 cohort. Session: 14:00-15:00.',
   NOW(), NOW()),

  -- Devops Sprint DC1
  ('Devops Sprint - DC1', 'Devops', 'DC1',
   '[{"technology":"Devops","cohort":"DC1"}]',
   (SELECT id FROM users WHERE email = 's.posanapally@ajacs.in'),
   (SELECT id FROM users WHERE email = 's.lakkampally@ajacs.in'),
   'Training Room 3',
   '2026-03-25', '2026-04-30',
   '03:00 PM', '04:00 PM',
   'Scheduled',
   'Devops training for DC1 cohort. Session: 15:00-16:00.',
   NOW(), NOW())

ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ── 3. EMPLOYEES — Java JC2 ──────────────────────────────────────

INSERT INTO employees (emp_id, name, email, technology, cohort, department, status, created_at, updated_at)
VALUES
  ('2431035', 'Peram Raghunadha Reddy',      '2431035@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  ('2531015', 'Asu Bhaskar Chaitanya',        '2531015@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  ('2531025', 'Gudi Anil Reddy',              '2531025@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  ('2531005', 'Kummari Pavan Kumar',          '2531005@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  ('2531018', 'Gummadi Rakesh',               '2531018@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  ('2431031', 'Medeboina Srinivas',           '2431031@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  ('2431041', 'Velugu Aparna',                '2431041@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  ('2431042', 'Reddy Gaari Navaneeth Reddy',  '2431042@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  ('2531003', 'Kasarla Avinash Kumar',        '2531003@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  ('2531017', 'Pishke Saikiran',              '2531017@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  ('2531006', 'Konnoju Shireesha',            '2531006@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  ('2531010', 'Anil Choppari',                '2531010@ajacs.in', 'Java', 'JC2', 'Technology', 'Active', NOW(), NOW()),
  -- Java JC3
  ('2531019', 'Rohith Shunkishela',           '2531019@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531021', 'Bodapati Sai Krishna',         '2531021@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531022', 'Vaduru Dileep Sai',            '2531022@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531024', 'Kongari Nikhil',               '2531024@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531038', 'Nimmaturi Ashok Kumar',        '2531038@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531047', 'Nampally Radhika',             '2531047@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531050', 'Kammari Vamshi Krishna Chary', '2531050@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531014', 'Thontla Yedukondala Reddy',    '2531014@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531031', 'Namburi Suneetha',             '2531031@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531033', 'Annapureddy Sravani',          '2531033@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531036', 'Peddinti Ramya',               '2531036@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531051', 'Badi Vinitha',                 '2531051@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW()),
  ('2531039', 'Bathina Ashok',                '2531039@ajacs.in', 'Java', 'JC3', 'Technology', 'Active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), cohort = VALUES(cohort), email = VALUES(email), updated_at = NOW();

-- ── 4. SPRINT_EMPLOYEES ──────────────────────────────────────────

-- Java JC2 + JC3
INSERT INTO sprint_employees (sprint_id, employee_id, status, enrolled_at)
SELECT
  (SELECT id FROM sprints WHERE title = 'Java Sprint - JC2/JC3' LIMIT 1),
  e.id, 'ENROLLED', NOW()
FROM employees e
WHERE e.technology = 'Java' AND e.cohort IN ('JC2', 'JC3')
ON DUPLICATE KEY UPDATE status = 'ENROLLED';

-- ── 5. VERIFY ────────────────────────────────────────────────────

SELECT 'Users'           AS tbl, COUNT(*) AS cnt FROM users           UNION ALL
SELECT 'Sprints',                COUNT(*)        FROM sprints          UNION ALL
SELECT 'Employees',              COUNT(*)        FROM employees        UNION ALL
SELECT 'Sprint_Employees',       COUNT(*)        FROM sprint_employees UNION ALL
SELECT 'Attendance',             COUNT(*)        FROM attendance;
