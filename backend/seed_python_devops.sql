-- ═══════════════════════════════════════════════════════════════
-- SprintFlow — Python PC1 + Devops DC1 Seed
-- ═══════════════════════════════════════════════════════════════

USE sprintflow_db;

-- ── Python PC1 Employees (10) ─────────────────────────────────
INSERT INTO employees (emp_id, name, email, technology, cohort, department, status, created_at, updated_at)
VALUES
  ('PC1001', 'Arjun Mehta',        'pc1001@ajacs.in', 'Python', 'PC1', 'Technology', 'Active', NOW(), NOW()),
  ('PC1002', 'Sneha Kulkarni',     'pc1002@ajacs.in', 'Python', 'PC1', 'Technology', 'Active', NOW(), NOW()),
  ('PC1003', 'Rahul Sharma',       'pc1003@ajacs.in', 'Python', 'PC1', 'Technology', 'Active', NOW(), NOW()),
  ('PC1004', 'Priya Reddy',        'pc1004@ajacs.in', 'Python', 'PC1', 'Technology', 'Active', NOW(), NOW()),
  ('PC1005', 'Kiran Babu',         'pc1005@ajacs.in', 'Python', 'PC1', 'Technology', 'Active', NOW(), NOW()),
  ('PC1006', 'Divya Nair',         'pc1006@ajacs.in', 'Python', 'PC1', 'Technology', 'Active', NOW(), NOW()),
  ('PC1007', 'Suresh Rao',         'pc1007@ajacs.in', 'Python', 'PC1', 'Technology', 'Active', NOW(), NOW()),
  ('PC1008', 'Ananya Iyer',        'pc1008@ajacs.in', 'Python', 'PC1', 'Technology', 'Active', NOW(), NOW()),
  ('PC1009', 'Vikram Das',         'pc1009@ajacs.in', 'Python', 'PC1', 'Technology', 'Active', NOW(), NOW()),
  ('PC1010', 'Pooja Verma',        'pc1010@ajacs.in', 'Python', 'PC1', 'Technology', 'Active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW();

-- ── Devops DC1 Employees (8) ──────────────────────────────────
INSERT INTO employees (emp_id, name, email, technology, cohort, department, status, created_at, updated_at)
VALUES
  ('DC1001', 'Rohit Kumar',        'dc1001@ajacs.in', 'Devops', 'DC1', 'Technology', 'Active', NOW(), NOW()),
  ('DC1002', 'Meera Joshi',        'dc1002@ajacs.in', 'Devops', 'DC1', 'Technology', 'Active', NOW(), NOW()),
  ('DC1003', 'Anil Chandra',       'dc1003@ajacs.in', 'Devops', 'DC1', 'Technology', 'Active', NOW(), NOW()),
  ('DC1004', 'Lakshmi Prasad',     'dc1004@ajacs.in', 'Devops', 'DC1', 'Technology', 'Active', NOW(), NOW()),
  ('DC1005', 'Naveen Reddy',       'dc1005@ajacs.in', 'Devops', 'DC1', 'Technology', 'Active', NOW(), NOW()),
  ('DC1006', 'Sravani Patel',      'dc1006@ajacs.in', 'Devops', 'DC1', 'Technology', 'Active', NOW(), NOW()),
  ('DC1007', 'Manoj Singh',        'dc1007@ajacs.in', 'Devops', 'DC1', 'Technology', 'Active', NOW(), NOW()),
  ('DC1008', 'Kavitha Rao',        'dc1008@ajacs.in', 'Devops', 'DC1', 'Technology', 'Active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW();

-- ── Enroll Python PC1 into Python Sprint ─────────────────────
INSERT INTO sprint_employees (sprint_id, employee_id, status, enrolled_at)
SELECT
  (SELECT id FROM sprints WHERE title = 'Python Sprint - PC1' LIMIT 1),
  e.id, 'ENROLLED', NOW()
FROM employees e
WHERE e.technology = 'Python' AND e.cohort = 'PC1'
ON DUPLICATE KEY UPDATE status = 'ENROLLED';

-- ── Enroll Devops DC1 into Devops Sprint ─────────────────────
INSERT INTO sprint_employees (sprint_id, employee_id, status, enrolled_at)
SELECT
  (SELECT id FROM sprints WHERE title = 'Devops Sprint - DC1' LIMIT 1),
  e.id, 'ENROLLED', NOW()
FROM employees e
WHERE e.technology = 'Devops' AND e.cohort = 'DC1'
ON DUPLICATE KEY UPDATE status = 'ENROLLED';

-- ── Attendance for Python PC1 (varied data) ───────────────────
SET @python_sprint = (SELECT id FROM sprints WHERE title = 'Python Sprint - PC1' LIMIT 1);
SET @trainer_id    = (SELECT id FROM users WHERE email = 's.posanapally@ajacs.in');

INSERT INTO attendance (sprint_id, employee_id, attendance_date, status, check_in_time, submitted, marked_by, created_at, updated_at)
SELECT @python_sprint, e.id, d.dt, d.st, IF(d.st='Present','02:05 PM', NULL), true, @trainer_id, NOW(), NOW()
FROM employees e
JOIN (
  SELECT 'PC1001' AS emp_id, '2026-03-25' AS dt, 'Present' AS st UNION ALL
  SELECT 'PC1001', '2026-03-26', 'Present' UNION ALL
  SELECT 'PC1001', '2026-03-27', 'Present' UNION ALL
  SELECT 'PC1001', '2026-03-30', 'Present' UNION ALL
  SELECT 'PC1001', '2026-03-31', 'Absent'  UNION ALL
  SELECT 'PC1002', '2026-03-25', 'Present' UNION ALL
  SELECT 'PC1002', '2026-03-26', 'Present' UNION ALL
  SELECT 'PC1002', '2026-03-27', 'Late'    UNION ALL
  SELECT 'PC1002', '2026-03-30', 'Present' UNION ALL
  SELECT 'PC1002', '2026-03-31', 'Present' UNION ALL
  SELECT 'PC1003', '2026-03-25', 'Present' UNION ALL
  SELECT 'PC1003', '2026-03-26', 'Absent'  UNION ALL
  SELECT 'PC1003', '2026-03-27', 'Present' UNION ALL
  SELECT 'PC1003', '2026-03-30', 'Present' UNION ALL
  SELECT 'PC1003', '2026-03-31', 'Present' UNION ALL
  SELECT 'PC1004', '2026-03-25', 'Present' UNION ALL
  SELECT 'PC1004', '2026-03-26', 'Present' UNION ALL
  SELECT 'PC1004', '2026-03-27', 'Present' UNION ALL
  SELECT 'PC1004', '2026-03-30', 'Late'    UNION ALL
  SELECT 'PC1004', '2026-03-31', 'Present' UNION ALL
  SELECT 'PC1005', '2026-03-25', 'Absent'  UNION ALL
  SELECT 'PC1005', '2026-03-26', 'Present' UNION ALL
  SELECT 'PC1005', '2026-03-27', 'Present' UNION ALL
  SELECT 'PC1005', '2026-03-30', 'Present' UNION ALL
  SELECT 'PC1005', '2026-03-31', 'Present' UNION ALL
  SELECT 'PC1006', '2026-03-25', 'Present' UNION ALL
  SELECT 'PC1006', '2026-03-26', 'Present' UNION ALL
  SELECT 'PC1006', '2026-03-27', 'Present' UNION ALL
  SELECT 'PC1006', '2026-03-30', 'Present' UNION ALL
  SELECT 'PC1006', '2026-03-31', 'Present' UNION ALL
  SELECT 'PC1007', '2026-03-25', 'Present' UNION ALL
  SELECT 'PC1007', '2026-03-26', 'Late'    UNION ALL
  SELECT 'PC1007', '2026-03-27', 'Present' UNION ALL
  SELECT 'PC1007', '2026-03-30', 'Absent'  UNION ALL
  SELECT 'PC1007', '2026-03-31', 'Present' UNION ALL
  SELECT 'PC1008', '2026-03-25', 'Present' UNION ALL
  SELECT 'PC1008', '2026-03-26', 'Present' UNION ALL
  SELECT 'PC1008', '2026-03-27', 'Present' UNION ALL
  SELECT 'PC1008', '2026-03-30', 'Present' UNION ALL
  SELECT 'PC1008', '2026-03-31', 'Present' UNION ALL
  SELECT 'PC1009', '2026-03-25', 'Present' UNION ALL
  SELECT 'PC1009', '2026-03-26', 'Present' UNION ALL
  SELECT 'PC1009', '2026-03-27', 'Absent'  UNION ALL
  SELECT 'PC1009', '2026-03-30', 'Present' UNION ALL
  SELECT 'PC1009', '2026-03-31', 'Late'    UNION ALL
  SELECT 'PC1010', '2026-03-25', 'Present' UNION ALL
  SELECT 'PC1010', '2026-03-26', 'Present' UNION ALL
  SELECT 'PC1010', '2026-03-27', 'Present' UNION ALL
  SELECT 'PC1010', '2026-03-30', 'Present' UNION ALL
  SELECT 'PC1010', '2026-03-31', 'Present'
) d ON e.emp_id = d.emp_id
ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW();

-- ── Attendance for Devops DC1 ─────────────────────────────────
SET @devops_sprint = (SELECT id FROM sprints WHERE title = 'Devops Sprint - DC1' LIMIT 1);

INSERT INTO attendance (sprint_id, employee_id, attendance_date, status, check_in_time, submitted, marked_by, created_at, updated_at)
SELECT @devops_sprint, e.id, d.dt, d.st, IF(d.st='Present','03:05 PM', NULL), true, @trainer_id, NOW(), NOW()
FROM employees e
JOIN (
  SELECT 'DC1001' AS emp_id, '2026-03-25' AS dt, 'Present' AS st UNION ALL
  SELECT 'DC1001', '2026-03-26', 'Present' UNION ALL
  SELECT 'DC1001', '2026-03-27', 'Present' UNION ALL
  SELECT 'DC1001', '2026-03-30', 'Present' UNION ALL
  SELECT 'DC1001', '2026-03-31', 'Present' UNION ALL
  SELECT 'DC1002', '2026-03-25', 'Present' UNION ALL
  SELECT 'DC1002', '2026-03-26', 'Late'    UNION ALL
  SELECT 'DC1002', '2026-03-27', 'Present' UNION ALL
  SELECT 'DC1002', '2026-03-30', 'Present' UNION ALL
  SELECT 'DC1002', '2026-03-31', 'Present' UNION ALL
  SELECT 'DC1003', '2026-03-25', 'Absent'  UNION ALL
  SELECT 'DC1003', '2026-03-26', 'Present' UNION ALL
  SELECT 'DC1003', '2026-03-27', 'Present' UNION ALL
  SELECT 'DC1003', '2026-03-30', 'Present' UNION ALL
  SELECT 'DC1003', '2026-03-31', 'Present' UNION ALL
  SELECT 'DC1004', '2026-03-25', 'Present' UNION ALL
  SELECT 'DC1004', '2026-03-26', 'Present' UNION ALL
  SELECT 'DC1004', '2026-03-27', 'Present' UNION ALL
  SELECT 'DC1004', '2026-03-30', 'Absent'  UNION ALL
  SELECT 'DC1004', '2026-03-31', 'Present' UNION ALL
  SELECT 'DC1005', '2026-03-25', 'Present' UNION ALL
  SELECT 'DC1005', '2026-03-26', 'Present' UNION ALL
  SELECT 'DC1005', '2026-03-27', 'Late'    UNION ALL
  SELECT 'DC1005', '2026-03-30', 'Present' UNION ALL
  SELECT 'DC1005', '2026-03-31', 'Present' UNION ALL
  SELECT 'DC1006', '2026-03-25', 'Present' UNION ALL
  SELECT 'DC1006', '2026-03-26', 'Present' UNION ALL
  SELECT 'DC1006', '2026-03-27', 'Present' UNION ALL
  SELECT 'DC1006', '2026-03-30', 'Present' UNION ALL
  SELECT 'DC1006', '2026-03-31', 'Present' UNION ALL
  SELECT 'DC1007', '2026-03-25', 'Present' UNION ALL
  SELECT 'DC1007', '2026-03-26', 'Absent'  UNION ALL
  SELECT 'DC1007', '2026-03-27', 'Present' UNION ALL
  SELECT 'DC1007', '2026-03-30', 'Present' UNION ALL
  SELECT 'DC1007', '2026-03-31', 'Present' UNION ALL
  SELECT 'DC1008', '2026-03-25', 'Present' UNION ALL
  SELECT 'DC1008', '2026-03-26', 'Present' UNION ALL
  SELECT 'DC1008', '2026-03-27', 'Present' UNION ALL
  SELECT 'DC1008', '2026-03-30', 'Present' UNION ALL
  SELECT 'DC1008', '2026-03-31', 'Late'
) d ON e.emp_id = d.emp_id
ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW();

-- ── Verify ────────────────────────────────────────────────────
SELECT technology, cohort, COUNT(*) as employees FROM employees GROUP BY technology, cohort ORDER BY technology, cohort;
SELECT 'Attendance' AS tbl, COUNT(*) FROM attendance;
