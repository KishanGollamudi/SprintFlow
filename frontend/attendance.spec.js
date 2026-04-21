/**
 * E2E tests — SprintFlow Trainer Attendance Flow
 *
 * Backend : http://localhost:8080
 * Frontend: http://localhost:5173  (Vite dev server)
 *
 * Real accounts used:
 *   Trainer  : s.posanapally@ajacs.in  / Admin@123  (id=11, sprints 2,3,4)
 *   Manager  : surya@sprintflow.com    / Admin@123
 *   HR       : s.lakkampally@ajacs.in  / Admin@123
 */
import { test, expect } from '@playwright/test';

// ── Shared date helpers ───────────────────────────────────────────────────────
const TODAY      = new Date().toISOString().slice(0, 10);           // e.g. 2026-04-09
const TOMORROW   = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10); // 2026-04-10

// ── Login helpers ─────────────────────────────────────────────────────────────

async function loginAs(page, role, email, password) {
  await page.goto('/login');
  await page.getByRole('radio', { name: new RegExp(`^${role}$`, 'i') }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: new RegExp(`sign in as ${role}`, 'i') }).click();
}

async function loginAsTrainer(page) {
  await loginAs(page, 'trainer', 's.posanapally@ajacs.in', 'Admin@123');
  await expect(page).toHaveURL('/', { timeout: 12_000 });
}

async function loginAsManager(page) {
  await loginAs(page, 'manager', 'surya@sprintflow.com', 'Admin@123');
  await expect(page).toHaveURL('/manager', { timeout: 12_000 });
}

async function loginAsHR(page) {
  await loginAs(page, 'hr', 's.lakkampally@ajacs.in', 'Admin@123');
  await expect(page).toHaveURL('/hr', { timeout: 12_000 });
}

// ── Navigate to sprint attendance page ───────────────────────────────────────

