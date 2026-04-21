// ─────────────────────────────────────────────────────────────
// src/services/attendanceService.js
// Handles all attendance operations
//
// Backend endpoints:
//   POST /api/attendance/submit          — submit attendance for a date
//   GET  /api/attendance?sprintId=&date= — get attendance by sprint+date
//   GET  /api/attendance/stats?sprintId= — get stats per employee
//   GET  /api/attendance/cohort-stats?sprintId= — cohort breakdown
//
// Attendance entry shape:
// {
//   employeeId, status: "Present"|"Late"|"Absent",
//   checkInTime, notes
// }
//
// Submit body:
// {
//   sprintId, attendanceDate,
//   records: [{ employeeId, status, checkInTime, notes }]
// }
// ─────────────────────────────────────────────────────────────

import api from "./api";

const attendanceService = {
  // ── Submit attendance for a date (TRAINER only) ─────────────
  // Locks the session after submission
  submit(sprintId, date, records, sendAbsenceEmails = false) {
    return api.post("/attendance/submit", {
      sprintId,
      attendanceDate: date,
      records,
      sendAbsenceEmails,
    });
  },

  // ── Get ALL records for a sprint across all dates ────────
  // Used by AttendanceList (Attendance Overview)
  getAllBySprint(sprintId) {
    return api.get("/attendance/all", { params: { sprintId } });
  },

  // ── Get attendance records by sprint + date ─────────────────
  getByDate(sprintId, date) {
    return api.get("/attendance", { params: { sprintId, date } });
  },

  // ── Get attendance statistics per employee for a sprint ──────
  // Returns: [{ employeeId, employeeName, totalDays, presentDays,
  //             absentDays, lateDays, presentPercentage }]
  getStats(sprintId) {
    return api.get("/attendance/stats", { params: { sprintId } });
  },

  // ── Get cohort-level attendance breakdown for a sprint ───────
  // Returns: [{ cohort, technology, totalDays, presentDays,
  //             presentPercentage }]
  getCohortStats(sprintId) {
    return api.get("/attendance/cohort-stats", { params: { sprintId } });
  },

  // ── Get global cohort stats across ALL sprints ───────────────
  getGlobalCohortStats() {
    return api.get("/attendance/cohort-stats/all");
  },

  // ── Update single attendance record ─────────────────────────
  // NOTE: No backend PATCH /api/attendance/record endpoint exists.
  // Status changes are applied locally and submitted via submit().
  // updateRecord(sprintId, date, employeeId, status) — removed to avoid 404 calls
};

export default attendanceService;
