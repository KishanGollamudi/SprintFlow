// src/features/trainer/pages/TrainerDashboard.jsx
// Trainer dashboard — 3 sections: cohort bar chart, today's sprint cards, per-sprint pie charts.
//
// Data strategy (fixes stale-on-refresh for ALL sections):
//   1. On mount, fetch getAllBySprint for each sprint → fills bar chart + pie charts.
//   2. On mount, call ensureSession(sprintId, today) for each sprint → fetches today's
//      DB records into AttendanceContext sessions → fills Today's Sprint Cards.
//   3. After ensureSession resolves, merge today's session entries back into
//      sprintAttendance so bar chart + pie charts also reflect today's data immediately.
//   4. A `refreshKey` state is incremented after attendance submit so all sections re-fetch.

import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { useAppData } from "@/context/AppDataContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useAuth } from "@/context/AuthContext";
import attendanceService from "@/services/attendanceService";
import { unwrapList } from "@/utils/apiResponse";
import { T } from "@/theme/trainer";
import PageBanner from "@/components/PageBanner";
import { todayLocal } from "@/utils/dateUtils";

// ── Colour helpers ────────────────────────────────────────────────────────────
const pctColor = (pct) =>
  pct >= 75 ? T.green : pct >= 50 ? T.amber : T.red;

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle = {
  height: 32, borderRadius: 8, border: `1.5px solid ${T.border}`,
  background: "#fff", color: T.text, padding: "0 8px", fontSize: 12,
  outline: "none", cursor: "pointer", fontFamily: "inherit",
};

// ── Section card wrapper ──────────────────────────────────────────────────────
const Section = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    style={{
      background: T.card, border: `1.5px solid ${T.border}`,
      borderRadius: 16, overflow: "hidden", boxShadow: T.shadow,
    }}
  >
    <div style={{ height: 3, background: T.line }} />
    {children}
  </motion.div>
);

// ── Period filter: Daily / Weekly / Monthly + mini calendar ───────────────────
const PeriodFilter = ({ mode, setMode, dateVal, setDateVal }) => {
  const today = todayLocal();
  const handleMode = (m) => {
    setMode(m);
    setDateVal(m === "monthly" ? today.slice(0, 7) : today);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {["daily", "weekly", "monthly"].map((m) => (
        <button
          key={m}
          onClick={() => handleMode(m)}
          style={{
            height: 30, padding: "0 12px", borderRadius: 8, fontSize: 12,
            fontWeight: mode === m ? 700 : 500, cursor: "pointer",
            border: `1.5px solid ${mode === m ? T.accent : T.border}`,
            background: mode === m ? T.accentBg : "#fff",
            color: mode === m ? T.accent : T.sub,
          }}
        >
          {m.charAt(0).toUpperCase() + m.slice(1)}
        </button>
      ))}
      {mode === "monthly"
        ? <input type="month" value={dateVal} onChange={(e) => setDateVal(e.target.value)} style={inputStyle} />
        : <input type="date"  value={dateVal} onChange={(e) => setDateVal(e.target.value)} style={inputStyle} />
      }
    </div>
  );
};

// ── Filter flat attendance records by period ──────────────────────────────────
// records: flat array with `attendanceDate` field (YYYY-MM-DD)
function filterRecordsByPeriod(records, mode, dateVal) {
  return records.filter(({ attendanceDate }) => {
    if (!attendanceDate) return false;
    if (mode === "daily")   return attendanceDate === dateVal;
    if (mode === "monthly") return attendanceDate.startsWith(dateVal);
    if (mode === "weekly") {
      const d   = new Date(dateVal + "T00:00:00");
      const day = d.getDay();
      const mon = new Date(d);
      mon.setDate(d.getDate() - ((day + 6) % 7));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const fmt = (dt) => dt.toISOString().slice(0, 10);
      return attendanceDate >= fmt(mon) && attendanceDate <= fmt(sun);
    }
    return false;
  });
}

// ── Custom bar tooltip ────────────────────────────────────────────────────────
const BarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 10,
      padding: "10px 14px", fontSize: 12, boxShadow: T.shadowMd, minWidth: 170,
    }}>
      <p style={{ color: T.text, fontWeight: 700, margin: "0 0 4px" }}>{d.cohort}</p>
      <p style={{ color: T.sub, margin: "0 0 2px" }}>Sprint: {d.sprintTitle}</p>
      <p style={{ color: T.sub, margin: "0 0 2px" }}>Trainer: {d.trainerName}</p>
      <p style={{ color: pctColor(d.pct), fontWeight: 700, margin: 0 }}>{d.pct}% attendance</p>
    </div>
  );
};

