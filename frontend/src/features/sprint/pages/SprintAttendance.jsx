import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  CheckSquare,
  Search,
  Users,
  UserCheck,
  Clock,
  UserX,
  Send,
  Lock,
} from "lucide-react";
import { useAttendance } from "@/context/AttendanceContext";
import { useSprints } from "@/context/SprintContext";
import { T } from "@/theme/trainer";
import { todayLocal, clampDate } from "@/utils/dateUtils";

const STATUSES = ["Present", "Late", "Absent"];

const STATUS_STYLES = {
  Present: {
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
    border: "rgba(5,150,105,0.25)",
  },
  Late: { color: T.amber, bg: T.amberBg, border: "rgba(217,119,6,0.25)" },
  Absent: { color: T.red, bg: T.redBg, border: "rgba(220,38,38,0.25)" },
};
const STACK_STYLES = {
  Java: { color: "#0d9488", bg: "rgba(13,148,136,0.08)" },
  Devops: { color: "#0f766e", bg: "rgba(15,118,110,0.08)" },
  Python: { color: "#14b8a6", bg: "rgba(20,184,166,0.08)" },
  DotNet: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  SalesForce: { color: "#ec4899", bg: "rgba(236,72,153,0.08)" },
};
const statusConfig = {
  Scheduled: { color: T.accent, bg: T.accentBg },
  "On Hold": { color: T.amber, bg: T.amberBg },
  Completed: { color: "#059669", bg: "rgba(5,150,105,0.08)" },
};

const inp = {
  background: T.card,
  border: `1.5px solid ${T.border}`,
  borderRadius: 10,
  color: T.text,
  padding: "8px 12px",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
};

