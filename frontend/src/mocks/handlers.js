import { http, HttpResponse } from "msw";

// ─── Shared fixtures ────────────────────────────────────────────────────────

export const MOCK_TRAINER = {
  id: 1,
  name: "Vikram Singh",
  email: "vikram@sprintflow.com",
  role: "trainer",
  department: "Java",
  initials: "VS",
};

// MOCK_EMPLOYEES must be declared before MOCK_SPRINT (used in employeeCount)
export const MOCK_EMPLOYEES = [
  { id: 101, empId: "EMP001", name: "Alice Kumar",   technology: "Java",   cohort: "JC2" },
  { id: 102, empId: "EMP002", name: "Bob Sharma",    technology: "Java",   cohort: "JC2" },
  { id: 103, empId: "EMP003", name: "Carol Nair",    technology: "Java",   cohort: "JC3" },
  { id: 104, empId: "EMP004", name: "David Pillai",  technology: "Python", cohort: "PC1" },
];

export const MOCK_SPRINT = {
  id: 10,
  title: "Java Sprint Q1",
  status: "Active",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  sprintStart: "09:00 AM",
  sprintEnd: "05:00 PM",
  room: "Room A - Sandeepa",
  trainerId: 1,
  trainer: "Vikram Singh",
  cohorts: [
    { technology: "Java",   cohort: "JC2" },
    { technology: "Java",   cohort: "JC3" },
  ],
  employeeCount: MOCK_EMPLOYEES.length,
};

export const MOCK_SPRINT_2 = {
  id: 11,
  title: "Python Sprint Q1",
  status: "Active",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  sprintStart: "10:00 AM",
  sprintEnd: "06:00 PM",
  room: "Room B - Dhrona",
  trainerId: 1,
  trainer: "Vikram Singh",
  cohorts: [{ technology: "Python", cohort: "PC1" }],
  employeeCount: 1,
};

// Rich mock attendance records so charts show data immediately
// Keyed by today's date — AppDataContext stores them under attendanceDate
const today = new Date().toISOString().slice(0, 10);

const MOCK_ATTENDANCE_ALL = [
  // Sprint 10 — Java Sprint Q1
  { sprintId: 10, sprintTitle: "Java Sprint Q1", attendanceDate: today, empId: "EMP001", employeeId: 101, employeeName: "Alice Kumar",  cohort: "JC2", technology: "Java",   status: "Present" },
  { sprintId: 10, sprintTitle: "Java Sprint Q1", attendanceDate: today, empId: "EMP002", employeeId: 102, employeeName: "Bob Sharma",   cohort: "JC2", technology: "Java",   status: "Late"    },
  { sprintId: 10, sprintTitle: "Java Sprint Q1", attendanceDate: today, empId: "EMP003", employeeId: 103, employeeName: "Carol Nair",   cohort: "JC3", technology: "Java",   status: "Absent"  },
  // Sprint 11 — Python Sprint Q1
  { sprintId: 11, sprintTitle: "Python Sprint Q1", attendanceDate: today, empId: "EMP004", employeeId: 104, employeeName: "David Pillai", cohort: "PC1", technology: "Python", status: "Present" },
];

// api.js response interceptor returns `response.data` directly.
// Backend wraps everything as: { success, data, message, statusCode }
const ok = (data) => ({ success: true, data, message: "OK", statusCode: 200 });

// ─── Handlers ───────────────────────────────────────────────────────────────

export const handlers = [
  // Auth — login
  http.post("/api/auth/login", async ({ request }) => {
    const { email } = await request.json();
    const role = email?.includes("hr")
      ? "hr"
      : email?.includes("manager")
        ? "manager"
        : "trainer";
    return HttpResponse.json(
      ok({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        user: { id: 1, name: "Vikram Singh", email, role, initials: "VS" },
      }),
    );
  }),

  // Auth — logout
  http.post("/api/auth/logout", () => HttpResponse.json(ok(null))),

  // Employees — all
  http.get("/api/employees", () => HttpResponse.json(ok(MOCK_EMPLOYEES))),

  // Employees by sprint (enrolled)
  http.get("/api/employees/sprint/:sprintId", ({ params }) => {
    const id = Number(params.sprintId);
    if (id === 11) return HttpResponse.json(ok(MOCK_EMPLOYEES.filter((e) => e.cohort === "PC1")));
    return HttpResponse.json(ok(MOCK_EMPLOYEES.filter((e) => ["JC2", "JC3"].includes(e.cohort))));
  }),

  // Enroll employee into sprint
  http.post("/api/sprints/:sprintId/employees", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(ok({ enrolled: body.employeeId }));
  }),

  // Remove employee from sprint
  http.delete("/api/sprints/:sprintId/employees/:employeeId", () =>
    HttpResponse.json(ok(null)),
  ),

  // Sprints — by trainer (must be before /api/sprints to avoid path conflict)
  http.get("/api/sprints/trainer/:trainerId", () =>
    HttpResponse.json(ok([MOCK_SPRINT, MOCK_SPRINT_2])),
  ),

  // Sprints — all
  http.get("/api/sprints", () => HttpResponse.json(ok([MOCK_SPRINT, MOCK_SPRINT_2]))),

  // Sprint by id
  http.get("/api/sprints/:id", ({ params }) => {
    const s = [MOCK_SPRINT, MOCK_SPRINT_2].find((x) => String(x.id) === String(params.id));
    return HttpResponse.json(ok(s ?? null));
  }),

  // Attendance — get by sprint + date
  http.get("/api/attendance", ({ request }) => {
    const url = new URL(request.url);
    const sprintId = Number(url.searchParams.get("sprintId"));
    const date = url.searchParams.get("date");
    const recs = MOCK_ATTENDANCE_ALL.filter(
      (r) => r.sprintId === sprintId && r.attendanceDate === date,
    );
    return HttpResponse.json(ok(recs));
  }),

  // Attendance — get all by sprint (for dashboard charts)
  http.get("/api/attendance/all", ({ request }) => {
    const url = new URL(request.url);
    const sprintId = Number(url.searchParams.get("sprintId"));
    const recs = sprintId
      ? MOCK_ATTENDANCE_ALL.filter((r) => r.sprintId === sprintId)
      : MOCK_ATTENDANCE_ALL;
    return HttpResponse.json(ok(recs));
  }),

  // Attendance — submit
  http.post("/api/attendance/submit", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      ok({
        sprintId: body.sprintId,
        attendanceDate: body.attendanceDate,
        recordsCount: body.records?.length ?? 0,
      }),
    );
  }),

  // Attendance — stats per employee
  http.get("/api/attendance/stats", () => HttpResponse.json(ok([]))),

  // Attendance — cohort stats per sprint
  http.get("/api/attendance/cohort-stats", () => HttpResponse.json(ok([]))),

  // Attendance — global cohort stats (all sprints)
  http.get("/api/attendance/cohort-stats/all", () => HttpResponse.json(ok([]))),

  // Users — /api/users?role=TRAINER or ?role=HR (MANAGER only — return 403 for others)
  http.get("/api/users", ({ request }) => {
    const url = new URL(request.url);
    const role = url.searchParams.get("role");
    if (role === "TRAINER") return HttpResponse.json(ok([MOCK_TRAINER]));
    return HttpResponse.json(ok([]));
  }),
];
