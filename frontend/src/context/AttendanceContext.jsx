// ─────────────────────────────────────────────────────────────
// src/context/AttendanceContext.jsx
//
// USE_MOCK = true  → local session state built from AppDataContext employees
// USE_MOCK = false → real API via attendanceService
// ─────────────────────────────────────────────────────────────
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAppData } from "@/context/AppDataContext";
import { useSprints } from "@/context/SprintContext";
import attendanceService from "@/services/attendanceService";
import { unwrapList } from "@/utils/apiResponse";
import sprintService from "@/services/sprintService";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const AttendanceContext = createContext();

function cohortAbbrev(name) {
  if (!name) return null;
  const s = String(name).trim();
  const m = s.match(/^(.+?)\s+cohort\s+(\d+)$/i);
  if (!m) return null;
  const tech = m[1].trim();
  const num = m[2];
  const abbr = tech
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("");
  return `${abbr}C${num}`;
}

function cohortVariants(name) {
  const s = String(name ?? "").trim();
  if (!s) return [];
  const out = new Set([s.toLowerCase()]);
  const ab = cohortAbbrev(s);
  if (ab) out.add(ab.toLowerCase());
  return [...out];
}

export const AttendanceProvider = ({ children }) => {
  const { employees: appEmployees, setAttendanceForDate } = useAppData();
  const { sprints } = useSprints();

  // sessions: { "sprintId_date": { submitted, date, sprintId, entries: [...] } }
  const [sessions, setSessions] = useState({});
  const sessionsRef = useRef(sessions);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Keep unsubmitted, non-future sessions in sync when employees/sprints change.
  // Never touch submitted sessions or sessions whose entries came from the API.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setSessions((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(prev).forEach((key) => {
        const existing = prev[key];
        // Skip: submitted, or future date (no real data to sync)
        if (!existing || existing.submitted) return;
        if (existing.date > today) return;

        const sprintId = existing.sprintId;
        const rebuilt = buildEntries(sprintId);

        // Merge only preserved in-progress edits (status changes the trainer made)
        const map = existing.entries.reduce((acc, e) => {
          acc[String(e.id)] = e;
          return acc;
        }, {});

        const merged = rebuilt.map((e) => {
          const prevE = map[String(e.id)];
          if (!prevE) return e;
          return {
            ...e,
            status: prevE.status ?? e.status,
            checkInTime: prevE.checkInTime ?? prevE.time ?? null,
            notes: prevE.notes ?? null,
          };
        });

        const same =
          merged.length === existing.entries.length &&
          merged.every(
            (m, i) =>
              m.id === existing.entries[i].id &&
              m.status === existing.entries[i].status,
          );
        if (!same) {
          next[key] = { ...existing, entries: merged };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [appEmployees, sprints]);

  const getSessionKey = (sprintId, date) => `${sprintId}_${date}`;

  // Build entries for a sprint by matching employees to sprint's cohort pairs
  const buildEntries = useCallback(
    (sprintId) => {
      const sprint = sprints.find((s) => String(s.id) === String(sprintId));
      if (!sprint) return [];

      // Get all cohort+technology pairs for this sprint
      const pairs = sprint.cohorts?.length
        ? sprint.cohorts
        : [
            {
              technology: sprint.technology || "",
              cohort: sprint.cohort || "",
            },
          ];

      // Match employees from AppDataContext by technology AND cohort.
      // Cohort may be stored as full text ("Java cohort 2") or abbreviated ("JC2").
      const matched = appEmployees.filter((emp) => {
        const empTech = String(emp.technology ?? "").toLowerCase();
        const empCohorts = cohortVariants(emp.cohort);
        return pairs.some((pair) => {
          const pairTech = String(pair.technology ?? "").toLowerCase();
          if (!pairTech || !empTech) return false;
          if (pairTech !== empTech) return false;

          const pairCohorts = cohortVariants(pair.cohort);
          if (pairCohorts.length === 0) return true; // no cohort constraint

          // Exact variant match OR substring containment (legacy data)
          return pairCohorts.some((pc) =>
            empCohorts.some(
              (ec) => ec === pc || ec.includes(pc) || pc.includes(ec),
            ),
          );
        });
      });

      // Map to attendance entry shape
      return matched.map((emp) => ({
        id: String(emp.id),
        empId: emp.empId,
        name: emp.name,
        email: emp.email,
        techStack: emp.technology,
        cohort: emp.cohort,
        sprintId: sprint.id,
        status: "Absent",
      }));
    },
    [appEmployees, sprints],
  );

  const getSession = (sprintId, date) => {
    const key = getSessionKey(sprintId, date);
    // Return existing session if present. Do NOT call setState here —
    // creating sessions during render causes React update-in-render errors.
    if (sessions[key]) return sessions[key];

    // If session is missing, return a transient session object built from
    // current app data. Caller should use `ensureSession` in an effect to
    // persist the session into state when appropriate.
    const entries = buildEntries(sprintId);
    return { submitted: false, date, sprintId, entries };
  };

  const ensureSession = useCallback(
    async (sprintId, date) => {
      const key = getSessionKey(sprintId, date);

      // Always re-fetch from API when the date changes so future dates
      // never show stale statuses from a previously visited date.
      // Only skip if the session is already submitted (locked).
      const existing = sessionsRef.current[key];
      if (existing?.submitted) return;

      // Immediately set a clean session with all-Absent entries so the UI
      // never flashes data from a different date while the API call is in-flight.
      // Prefer server-enrolled employees for real backends; fall back to cohort matching.
      let freshEntries = buildEntries(sprintId);
      if (!USE_MOCK) {
        try {
          const resE = await sprintService
            .getEmployees(sprintId)
            .catch(() => null);
          const list = unwrapList(resE) || (resE?.data ?? resE) || [];
          if (Array.isArray(list) && list.length) {
            freshEntries = list.map((emp) => ({
              id: String(emp.id ?? emp.employeeId ?? emp.empId),
              empId: emp.empId ?? emp.employeeId ?? null,
              name: emp.name ?? emp.employeeName ?? "",
              email: emp.email ?? null,
              techStack: emp.technology ?? emp.tech ?? "",
              cohort: emp.cohort ?? "",
              sprintId,
              status: "Absent",
            }));
          }
        } catch {
          // ignore and keep cohort-matched entries
        }
      }
      setSessions((prev) => ({
        ...prev,
        [key]: { submitted: false, date, sprintId, entries: freshEntries },
      }));

      if (USE_MOCK) return;

      try {
        const res = await attendanceService.getByDate(sprintId, date);
        const list = unwrapList(res);
        if (Array.isArray(list) && list.length > 0) {
          // Records exist in DB — restore real statuses and lock if submitted
          const entries = list.map((r) => {
            const entryId = String(r.employeeId ?? r.id);
            // try to resolve email from appEmployees cache
            const match = appEmployees.find(
              (ae) =>
                String(ae.id) === entryId ||
                String(ae.empId) === String(r.empId),
            );
            return {
              id: entryId,
              empId: r.empId,
              name: r.employeeName ?? r.name ?? "",
              email: match?.email ?? null,
              techStack: r.technology ?? "",
              cohort: r.cohort ?? "",
              sprintId,
              status: r.status ?? "Absent",
              checkInTime: r.checkInTime ?? null,
              notes: r.notes ?? null,
            };
          });
          const isSubmitted = list.some((r) => r.submitted === true);
          setSessions((prev) => ({
            ...prev,
            [key]: { submitted: isSubmitted, date, sprintId, entries },
          }));
        }
        // If list is empty: future date with no records — keep the fresh
        // all-Absent session already set above. Do NOT carry over any statuses.
      } catch {
        // API failed — keep the fresh all-Absent session
      }
    },
    [buildEntries],
  );

  const updateStatus = (sprintId, date, employeeId, status) => {
    const key = getSessionKey(sprintId, date);
    setSessions((prev) => {
      const existing = prev[key];
      if (!existing || existing.submitted) return prev;
      return {
        ...prev,
        [key]: {
          ...existing,
          entries: existing.entries.map((e) =>
            e.id === String(employeeId) ? { ...e, status } : e,
          ),
        },
      };
    });
  };

  const markAllPresent = (sprintId, date, ids) => {
    const key = getSessionKey(sprintId, date);
    setSessions((prev) => {
      const existing = prev[key];
      if (!existing || existing.submitted) return prev;
      const strIds = ids.map(String);
      return {
        ...prev,
        [key]: {
          ...existing,
          entries: existing.entries.map((e) =>
            strIds.includes(String(e.id)) ? { ...e, status: "Present" } : e,
          ),
        },
      };
    });
  };

  const submitAttendance = async (
    sprintId,
    date,
    sendAbsenceEmails = false,
  ) => {
    const key = getSessionKey(sprintId, date);
    const session = sessions[key] || getSession(sprintId, date);

    // Guard: nothing to submit
    if (!session.entries || session.entries.length === 0) {
      return {
        ok: false,
        error:
          "No attendance entries found for this sprint and date. Make sure employees are enrolled.",
      };
    }

    const records = session.entries
      .map((e) => ({
        employeeId: Number(e.id),
        status: e.status || "Absent",
        checkInTime: e.status !== "Absent" ? e.checkInTime || null : null,
        notes: e.notes || null,
      }))
      .filter((r) => !isNaN(r.employeeId) && r.employeeId > 0);

    if (records.length === 0) {
      return {
        ok: false,
        error:
          "Employee IDs are missing. Please reload the page and try again.",
      };
    }

    if (!USE_MOCK) {
      try {
        await attendanceService.submit(
          sprintId,
          date,
          records,
          sendAbsenceEmails,
        );

        // Refresh attendance for the date from API and update AppData cache
        try {
          const res = await attendanceService
            .getByDate(sprintId, date)
            .catch(() => null);
          const list = unwrapList(res);
          // map API records to AppData `attendance` shape used by dashboards
          const mapped = Array.isArray(list)
            ? list.map((r) => ({
                sprintId:   sprintId,
                empId:      r.empId ?? r.employeeId,
                name:       r.employeeName ?? r.name,
                cohort:     r.cohort,
                technology: r.technology,
                sprint:     r.sprintTitle ?? r.sprint ?? "",
                status:     r.status,
                time:       r.checkInTime ?? r.time ?? null,
              }))
            : [];
          if (typeof setAttendanceForDate === "function")
            setAttendanceForDate(date, mapped);
        } catch (refreshErr) {
          console.warn(
            "Failed to refresh attendance after submit:",
            refreshErr,
          );
        }
      } catch (err) {
        console.error("Failed to submit attendance:", err);
        return { ok: false, error: err.message || String(err) };
      }
    }

    setSessions((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return { ...prev, [key]: { ...existing, submitted: true } };
    });

    return { ok: true };
  };

  // Deduplicated employees across all sessions (latest status per employee)
  const employees = useMemo(
    () =>
      Object.values(
        Object.values(sessions)
          .flatMap((s) => s.entries)
          .reduce((acc, e) => {
            acc[e.id] = e;
            return acc;
          }, {}),
      ),
    [sessions],
  );

  return (
    <AttendanceContext.Provider
      value={{
        sessions,
        employees,
        getSession,
        ensureSession,
        updateStatus,
        markAllPresent,
        submitAttendance,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => useContext(AttendanceContext);