export default function SprintAttendance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sprints } = useSprints();
  const {
    getSession,
    updateStatus,
    markAllPresent,
    submitAttendance,
    ensureSession,
  } = useAttendance();

  const sprint = sprints.find((s) => String(s.id) === String(id));
  const today = todayLocal();

  const getDefaultDate = (sp) => {
    if (!sp) return today;
    return today >= sp.startDate && today <= sp.endDate ? today : sp.startDate;
  };

  const [selectedDate, setSelectedDate] = useState(() =>
    getDefaultDate(sprint),
  );
  const [search, setSearch] = useState("");
  const [stackFilter, setStack] = useState("All");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendEmails, setSendEmails] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  // Fix #7 — update selectedDate when sprint loads after initial render
  useEffect(() => {
    if (sprint) {
      const correct = getDefaultDate(sprint);
      setSelectedDate((prev) => (prev === today ? correct : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprint?.id]);

  useEffect(() => {
    if (!sprint) return;
    setLoadingSession(true);
    ensureSession(sprint.id, selectedDate).finally(() =>
      setLoadingSession(false),
    );
  }, [selectedDate, sprint?.id, ensureSession]);

  const session = sprint
    ? getSession(sprint.id, selectedDate)
    : { entries: [], submitted: false };
  const attendees = session.entries;
  const isLocked = session.submitted;

  const techStacks = useMemo(() => {
    const unique = [
      ...new Set(attendees.map((e) => e.techStack).filter(Boolean)),
    ];
    return ["All", ...unique.sort()];
  }, [attendees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return attendees.filter((e) => {
      const idStr = String(e.empId ?? e.id ?? "");
      const matchSearch =
        (e.name ?? "").toLowerCase().includes(q) ||
        idStr.toLowerCase().includes(q) ||
        (e.email ?? "").toLowerCase().includes(q);
      const matchStack = stackFilter === "All" || e.techStack === stackFilter;
      return matchSearch && matchStack;
    });
  }, [attendees, search, stackFilter]);

  if (!sprint) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          background: T.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <p style={{ color: T.sub, fontSize: 15, fontWeight: 600 }}>
          Sprint not found.
        </p>
        <button
          onClick={() => navigate("/sprints")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 18px",
            borderRadius: 10,
            background: T.accentBg,
            border: `1.5px solid ${T.border}`,
            color: T.accent,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={14} /> Back to Sprints
        </button>
      </motion.div>
    );
  }

  const total = attendees.length;
  const present = attendees.filter((e) => e.status === "Present").length;
  const late = attendees.filter((e) => e.status === "Late").length;
  const absent = attendees.filter((e) => e.status === "Absent").length;

  const kpis = [
    {
      label: "Total",
      value: total,
      icon: Users,
      color: T.accent,
      bg: T.accentBg,
      glow: "rgba(13,148,136,0.2)",
    },
    {
      label: "Present",
      value: present,
      icon: UserCheck,
      color: "#059669",
      bg: "rgba(5,150,105,0.08)",
      glow: "rgba(5,150,105,0.2)",
    },
    {
      label: "Late",
      value: late,
      icon: Clock,
      color: T.amber,
      bg: T.amberBg,
      glow: "rgba(217,119,6,0.2)",
    },
    {
      label: "Absent",
      value: absent,
      icon: UserX,
      color: T.red,
      bg: T.redBg,
      glow: "rgba(220,38,38,0.2)",
    },
  ];

  const handleSubmit = async () => {
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const res = await submitAttendance(sprint.id, selectedDate, sendEmails);
      if (!res || res.ok !== true) {
        const msg = (res && res.error) || "Failed to submit attendance";
        setSubmitError(msg);
        return;
      }
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    const header = "ID,Name,Email,Tech Stack,Status,Date";
    const rows = filtered.map(
      (e) =>
        `${e.empId ?? e.id},${e.name},${e.email ?? ""},${e.techStack},${e.status},${selectedDate}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${sprint.title.replace(/\s+/g, "_")}_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cfg = statusConfig[sprint.status] || statusConfig.Scheduled;
  const timeDisplay =
    sprint.sprintStart && sprint.sprintEnd
      ? `${sprint.sprintStart} \u2013 ${sprint.sprintEnd}`
      : sprint.timeSlot;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px" }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Back */}
        <button
          onClick={() => navigate("/sprints")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: T.accent,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.highlight)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.accent)}
        >
          <ArrowLeft size={14} /> Back to Sprints
        </button>

        {/* Sprint info */}
        <div
          style={{
            background: T.card,
            border: `1.5px solid ${T.border}`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: T.shadow,
          }}
        >
          <div style={{ height: 3, background: T.line }} />
          <div
            style={{
              padding: "18px 22px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <h2
                  style={{
                    color: T.text,
                    fontSize: 18,
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  {sprint.title}
                </h2>
                <span
                  style={{
                    background: cfg.bg,
                    color: cfg.color,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 20,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {sprint.status}
                </span>
                {isLocked && (
                  <span
                    style={{
                      background: T.bg,
                      color: T.muted,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 20,
                      border: `1.5px solid ${T.border}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Lock size={10} /> Submitted
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px 20px",
                  color: T.sub,
                  fontSize: 12,
                }}
              >
                <span>
                  📅 {sprint.startDate} → {sprint.endDate}
                </span>
                <span>⏰ {timeDisplay}</span>
                <span>
                  📍{" "}
                  {sprint.room && sprint.room.includes(" - ")
                    ? sprint.room.split(" - ")[1]
                    : sprint.room}
                </span>
                <span>
                  👥{" "}
                  {sprint.cohorts && sprint.cohorts.length
                    ? sprint.cohorts
                        .map((p) => p.cohort)
                        .filter(Boolean)
                        .join(" / ")
                    : sprint.cohort}
                </span>
                {sprint.trainer && <span>🧑🏫 {sprint.trainer}</span>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label
                style={{
                  color: T.muted,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Attendance Date
              </label>
              <input
                type="date"
                value={selectedDate}
                min={sprint.startDate}
                max={today}
                onChange={(e) => {
                  // Fix #8 — clamp keyboard-typed dates within sprint range
                  const clamped = clampDate(
                    e.target.value,
                    sprint.startDate,
                    today,
                  );
                  setSelectedDate(clamped);
                  setSubmitSuccess(false);
                }}
                style={{ ...inp, cursor: "pointer" }}
                onFocus={(e) => {
                  e.target.style.borderColor = T.accent;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = T.border;
                }}
              />
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 12,
          }}
        >
          {kpis.map(({ label, value, icon: Icon, color, bg, glow }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, boxShadow: `0 12px 32px ${glow}` }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.3 }}
              style={{
                background: T.card,
                border: `1.5px solid ${T.border}`,
                borderRadius: 14,
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: T.shadow,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={17} style={{ color }} />
              </div>
              <div>
                <p style={{ color: T.muted, fontSize: 11, margin: 0 }}>
                  {label}
                </p>
                <p
                  style={{
                    color,
                    fontSize: 26,
                    fontWeight: 800,
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  {value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: T.muted,
                }}
              />
              <input
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inp, paddingLeft: 32, width: 220 }}
                disabled={isLocked}
                onFocus={(e) => (e.target.style.borderColor = T.accent)}
                onBlur={(e) => (e.target.style.borderColor = T.border)}
              />
            </div>
            <select
              value={stackFilter}
              onChange={(e) => setStack(e.target.value)}
              style={{ ...inp, height: 38, cursor: "pointer" }}
            >
              {techStacks.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Tech Stacks" : s}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!isLocked && (
              <button
                onClick={() =>
                  markAllPresent(
                    sprint.id,
                    selectedDate,
                    filtered.map((e) => e.id),
                  )
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: T.accentBg,
                  border: `1.5px solid ${T.border}`,
                  color: T.accent,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <CheckSquare size={14} /> Mark All Present
              </button>
            )}
            <button
              onClick={handleDownload}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                background: T.card,
                border: `1.5px solid ${T.border}`,
                color: T.sub,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Download size={14} /> Export CSV
            </button>
            {!isLocked ? (
              <>
                {/* Email notification toggle */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div
                    onClick={() => setSendEmails((v) => !v)}
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 10,
                      position: "relative",
                      cursor: "pointer",
                      background: sendEmails ? T.accent : T.border,
                      transition: "background 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: sendEmails ? 18 : 2,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                  <span style={{ color: T.sub, fontSize: 12, fontWeight: 600 }}>
                    Notify absent employees
                  </span>
                </label>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 18px",
                    borderRadius: 10,
                    background: isSubmitting ? "#0b6b4a" : T.accent,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    boxShadow: T.accentGlow,
                  }}
                >
                  <Send size={14} />{" "}
                  {isSubmitting ? "Submitting..." : "Submit Attendance"}
                </button>
              </>
            ) : (
              <button
                disabled
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 18px",
                  borderRadius: 10,
                  background: T.bg,
                  color: T.muted,
                  fontWeight: 600,
                  fontSize: 13,
                  border: `1.5px solid ${T.border}`,
                  cursor: "not-allowed",
                  opacity: 0.7,
                }}
              >
                <Lock size={14} /> Submitted
              </button>
            )}
          </div>
        </div>

        {/* Success banner */}
        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 18px",
                borderRadius: 12,
                background: T.accentBg,
                border: `1.5px solid ${T.accentBd}`,
                color: T.accent,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <UserCheck size={15} />
              Attendance for <strong>{selectedDate}</strong> submitted. Records
              are now locked.
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 18px",
                borderRadius: 12,
                background: "rgba(220,38,38,0.06)",
                border: `1.5px solid rgba(220,38,38,0.12)`,
                color: T.red,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <UserX size={15} />
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div
          style={{
            background: T.card,
            border: `1.5px solid ${T.border}`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: T.shadow,
          }}
        >
          <div style={{ height: 3, background: T.line }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 20px",
              borderBottom: `1.5px solid ${T.border}`,
              background: T.bg,
            }}
          >
            <p
              style={{
                color: T.text,
                fontSize: 14,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Attendance — {selectedDate}
            </p>
            {isLocked && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: T.muted,
                  fontSize: 11,
                }}
              >
                <Lock size={11} /> Read-only
              </span>
            )}
          </div>
          {loadingSession ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: T.muted,
                fontSize: 13,
              }}
            >
              Loading attendance records…
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: T.muted,
                fontSize: 13,
              }}
            >
              No students found.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: T.bg,
                    borderBottom: `1.5px solid ${T.border}`,
                  }}
                >
                  {["#", "ID", "Name", "Email", "Tech Stack", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 16px",
                          color: T.muted,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((emp, idx) => {
                    const ss = STACK_STYLES[emp.techStack] || {
                      color: T.muted,
                      bg: T.accentBg,
                    };
                    const st = STATUS_STYLES[emp.status];
                    return (
                      <motion.tr
                        key={emp.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        style={{
                          borderBottom: `1px solid ${T.border}`,
                          background: isLocked ? T.bg : undefined,
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isLocked)
                            e.currentTarget.style.background = T.bg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isLocked
                            ? T.bg
                            : "";
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            color: T.muted,
                            fontSize: 12,
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontFamily: "monospace",
                            fontSize: 11,
                            color: T.muted,
                          }}
                        >
                          {emp.empId ?? emp.id}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: T.text,
                            fontWeight: 600,
                          }}
                        >
                          {emp.name}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: T.sub,
                            fontSize: 12,
                          }}
                        >
                          {emp.email ?? "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              background: ss.bg,
                              color: ss.color,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 9px",
                              borderRadius: 20,
                              border: `1px solid ${T.border}`,
                            }}
                          >
                            {emp.techStack}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {isLocked ? (
                            <span
                              style={{
                                background: st.bg,
                                color: st.color,
                                border: `1px solid ${st.border}`,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: 20,
                              }}
                            >
                              {emp.status}
                            </span>
                          ) : (
                            <div style={{ display: "flex", gap: 6 }}>
                              {STATUSES.map((s) => {
                                const active = emp.status === s;
                                const sc = STATUS_STYLES[s];
                                return (
                                  <button
                                    key={s}
                                    onClick={() =>
                                      updateStatus(
                                        sprint.id,
                                        selectedDate,
                                        emp.id,
                                        s,
                                      )
                                    }
                                    style={{
                                      padding: "3px 10px",
                                      borderRadius: 20,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      border: `1px solid ${active ? sc.border : T.border}`,
                                      background: active
                                        ? sc.bg
                                        : "transparent",
                                      color: active ? sc.color : T.muted,
                                      transition: "all 0.12s",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!active) {
                                        e.currentTarget.style.borderColor =
                                          sc.border;
                                        e.currentTarget.style.color = sc.color;
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!active) {
                                        e.currentTarget.style.borderColor =
                                          T.border;
                                        e.currentTarget.style.color = T.muted;
                                      }
                                    }}
                                  >
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        <p style={{ color: T.muted, fontSize: 11 }}>
          Showing {filtered.length} of {attendees.length} students ·{" "}
          {selectedDate} · {timeDisplay}
        </p>
      </div>
    </motion.div>
  );
}