// ── Section 1: Cohort Attendance Bar Chart ────────────────────────────────────
// Uses sprintAttendance (all historical + today) fetched in main component.
const CohortBarChart = ({ sprints, sprintAttendance, trainerName }) => {
  const [mode, setMode]       = useState("daily");
  const [dateVal, setDateVal] = useState(todayLocal());

  const barData = useMemo(() => {
    const result = [];
    sprints.forEach((sprint) => {
      const allRecs    = sprintAttendance[sprint.id] || [];
      const periodRecs = filterRecordsByPeriod(allRecs, mode, dateVal);
      const cohortCodes = sprint.cohorts?.length
        ? [...new Set(sprint.cohorts.map((c) => c.cohort).filter(Boolean))]
        : [sprint.cohort].filter(Boolean);

      cohortCodes.forEach((code) => {
        const cohortRecs = periodRecs.filter((r) => r.cohort === code);
        const present    = cohortRecs.filter((r) => r.status === "Present" || r.status === "Late").length;
        const total      = cohortRecs.length;
        const pct        = total > 0 ? Math.round((present / total) * 100) : 0;
        result.push({ cohort: code, sprintTitle: sprint.title, trainerName, pct, present, total });
      });
    });
    return result;
  }, [sprints, sprintAttendance, mode, dateVal, trainerName]);

  return (
    <Section delay={0.1}>
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <p style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Cohort Attendance %</p>
          <p style={{ color: T.muted, fontSize: 12, margin: "2px 0 0" }}>Across all your assigned sprints</p>
        </div>
        <PeriodFilter mode={mode} setMode={setMode} dateVal={dateVal} setDateVal={setDateVal} />
      </div>

      {barData.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>
          No attendance data for this period
        </div>
      ) : (
        <div style={{ padding: "0 20px 20px" }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="cohort" tick={{ fontSize: 12, fill: T.sub }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: T.accentBg }} />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]} maxBarSize={52}>
                {barData.map((d, i) => <Cell key={i} fill={pctColor(d.pct)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            {[["≥75%", T.green], ["50–74%", T.amber], ["<50%", T.red]].map(([label, color]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.sub }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
};

// ── Section 2: Today's Sprint Cards ──────────────────────────────────────────
// Reads from AttendanceContext sessions (already populated by ensureSession in parent).
// Column template shared by header and every data row.
const COLS = "1fr 1.4fr 220px";

const TodaySprintCards = ({ sprints, sessions }) => {
  const today = todayLocal();

  return (
    <Section delay={0.2}>
      <div style={{ padding: "16px 20px 12px" }}>
        <p style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Today's Sprints</p>
        <p style={{ color: T.muted, fontSize: 12, margin: "2px 0 0" }}>Live attendance for {today}</p>
      </div>

      {sprints.length === 0 ? (
        <div style={{ padding: "32px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>
          No sprints assigned to you
        </div>
      ) : (
        <div style={{ padding: "0 20px 20px" }}>
          {/* Header row */}
          <div style={{
            display: "grid", gridTemplateColumns: COLS, gap: 20,
            padding: "0 4px 10px", borderBottom: `1.5px solid ${T.border}`, marginBottom: 2,
          }}>
            <span style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Sprint</span>
            <span style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Progress</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[["P", T.green], ["L", T.amber], ["A", T.red], ["Total", T.sub]].map(([label, color]) => (
                <span key={label} style={{
                  color, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.07em", textAlign: "center",
                }}>{label}</span>
              ))}
            </div>
          </div>

          {/* Data rows — session passed directly from parent state (not re-called from context) */}
          {sprints.map((sprint, i) => {
            const key     = `${sprint.id}_${today}`;
            const session = sessions[key];
            return (
              <SprintRow
                key={sprint.id}
                sprint={sprint}
                session={session}
                isLast={i === sprints.length - 1}
              />
            );
          })}
        </div>
      )}
    </Section>
  );
};

// ── Single sprint row ─────────────────────────────────────────────────────────
const SprintRow = ({ sprint, session, isLast }) => {
  const entries    = session?.entries || [];
  const present    = entries.filter((e) => e.status === "Present").length;
  const late       = entries.filter((e) => e.status === "Late").length;
  const absent     = entries.filter((e) => e.status === "Absent").length;
  const total      = entries.length;
  const pct        = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  // notStarted: session not yet loaded from API OR genuinely not started
  const notStarted = !session || (!session.submitted && present === 0 && late === 0);

  const cohortLabel = sprint.cohorts?.length
    ? sprint.cohorts.map((c) => c.cohort).filter(Boolean).join(" / ")
    : sprint.cohort || "—";

  return (
    <div style={{
      display: "grid", gridTemplateColumns: COLS, gap: 20, alignItems: "center",
      padding: "13px 4px",
      borderBottom: isLast ? "none" : `1px solid ${T.border}`,
    }}>
      {/* Col 1 — Sprint details */}
      <div style={{ minWidth: 0 }}>
        <p style={{
          color: T.text, fontWeight: 700, fontSize: 13, margin: "0 0 3px",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{sprint.title}</p>
        <p style={{
          color: T.sub, fontSize: 11, margin: 0,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {sprint.sprintStart && sprint.sprintEnd
            ? `${sprint.sprintStart} – ${sprint.sprintEnd}` : "—"}
          {" · "}{cohortLabel}
          {sprint.room ? ` · ${sprint.room}` : ""}
        </p>
      </div>

      {/* Col 2 — Progress bar + % */}
      <div style={{ minWidth: 0 }}>
        {notStarted ? (
          <span style={{
            display: "inline-block", padding: "3px 10px", borderRadius: 20,
            background: T.accentBg, color: T.accent, fontSize: 11, fontWeight: 700,
            border: `1px solid ${T.accentBd}`,
          }}>Not started</span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 7, borderRadius: 4, background: T.bg2, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`, borderRadius: 4,
                background: pctColor(pct), transition: "width 0.4s",
              }} />
            </div>
            <span style={{ color: pctColor(pct), fontWeight: 700, fontSize: 13, minWidth: 36, textAlign: "right" }}>
              {pct}%
            </span>
          </div>
        )}
      </div>

      {/* Col 3 — P / L / A / Total */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {[[present, T.green], [late, T.amber], [absent, T.red], [total, T.sub]].map(([count, color], i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "6px 4px", borderRadius: 10,
            background: color + "14", border: `1px solid ${color}33`,
          }}>
            <span style={{ color, fontWeight: 800, fontSize: 15, lineHeight: 1 }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Section 3: Per-Sprint Pie Charts ─────────────────────────────────────────
const PIE_COLORS = { Present: T.green, Late: T.amber, Absent: T.red };

const SprintPieCharts = ({ sprints, sprintAttendance }) => {
  const [mode, setMode]       = useState("daily");
  const [dateVal, setDateVal] = useState(todayLocal());

  return (
    <Section delay={0.3}>
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <p style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Attendance Breakdown per Sprint</p>
          <p style={{ color: T.muted, fontSize: 12, margin: "2px 0 0" }}>Present / Late / Absent slices</p>
        </div>
        <PeriodFilter mode={mode} setMode={setMode} dateVal={dateVal} setDateVal={setDateVal} />
      </div>

      {sprints.length === 0 ? (
        <div style={{ padding: "32px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>
          No sprints assigned to you
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16, padding: "0 20px 20px" }}>
          {sprints.map((sprint) => (
            <SprintPie
              key={sprint.id}
              sprint={sprint}
              records={sprintAttendance[sprint.id] || []}
              mode={mode}
              dateVal={dateVal}
            />
          ))}
        </div>
      )}
    </Section>
  );
};

// ── Single sprint pie ─────────────────────────────────────────────────────────
const SprintPie = ({ sprint, records, mode, dateVal }) => {
  const pieData = useMemo(() => {
    const periodRecs = filterRecordsByPeriod(records, mode, dateVal);
    const counts = { Present: 0, Late: 0, Absent: 0 };
    periodRecs.forEach((r) => { if (r.status in counts) counts[r.status]++; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [records, mode, dateVal]);

  const cohortLabel = sprint.cohorts?.map((c) => c.cohort).filter(Boolean).join(" / ") || sprint.cohort || "—";

  return (
    <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "14px" }}>
      <p style={{ color: T.text, fontWeight: 700, fontSize: 13, margin: "0 0 2px" }}>{sprint.title}</p>
      <p style={{ color: T.muted, fontSize: 11, margin: "0 0 8px" }}>{cohortLabel}</p>

      {pieData.length === 0 ? (
        <div style={{ textAlign: "center", color: T.muted, fontSize: 12, padding: "28px 0" }}>
          No attendance data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="value">
              {pieData.map((d) => <Cell key={d.name} fill={PIE_COLORS[d.name] || T.accent} />)}
            </Pie>
            <Tooltip
              formatter={(val, name) => [val, name]}
              contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function TrainerDashboard() {
  const { user }    = useAuth();
  const { sprints } = useAppData();
  const { sessions, ensureSession } = useAttendance();

  const today       = todayLocal();
  const trainerName = user?.name || "Trainer";

  // sprintAttendance: { [sprintId]: flatRecord[] }
  // Holds ALL historical records (for bar chart + pie charts).
  const [sprintAttendance, setSprintAttendance] = useState({});

  // Fetch all historical attendance records per sprint (bar chart + pie charts)
  // AND call ensureSession for today so Today's Sprint Cards are populated from DB.
  const fetchAll = useCallback(() => {
    if (!sprints.length) return;
    sprints.forEach((sprint) => {
      // 1. Fetch all historical records for charts
      attendanceService
        .getAllBySprint(sprint.id)
        .then((res) => {
          const list = unwrapList(res);
          if (!Array.isArray(list) || !list.length) return;
          const normalised = list.map((r) => ({
            attendanceDate: r.attendanceDate ?? r.date ?? "",
            empId:          r.empId ?? "",
            employeeId:     r.employeeId ?? null,
            name:           r.employeeName ?? r.name ?? "",
            cohort:         r.cohort ?? "",
            technology:     r.technology ?? "",
            status:         r.status ?? "Absent",
          }));
          setSprintAttendance((prev) => ({ ...prev, [sprint.id]: normalised }));
        })
        .catch(() => {});

      // 2. Fetch today's session into AttendanceContext so Today's Sprint Cards
      //    show real DB data on every page load / refresh.
      ensureSession(sprint.id, today);
    });
  }, [sprints, ensureSession, today]);

  // Run on mount and whenever sprints list changes
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // After a new attendance submission, re-fetch so all sections update
  // without requiring a full page reload.
  // AttendanceContext.submitAttendance already calls setAttendanceForDate,
  // but sprintAttendance (local state) needs a fresh getAllBySprint call.
  // We watch sessions: when any session flips to submitted=true, re-fetch charts.
  const submittedKeys = useMemo(
    () => Object.values(sessions).filter((s) => s?.submitted).map((s) => `${s.sprintId}_${s.date}`).join(","),
    [sessions],
  );

  useEffect(() => {
    if (!submittedKeys) return;
    // Re-fetch historical records so bar chart + pie charts include the new submission
    sprints.forEach((sprint) => {
      attendanceService
        .getAllBySprint(sprint.id)
        .then((res) => {
          const list = unwrapList(res);
          if (!Array.isArray(list) || !list.length) return;
          const normalised = list.map((r) => ({
            attendanceDate: r.attendanceDate ?? r.date ?? "",
            empId:          r.empId ?? "",
            employeeId:     r.employeeId ?? null,
            name:           r.employeeName ?? r.name ?? "",
            cohort:         r.cohort ?? "",
            technology:     r.technology ?? "",
            status:         r.status ?? "Absent",
          }));
          setSprintAttendance((prev) => ({ ...prev, [sprint.id]: normalised }));
        })
        .catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedKeys]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        <PageBanner
          title="Trainer Dashboard"
          gradient="linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)"
          shadow="4px 0 24px rgba(13,148,136,0.30)"
          width="320px"
        />

        {/* Section 1 — Cohort Attendance Bar Chart */}
        <CohortBarChart
          sprints={sprints}
          sprintAttendance={sprintAttendance}
          trainerName={trainerName}
        />

        {/* Section 2 — Today's Sprint Cards
            Reads directly from AttendanceContext sessions (populated by ensureSession above) */}
        <TodaySprintCards sprints={sprints} sessions={sessions} />

        {/* Section 3 — Per-Sprint Pie Charts */}
        <SprintPieCharts
          sprints={sprints}
          sprintAttendance={sprintAttendance}
        />

      </div>
    </motion.div>
  );
}