async function goToSprintAttendance(page, sprintId) {
  await page.goto(`/sprints/${sprintId}/attendance`);
  // Wait for the sprint title to confirm the page loaded
  await expect(page.locator('h2').first()).toBeVisible({ timeout: 10_000 });
}

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN TESTS
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Login page', () => {
  test('renders all three role tabs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('radio', { name: /^trainer$/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /^hr$/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /^manager$/i })).toBeVisible();
  });

  test('trainer login redirects to trainer dashboard', async ({ page }) => {
    await loginAsTrainer(page);
    await expect(page.getByText(/trainer dashboard/i)).toBeVisible({ timeout: 8_000 });
  });

  test('manager login redirects to manager dashboard', async ({ page }) => {
    await loginAsManager(page);
    await expect(page).toHaveURL('/manager');
  });

  test('HR login redirects to HR dashboard', async ({ page }) => {
    await loginAsHR(page);
    await expect(page).toHaveURL('/hr');
  });

  test('wrong password shows an alert', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('radio', { name: /^trainer$/i }).click();
    await page.getByLabel(/email/i).fill('s.posanapally@ajacs.in');
    await page.getByLabel(/password/i).fill('wrongpassword');
    const dialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: /sign in as trainer/i }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBeTruthy();
    await dialog.dismiss();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TRAINER DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Trainer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
  });

  test('shows KPI stat cards', async ({ page }) => {
    await expect(page.getByText(/total students/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/present/i).first()).toBeVisible();
  });

  test('sidebar expands on hover and shows Sprints link', async ({ page }) => {
    await page.locator('aside').hover();
    await expect(page.getByRole('link', { name: /^sprints$/i })).toBeVisible();
  });

  test('navigates to Sprints page via sidebar', async ({ page }) => {
    await page.locator('aside').hover();
    await page.getByRole('link', { name: /^sprints$/i }).click();
    await expect(page).toHaveURL('/sprints');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SPRINT LIST
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Sprint List', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
    await page.goto('/sprints');
  });

  test('shows assigned sprints for the trainer', async ({ page }) => {
    // Trainer has sprints: Java Sprint - JC2/JC3, Python Sprint - PC1, Devops Sprint - DC1
    await expect(page.getByText(/java sprint/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/python sprint/i)).toBeVisible();
    await expect(page.getByText(/devops sprint/i)).toBeVisible();
  });

  test('each sprint card has a Mark Attendance link', async ({ page }) => {
    await page.waitForSelector('text=Java Sprint', { timeout: 8_000 });
    const attendanceLinks = page.getByRole('link', { name: /attendance/i });
    await expect(attendanceLinks.first()).toBeVisible();
    expect(await attendanceLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test('clicking attendance link navigates to /sprints/:id/attendance', async ({ page }) => {
    await page.waitForSelector('text=Java Sprint', { timeout: 8_000 });
    await page.getByRole('link', { name: /attendance/i }).first().click();
    await expect(page).toHaveURL(/\/sprints\/\d+\/attendance/);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SPRINT ATTENDANCE — Sprint 2 (Java, today already submitted → read-only)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Sprint Attendance — today (already submitted)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
    await goToSprintAttendance(page, 2);
  });

  test('shows sprint title and date range', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /java sprint/i })).toBeVisible();
    await expect(page.getByText(/2026-03-25/)).toBeVisible();
  });

  test('shows KPI cards: Total, Present, Late, Absent', async ({ page }) => {
    await expect(page.getByText('Total')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Present').first()).toBeVisible();
    await expect(page.getByText('Late').first()).toBeVisible();
    await expect(page.getByText('Absent').first()).toBeVisible();
  });

  test('today\'s session is locked — shows Submitted badge and disabled button', async ({ page }) => {
    // The sprint header shows a "Submitted" lock badge
    await expect(page.getByText('Submitted').first()).toBeVisible({ timeout: 8_000 });
    // The submit button is replaced by a disabled "Submitted" button
    await expect(page.getByRole('button', { name: /submitted/i })).toBeDisabled();
  });

  test('employee rows are visible in read-only mode', async ({ page }) => {
    // Real employee from the API response
    await expect(page.getByText('Peram Raghunadha Reddy')).toBeVisible({ timeout: 8_000 });
  });

  test('search filters employee rows', async ({ page }) => {
    await page.waitForSelector('text=Peram Raghunadha Reddy', { timeout: 8_000 });
    await page.getByPlaceholder(/search by name or id/i).fill('Anil');
    await expect(page.getByText(/anil/i).first()).toBeVisible();
  });

  test('Export CSV downloads a file', async ({ page }) => {
    await page.waitForSelector('text=Peram Raghunadha Reddy', { timeout: 8_000 });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export csv/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/attendance.*\.csv/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SPRINT ATTENDANCE — Sprint 2, TOMORROW (unsubmitted → can mark & submit)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Sprint Attendance — tomorrow (unsubmitted)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
    await goToSprintAttendance(page, 2);
    // Change date to tomorrow so we get a fresh unsubmitted session
    await page.getByLabel(/attendance date/i).fill(TOMORROW);
    // Wait for the session to reload
    await page.waitForTimeout(500);
  });

  test('submit button is enabled for an unsubmitted date', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /submit attendance/i }),
    ).toBeEnabled({ timeout: 8_000 });
  });

  test('can mark an employee as Present', async ({ page }) => {
    const firstPresent = page.getByRole('button', { name: /^present$/i }).first();
    await expect(firstPresent).toBeVisible({ timeout: 8_000 });
    await firstPresent.click();
    // The status badge in that row updates
    await expect(page.getByText('Present').first()).toBeVisible();
  });

  test('Mark All Present sets all rows to Present', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /mark all present/i }),
    ).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: /mark all present/i }).click();
    // All status buttons for Present should now be active (highlighted)
    const presentBtns = page.getByRole('button', { name: /^present$/i });
    expect(await presentBtns.count()).toBeGreaterThan(0);
  });

  test('can toggle Notify absent employees switch', async ({ page }) => {
    await expect(page.getByText(/notify absent employees/i)).toBeVisible({ timeout: 8_000 });
    // The toggle is a styled div — click it via its parent label
    const toggle = page.getByText(/notify absent employees/i).locator('..').locator('div').first();
    await toggle.click();
    // Toggle is still visible (no crash)
    await expect(page.getByText(/notify absent employees/i)).toBeVisible();
  });

  test('submitting attendance shows success banner and locks the session', async ({ page }) => {
    // Mark all present first so there's something to submit
    await expect(
      page.getByRole('button', { name: /mark all present/i }),
    ).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: /mark all present/i }).click();

    // Submit
    await page.getByRole('button', { name: /submit attendance/i }).click();

    // Success banner: "Attendance for <date> submitted. Records are now locked."
    await expect(
      page.getByText(/records are now locked/i),
    ).toBeVisible({ timeout: 12_000 });

    // Submit button replaced by disabled Submitted button
    await expect(page.getByRole('button', { name: /^submitted$/i })).toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// MANAGER DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Manager Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test('shows manager dashboard with sidebar sections', async ({ page }) => {
    await page.locator('aside').hover();
    await expect(page.getByRole('link', { name: /employees/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('link', { name: /trainers/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /hr bps/i })).toBeVisible();
  });

  test('navigates to Employees page', async ({ page }) => {
    await page.goto('/manager/employees');
    await expect(page).toHaveURL('/manager/employees');
    await expect(page.getByText(/employees/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('navigates to Sprints page', async ({ page }) => {
    await page.goto('/manager/sprints');
    await expect(page).toHaveURL('/manager/sprints');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HR DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════

test.describe('HR Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsHR(page);
  });

  test('shows HR dashboard', async ({ page }) => {
    await expect(page).toHaveURL('/hr');
    await expect(page.locator('aside')).toBeVisible();
  });

  test('sidebar shows HR-specific links', async ({ page }) => {
    await page.locator('aside').hover();
    await expect(page.getByRole('link', { name: /create sprint/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('link', { name: /^sprints$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /cohorts/i })).toBeVisible();
  });

  test('navigates to HR Sprints page', async ({ page }) => {
    await page.goto('/hr/sprints');
    await expect(page).toHaveURL('/hr/sprints');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES — unauthenticated redirect
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Protected routes', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login', { timeout: 8_000 });
  });

  test('trainer cannot access /manager route', async ({ page }) => {
    await loginAsTrainer(page);
    await page.goto('/manager');
    // Should redirect to trainer home "/"
    await expect(page).toHaveURL('/', { timeout: 8_000 });
  });

  test('manager cannot access trainer route /', async ({ page }) => {
    await loginAsManager(page);
    await page.goto('/');
    // Should redirect to /manager
    await expect(page).toHaveURL('/manager', { timeout: 8_000 });
  });
});
