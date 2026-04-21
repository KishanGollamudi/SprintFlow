import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import employeeService from "@/services/employeeService";
import userService from "@/services/userService";
import sprintService from "@/services/sprintService";
import attendanceService from "@/services/attendanceService";
import { useAuth } from "@/context/AuthContext";
import { unwrapList } from "@/utils/apiResponse";
import { LEGACY_COHORT_NAMES } from "@/constants/cohortLabels";

// Static room list — no backend endpoint needed
const STATIC_ROOMS = [
  "Room A - Sandeepa",
  "Room B - Dhrona",
  "Room C - Brahma",
  "Room D - Maheshwara",
];

const AppDataContext = createContext();

/** HR-defined cohort names (persisted); merged with cohorts present on employees */
const COHORT_STORAGE_KEY = "sprintflow_hr_cohort_names";

/** Opt-in demo mode: set VITE_USE_MOCK=true — default uses real API / DB */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();
  const [sprints, setSprints] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [hrbps, setHrbps] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [sprintCohortStats, setSprintCohortStats] = useState({});
  const [globalCohortStats, setGlobalCohortStats] = useState([]);
  const [extraCohortNames, setExtraCohortNames] = useState([]);
  const [rooms] = useState(STATIC_ROOMS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COHORT_STORAGE_KEY);
      if (raw) {
        let list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list = list.filter((c) => !LEGACY_COHORT_NAMES.has(c));
          setExtraCohortNames(list);
          localStorage.setItem(COHORT_STORAGE_KEY, JSON.stringify(list));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const cohortNames = useMemo(() => {
    const fromEmp = employees.map((e) => e.cohort).filter(Boolean);
    return [...new Set([...extraCohortNames, ...fromEmp])].sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
  }, [employees, extraCohortNames]);

  const persistCohortNames = useCallback((list) => {
    setExtraCohortNames(list);
    try {
      localStorage.setItem(COHORT_STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }, []);

  const addCohort = useCallback(
    (name) => {
      const n = String(name ?? "").trim();
      if (!n) return { ok: false, message: "Enter a cohort name." };
      if (LEGACY_COHORT_NAMES.has(n))
        return {
          ok: false,
          message: "Use the same format as the database, e.g. Java cohort 1.",
        };
      const all = [
        ...new Set([
          ...extraCohortNames,
          ...employees.map((e) => e.cohort).filter(Boolean),
        ]),
      ];
      if (all.includes(n))
        return { ok: false, message: "That cohort already exists." };
      persistCohortNames([...extraCohortNames, n]);
      return { ok: true };
    },
    [employees, extraCohortNames, persistCohortNames],
  );

  const removeCohort = useCallback(
    (name) => {
      if (employees.some((e) => e.cohort === name))
        return {
          ok: false,
          message: "Reassign or remove employees in this cohort first.",
        };
      persistCohortNames(extraCohortNames.filter((c) => c !== name));
      return { ok: true };
    },
    [employees, extraCohortNames, persistCohortNames],
  );

  // ── Load real data from API ───────────────────────────────
  useEffect(() => {
    if (USE_MOCK) return;
    const token = localStorage.getItem("accessToken");
    if (!token || !user) return;

    const role = user.role?.toLowerCase();
    const uid = user.id;

    employeeService
      .getAll()
      .then((res) => setEmployees(unwrapList(res)))
      .catch(() => {});

    // Fetch global cohort attendance stats for trainer dashboard
    attendanceService
      .getGlobalCohortStats()
      .then((res) => setGlobalCohortStats(unwrapList(res)))
      .catch(() => {});

    // /api/users is restricted to MANAGER — only fetch for that role
    if (role === "manager") {
      userService
        .getAllHRBPs()
        .then((res) => setHrbps(unwrapList(res)))
        .catch(() => {});
      userService
        .getAllTrainers()
        .then((res) => setTrainers(unwrapList(res)))
        .catch(() => {});
    }
    // HR needs Active trainers only for the CreateSprint trainer dropdown
    // TRAINER role must NOT call /api/users — it is MANAGER-only (403)
    if (role === "hr") {
      userService
        .getTrainers()
        .then((res) => setTrainers(unwrapList(res)))
        .catch(() => {});
    }

    const sprintReq =
      role === "trainer" && uid != null
        ? sprintService.getByTrainer(uid)
        : sprintService.getAll();

    sprintReq
      .then((res) => {
        const list = unwrapList(res);
        // ensure unique by id
        const seen = new Set();
        const unique = list.filter((s) => {
          if (!s || !s.id) return true;
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
        setSprints(unique);
        // For each sprint: load cohort stats AND all attendance records
        list.forEach((s) => {
          // Cohort stats (for breakdown panel)
          attendanceService
            .getCohortStats(s.id)
            .then((r) => {
              const stats = unwrapList(r);
              if (stats.length) {
                // If backend doesn't return `sessions`, compute from all attendance records
                const needSessions = stats[0].sessions == null;
                if (needSessions) {
                  attendanceService
                    .getAllBySprint(s.id)
                    .then((allRes) => {
                      const recs = unwrapList(allRes) || [];
                      const dates = new Set(
                        recs
                          .map((rec) => rec.attendanceDate ?? rec.date)
                          .filter(Boolean),
                      );
                      // attach sessions count to first cohort stat (used by dashboard)
                      const patched = stats.map((st, idx) =>
                        idx === 0 ? { ...st, sessions: dates.size } : st,
                      );
                      setSprintCohortStats((prev) => ({
                        ...prev,
                        [s.id]: patched,
                      }));
                    })
                    .catch(() => {
                      setSprintCohortStats((prev) => ({
                        ...prev,
                        [s.id]: stats,
                      }));
                    });
                } else {
                  setSprintCohortStats((prev) => ({ ...prev, [s.id]: stats }));
                }
              }
            })
            .catch(() => {});

          // All attendance records for this sprint (for charts + stat cards)
          attendanceService
            .getAllBySprint(s.id)
            .then((r) => {
              const records = unwrapList(r);
              if (!records.length) return;
              // Group by date and merge into attendance map
              const byDate = {};
              records.forEach((rec) => {
                const dateKey = rec.attendanceDate ?? rec.date ?? "";
                if (!dateKey) return;
                if (!byDate[dateKey]) byDate[dateKey] = [];
                byDate[dateKey].push({
                  // Store both empId (string e.g. "EMP001") and employeeId (numeric DB id)
                  // so TrainerDashboard can match against employees.empId correctly
                  sprintId:   s.id,
                  empId:      rec.empId ?? "",
                  employeeId: rec.employeeId ?? rec.empId ?? null,
                  name:       rec.employeeName ?? rec.name ?? "",
                  cohort:     rec.cohort ?? "",
                  technology: rec.technology ?? "",
                  sprint:     rec.sprintTitle ?? s.title ?? "",
                  status:     rec.status ?? "Absent",
                  time:       rec.checkInTime ?? null,
                });
              });
              setAttendance((prev) => {
                const merged = { ...prev };
                Object.entries(byDate).forEach(([date, recs]) => {
                  merged[date] = [...(merged[date] || []), ...recs];
                });
                return merged;
              });
            })
            .catch(() => {});
        });
      })
      .catch(() => {});

    // Rooms are static — no API call needed
    // setRooms is already initialised with STATIC_ROOMS above
  }, [user]);

  // ── Employees ─────────────────────────────────────────────
  const addEmployee = async (data) => {
    if (USE_MOCK) {
      setEmployees((p) => [...p, { ...data, id: crypto.randomUUID() }]);
      return;
    }
    const res = await employeeService.create(data);
    const created = res?.data ?? res;
    setEmployees((p) => [...p, created]);
  };
  const updateEmployee = async (id, data) => {
    if (USE_MOCK) {
      setEmployees((p) => p.map((e) => (e.id === id ? { ...e, ...data } : e)));
      return;
    }
    const res = await employeeService.update(id, data);
    const updated = res?.data ?? res;
    setEmployees((p) => p.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  };
  const deleteEmployee = async (id) => {
    if (USE_MOCK) {
      setEmployees((p) => p.filter((e) => e.id !== id));
      return;
    }
    await employeeService.delete(id);
    setEmployees((p) => p.filter((e) => e.id !== id));
  };

  // ── HRBPs ─────────────────────────────────────────────────
  const addHrbp = async (data) => {
    if (USE_MOCK) {
      setHrbps((p) => [...p, { ...data, id: crypto.randomUUID() }]);
      return;
    }
    // Strip any `role` field from the form — DB Role enum must be "HR"
    const { joined, role: _formRole, ...rest } = data;
    const payload = {
      ...rest,
      role: "HR",
      joinedDate: joined ?? data.joinedDate ?? null,
    };
    const res = await userService.create(payload);
    const created = res?.data ?? res;
    setHrbps((p) => [...p, created]);
  };
  const updateHrbp = async (id, data) => {
    if (USE_MOCK) {
      setHrbps((p) => p.map((h) => (h.id === id ? { ...h, ...data } : h)));
      return;
    }
    // Strip frontend-only 'joined' key; send only 'joinedDate' to backend
    const { joined, ...rest } = data;
    const payload = { ...rest, joinedDate: joined ?? data.joinedDate ?? null };
    const res = await userService.update(id, payload);
    const updated = res?.data ?? res;
    setHrbps((p) => p.map((h) => (h.id === id ? { ...h, ...updated } : h)));
  };
  const deleteHrbp = async (id) => {
    if (USE_MOCK) {
      setHrbps((p) =>
        p.map((h) => (h.id === id ? { ...h, status: "Inactive" } : h)),
      );
      return;
    }
    await userService.delete(id);
    setHrbps((p) =>
      p.map((h) => (h.id === id ? { ...h, status: "Inactive" } : h)),
    );
  };
  const restoreHrbp = async (id) => {
    if (USE_MOCK) {
      setHrbps((p) =>
        p.map((h) => (h.id === id ? { ...h, status: "Active" } : h)),
      );
      return;
    }
    await userService.restore(id);
    setHrbps((p) =>
      p.map((h) => (h.id === id ? { ...h, status: "Active" } : h)),
    );
  };

  // ── Trainers ──────────────────────────────────────────────
  const addTrainer = async (data) => {
    if (USE_MOCK) {
      setTrainers((p) => [...p, { ...data, id: crypto.randomUUID() }]);
      return;
    }
    // Strip frontend form's `role` field (trainerRole value like "Manager-Trainings")
    // and map it to `trainerRole`. The DB Role enum must be "TRAINER".
    const { joined, role: trainerRoleFromForm, ...rest } = data;
    const payload = {
      ...rest,
      role: "TRAINER",
      trainerRole: trainerRoleFromForm ?? data.trainerRole ?? null,
      joinedDate: joined ?? data.joinedDate ?? null,
    };
    const res = await userService.create(payload);
    const created = res?.data ?? res;
    setTrainers((p) => [...p, created]);
  };
  const updateTrainer = async (id, data) => {
    if (USE_MOCK) {
      setTrainers((p) => p.map((t) => (t.id === id ? { ...t, ...data } : t)));
      return;
    }
    // Extract form's role field (trainerRole value) and map correctly
    const { joined, role: trainerRoleFromForm, ...rest } = data;
    const payload = {
      ...rest,
      trainerRole: trainerRoleFromForm ?? data.trainerRole ?? null,
      joinedDate: joined ?? data.joinedDate ?? null,
    };
    const res = await userService.update(id, payload);
    const updated = res?.data ?? res;
    setTrainers((p) => p.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };
  const deleteTrainer = async (id) => {
    if (USE_MOCK) {
      setTrainers((p) =>
        p.map((t) => (t.id === id ? { ...t, status: "Inactive" } : t)),
      );
      return;
    }
    await userService.delete(id);
    setTrainers((p) =>
      p.map((t) => (t.id === id ? { ...t, status: "Inactive" } : t)),
    );
  };
  const restoreTrainer = async (id) => {
    if (USE_MOCK) {
      setTrainers((p) =>
        p.map((t) => (t.id === id ? { ...t, status: "Active" } : t)),
      );
      return;
    }
    await userService.restore(id);
    setTrainers((p) =>
      p.map((t) => (t.id === id ? { ...t, status: "Active" } : t)),
    );
  };

  // ── Sprints (AppData — used by manager module) ────────────
  const addSprint = async (data) => {
    // Allow callers to opt-out of making an API call by passing
    // `_skipApi: true` on the payload (SprintContext uses this
    // to avoid creating the same sprint twice).
    if (data && data._skipApi) {
      const copy = { ...data };
      delete copy._skipApi;
      setSprints((p) => {
        const next = [...p, copy];
        const seen = new Set();
        return next.filter((s) => {
          if (!s || !s.id) return true;
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
      });
      return;
    }
    if (USE_MOCK) {
      setSprints((p) => {
        const next = [...p, { ...data, id: crypto.randomUUID() }];
        const seen = new Set();
        return next.filter((s) => {
          if (!s || !s.id) return true;
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
      });
      return;
    }
    const res = await sprintService.create(data);
    const created = res?.data ?? res;
    setSprints((p) => {
      const next = [...p, created];
      const seen = new Set();
      return next.filter((s) => {
        if (!s || !s.id) return true;
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
    });
  };
  const updateSprint = async (id, data) => {
    if (USE_MOCK) {
      setSprints((p) => p.map((s) => (s.id === id ? { ...s, ...data } : s)));
      return;
    }
    const res = await sprintService.update(id, data);
    const updated = res?.data ?? res;
    setSprints((p) => p.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };
  const deleteSprint = async (id) => {
    if (USE_MOCK) {
      setSprints((p) => p.filter((s) => s.id !== id));
      return;
    }
    await sprintService.delete(id);
    setSprints((p) => p.filter((s) => s.id !== id));
  };

  // Local-only status patch — no API call, used by SprintContext.updateStatus
  // so manager dashboard reflects status changes made from trainer/HR sprint pages
  const patchSprintStatus = (id, status) => {
    setSprints((p) => p.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  // ── Attendance (DailyAttendance page) ────────────────────
  const getAttendanceForDate = (date) => attendance[date] ?? [];
  const setAttendanceForDate = (date, records) =>
    setAttendance((p) => ({ ...p, [date]: records }));

  return (
    <AppDataContext.Provider
      value={{
        sprints,
        employees,
        sprintCohortStats,
        globalCohortStats,
        hrbps,
        trainers,
        attendance,
        cohortNames,
        addCohort,
        removeCohort,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addHrbp,
        updateHrbp,
        deleteHrbp,
        restoreHrbp,
        addTrainer,
        updateTrainer,
        deleteTrainer,
        restoreTrainer,
        addSprint,
        updateSprint,
        deleteSprint,
        patchSprintStatus,
        getAttendanceForDate,
        setAttendanceForDate,
        rooms,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
