/**
 * Shared date utilities — fixes timezone off-by-one bug and
 * provides consistent date formatting across all dashboards.
 */

/** Format ISO date string "2024-03-15" → "15 Mar 2024" */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  // Parse as local date to avoid UTC timezone shift
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Format date range "2024-03-01" → "2024-03-31" → "1 Mar – 31 Mar 2024" */
export function formatDateRange(start, end) {
  if (!start || !end) return "—";
  const [sy, sm, sd] = String(start).split("-").map(Number);
  const [ey, em, ed] = String(end).split("-").map(Number);
  const s = new Date(sy, sm - 1, sd);
  const e = new Date(ey, em - 1, ed);
  const sLabel = s.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const eLabel = e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${sLabel} – ${eLabel}`;
}

/** Get today's date as "YYYY-MM-DD" in LOCAL timezone (not UTC) */
export function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse "YYYY-MM-DD" as a LOCAL date (avoids UTC midnight → previous day bug).
 * Use this instead of new Date("YYYY-MM-DD") everywhere.
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Get month index (0-11) from "YYYY-MM-DD" safely in local timezone */
export function getLocalMonth(dateStr) {
  const d = parseLocalDate(dateStr);
  return d ? d.getMonth() : -1;
}

/** Get full year from "YYYY-MM-DD" safely in local timezone */
export function getLocalYear(dateStr) {
  const d = parseLocalDate(dateStr);
  return d ? d.getFullYear() : -1;
}

/** Clamp a date string within [min, max] range */
export function clampDate(dateStr, min, max) {
  if (!dateStr) return min ?? "";
  if (min && dateStr < min) return min;
  if (max && dateStr > max) return max;
  return dateStr;
}
