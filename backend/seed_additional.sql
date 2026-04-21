-- ═══════════════════════════════════════════════════════════════
-- SprintFlow — Additional Sprints (5 Total)
-- ═══════════════════════════════════════════════════════════════

USE sprintflow_db;

-- Add 2 more sprints to make it 5 total sprints

INSERT INTO sprints (title, technology, cohort, cohorts_json, trainer_id, created_by, room, start_date, end_date, sprint_start_time, sprint_end_time, status, instructions, created_at, updated_at)
VALUES
  -- .NET Sprint (new technology)
  ('DotNet Sprint - NC1', 'DotNet', 'NC1',
   '[{"technology":"DotNet","cohort":"NC1"}]',
   (SELECT id FROM users WHERE email = 's.posanapally@ajacs.in'),
   (SELECT id FROM users WHERE email = 's.lakkampally@ajacs.in'),
   'Training Room 4',
   '2026-04-01', '2026-05-15',
   '04:00 PM', '05:00 PM',
   'Scheduled',
   '.NET training for NC1 cohort. Session: 16:00-17:00.',
   NOW(), NOW()),

  -- Salesforce Sprint (new technology)
  ('Salesforce Sprint - SC1', 'SalesForce', 'SC1',
   '[{"technology":"SalesForce","cohort":"SC1"}]',
   (SELECT id FROM users WHERE email = 's.posanapally@ajacs.in'),
   (SELECT id FROM users WHERE email = 's.lakkampally@ajacs.in'),
   'Training Room 5',
   '2026-04-01', '2026-05-15',
   '05:00 PM', '06:00 PM',
   'Scheduled',
   'Salesforce training for SC1 cohort. Session: 17:00-18:00.',
   NOW(), NOW())

ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Add .NET students
INSERT INTO employees (emp_id, name, email, technology, cohort, department, status, created_at, updated_at)
VALUES
  ('NC1001', 'Rajesh Kumar',        'nc1001@ajacs.in', 'DotNet', 'NC1', 'Technology', 'Active', NOW(), NOW()),
  ('NC1002', 'Priya Sharma',        'nc1002@ajacs.in', 'DotNet', 'NC1', 'Technology', 'Active', NOW(), NOW()),
  ('NC1003', 'Amit Singh',          'nc1003@ajacs.in', 'DotNet', 'NC1', 'Technology', 'Active', NOW(), NOW()),
  ('NC1004', 'Neha Gupta',          'nc1004@ajacs.in', 'DotNet', 'NC1', 'Technology', 'Active', NOW(), NOW()),
  ('NC1005', 'Vikash Yadav',        'nc1005@ajacs.in', 'DotNet', 'NC1', 'Technology', 'Active', NOW(), NOW()),
  ('NC1006', 'Kavya Reddy',         'nc1006@ajacs.in', 'DotNet', 'NC1', 'Technology', 'Active', NOW(), NOW()),
  ('NC1007', 'Ravi Teja',           'nc1007@ajacs.in', 'DotNet', 'NC1', 'Technology', 'Active', NOW(), NOW()),
  ('NC1008', 'Swathi Nair',         'nc1008@ajacs.in', 'DotNet', 'NC1', 'Technology', 'Active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW();

-- Add Salesforce students
INSERT INTO employees (emp_id, name, email, technology, cohort, department, status, created_at, updated_at)
VALUES
  ('SC1001', 'Manoj Patel',         'sc1001@ajacs.in', 'SalesForce', 'SC1', 'Technology', 'Active', NOW(), NOW()),
  ('SC1002', 'Deepika Jain',        'sc1002@ajacs.in', 'SalesForce', 'SC1', 'Technology', 'Active', NOW(), NOW()),
  ('SC1003', 'Suresh Babu',         'sc1003@ajacs.in', 'SalesForce', 'SC1', 'Technology', 'Active', NOW(), NOW()),
  ('SC1004', 'Lakshmi Devi',        'sc1004@ajacs.in', 'SalesForce', 'SC1', 'Technology', 'Active', NOW(), NOW()),
  ('SC1005', 'Harish Chandra',      'sc1005@ajacs.in', 'SalesForce', 'SC1', 'Technology', 'Active', NOW(), NOW()),
  ('SC1006', 'Sita Ramesh',         'sc1006@ajacs.in', 'SalesForce', 'SC1', 'Technology', 'Active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW();

-- Enroll .NET students
INSERT INTO sprint_employees (sprint_id, employee_id, status, enrolled_at)
SELECT
  (SELECT id FROM sprints WHERE title = 'DotNet Sprint - NC1' LIMIT 1),
  e.id, 'ENROLLED', NOW()
FROM employees e
WHERE e.technology = 'DotNet' AND e.cohort = 'NC1'
ON DUPLICATE KEY UPDATE status = 'ENROLLED';

-- Enroll Salesforce students
INSERT INTO sprint_employees (sprint_id, employee_id, status, enrolled_at)
SELECT
  (SELECT id FROM sprints WHERE title = 'Salesforce Sprint - SC1' LIMIT 1),
  e.id, 'ENROLLED', NOW()
FROM employees e
WHERE e.technology = 'SalesForce' AND e.cohort = 'SC1'
ON DUPLICATE KEY UPDATE status = 'ENROLLED';

-- Add some attendance data for the new sprints
SET @dotnet_sprint = (SELECT id FROM sprints WHERE title = 'DotNet Sprint - NC1' LIMIT 1);
SET @salesforce_sprint = (SELECT id FROM sprints WHERE title = 'Salesforce Sprint - SC1' LIMIT 1);
SET @trainer_id = (SELECT id FROM users WHERE email = 's.posanapally@ajacs.in');

-- .NET attendance
INSERT INTO attendance (sprint_id, employee_id, attendance_date, status, check_in_time, submitted, marked_by, created_at, updated_at)
SELECT @dotnet_sprint, e.id, '2026-04-01', 'Present', '04:05 PM', true, @trainer_id, NOW(), NOW()
FROM employees e WHERE e.technology = 'DotNet' AND e.cohort = 'NC1'
ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW();

-- Salesforce attendance
INSERT INTO attendance (sprint_id, employee_id, attendance_date, status, check_in_time, submitted, marked_by, created_at, updated_at)
SELECT @salesforce_sprint, e.id, '2026-04-01', 'Present', '05:05 PM', true, @trainer_id, NOW(), NOW()
FROM employees e WHERE e.technology = 'SalesForce' AND e.cohort = 'SC1'
ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW();

-- Verify final counts
SELECT 'Final Sprint Count' AS info, COUNT(*) AS total FROM sprints;
SELECT 'Final Employee Count' AS info, COUNT(*) AS total FROM employees;
SELECT 'Technologies' AS info, technology, COUNT(*) AS students FROM employees GROUP BY technology;