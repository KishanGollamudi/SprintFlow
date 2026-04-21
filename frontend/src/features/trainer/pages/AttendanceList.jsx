import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Search, ChevronDown, ChevronRight } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { useSprints } from "@/context/SprintContext";
import attendanceService from "@/services/attendanceService";
import { unwrapList } from "@/utils/apiResponse";
import { T } from "@/theme/trainer";
import CohortTag from "@/components/CohortTag";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const STATUS_STYLES = {
  Present: { color: "#059669", bg: "rgba(5,150,105,0.08)" },
  Late: { color: T.amber, bg: T.amberBg },
  Absent: { color: T.red, bg: T.redBg },
};

const STACK_STYLES = {
  Java: { color: "#0d9488", bg: "rgba(13,148,136,0.08)" },
  Python: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
  Devops: { color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
  DotNet: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  SalesForce: { color: "#ec4899", bg: "rgba(236,72,153,0.08)" },
};

const COHORT_COLORS = [
  "#0d9488",
  "#f59e0b",
  "#8b5cf6",
  "#3b82f6",
  "#ec4899",
  "#059669",
];
const cohortColorMap = {};
let colorIdx = 0;
const cohortColor = (cohort) => {
  if (!cohortColorMap[cohort]) {
    cohortColorMap[cohort] = COHORT_COLORS[colorIdx % COHORT_COLORS.length];
    colorIdx++;
  }
  return cohortColorMap[cohort];
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

// ── Collapsible sprint card ───────────────────────────────────
function SprintAccordion({ sprintTitle, sprintMeta, cohortMap, hasDateFilter }) {
  const [open, setOpen] = useState(false);
  const allRecs = Object.values(cohortMap).flat();
  const present = allRecs.filter((r) => r.status === "Present").length;
  const late = allRecs.filter((r) => r.status === "Late").length;
  const absent = allRecs.filter((r) => r.status === "Absent").length;
  const pct = allRecs.length ? Math.round((present / allRecs.length) * 100) : 0;
  const cohortKeys = Object.keys(cohortMap).sort();

  return (
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

      {/* ── Clickable header (the "dropdown trigger") ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: T.bg,
          border: "none",
          cursor: "pointer",
          borderBottom: open ? `1.5px solid ${T.border}` : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {open ? (
            <ChevronDown size={15} style={{ color: T.accent, flexShrink: 0 }} />
          ) : (
            <ChevronRight size={15} style={{ color: T.muted, flexShrink: 0 }} />
          )}
          <span style={{ color: T.accent, fontSize: 14, fontWeight: 700 }}>
            {sprintTitle}
          </span>
          {sprintMeta?.status && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
                background:
                  sprintMeta.status === "Completed"
                    ? "rgba(5,150,105,0.1)"
                    : T.accentBg,
                color: sprintMeta.status === "Completed" ? "#059669" : T.accent,
              }}
            >
              {sprintMeta.status}
            </span>
          )}
          {/* Cohort summary pills */}
          {cohortKeys.map((cohort) => {
            const cRecs = cohortMap[cohort];
            const cPres = cRecs.filter((r) => r.status === "Present").length;
            const cPct = cRecs.length
              ? Math.round((cPres / cRecs.length) * 100)
              : 0;
            return (
              <span
                key={cohort}
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <CohortTag cohort={cohort} />
                <span style={{ fontSize: 10, color: "#6b7280" }}>{cPct}%</span>
              </span>
            );
          })}
        </div>

        {/* Right summary */}
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
          <p
            style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}
          >
            <span style={{ color: "#059669" }}>{present}</span>
            <span style={{ color: T.muted, fontWeight: 400 }}> · </span>
            <span style={{ color: T.amber }}>{late}</span>
            <span style={{ color: T.muted, fontWeight: 400 }}> · </span>
            <span style={{ color: T.red }}>{absent}</span>
          </p>
          <p style={{ margin: 0, fontSize: 10, color: T.muted }}>
            {allRecs.length} records · {pct}% present
          </p>
        </div>
      </button>

      {/* ── Expanded content ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {cohortKeys.map((cohort, ci) => {
              const color = cohortColor(cohort);
              const cRecs = cohortMap[cohort];
              return (
                <div key={cohort}>
                  {/* Cohort sub-header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 20px",
                      background: `${color}0d`,
                      borderTop: ci > 0 ? `1px solid ${T.border}` : undefined,
                      borderBottom: `1px solid ${T.border}`,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: color,
                      }}
                    />
                    <span style={{ color, fontSize: 12, fontWeight: 700 }}>
                      {cohort}
                    </span>
                    <span style={{ color: T.muted, fontSize: 11 }}>
                      — {cRecs.length} records
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ color: "#059669" }}>
                        {cRecs.filter((r) => r.status === "Present").length}{" "}
                        present
                      </span>
                      {" · "}
                      <span style={{ color: T.amber }}>
                        {cRecs.filter((r) => r.status === "Late").length} late
                      </span>
                      {" · "}
                      <span style={{ color: T.red }}>
                        {cRecs.filter((r) => r.status === "Absent").length}{" "}
                        absent
                      </span>
                    </span>
                  </div>

                  {/* Records table */}
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
                          borderBottom: `1px solid ${T.border}`,
                        }}
                      >
                        {[
                          "Emp ID",
                          "Name",
                          "Technology",
                          hasDateFilter ? "Date" : "Last Date",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "8px 16px",
                              color: T.muted,
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cRecs.map((emp) => {
                        const ss = STACK_STYLES[emp.techStack] || {
                          color: T.muted,
                          bg: T.accentBg,
                        };
                        const st =
                          STATUS_STYLES[emp.status] || STATUS_STYLES.Absent;
                        return (
                          <tr
                            key={`${emp.id}-${emp.date}`}
                            style={{
                              borderBottom: `1px solid ${T.border}`,
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = T.bg)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "")
                            }
                          >
                            <td
                              style={{
                                padding: "9px 16px",
                                fontFamily: "monospace",
                                fontSize: 11,
                                color: T.muted,
                              }}
                            >
                              {emp.empId ?? emp.id}
                            </td>
                            <td
                              style={{
                                padding: "9px 16px",
                                color: T.text,
                                fontWeight: 600,
                              }}
                            >
                              {emp.name}
                            </td>
                            <td style={{ padding: "9px 16px" }}>
                              <span
                                style={{
                                  background: ss.bg,
                                  color: ss.color,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 9px",
                                  borderRadius: 20,
                                }}
                              >
                                {emp.techStack}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "9px 16px",
                                color: T.muted,
                                fontSize: 12,
                              }}
                            >
                              {emp.date}
                            </td>
                            <td style={{ padding: "9px 16px" }}>
                              <span
                                style={{
                                  background: st.bg,
                                  color: st.color,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 9px",
                                  borderRadius: 20,
                                }}
                              >
                                {emp.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AttendanceList() {
  const { employees, attendance } = useAppData();
  const { sprints } = useSprints();

  const [search, setSearch] = useState("");
  const [stackFilter, setStackFilter] = useState("All");
  const [cohortFilter, setCohortFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [apiRecords, setApiRecords] = useState([]);
  const [loadingApi, setLoadingApi] = useState(false);

  // Load from API
  useEffect(() => {
    if (USE_MOCK || !sprints?.length) return;
    let cancelled = false;
    setLoadingApi(true);
    Promise.all(
      sprints.map((s) =>
        attendanceService.getAllBySprint(s.id).catch(() => ({ data: [] })),
      ),
    )
      .then((responses) => {
        if (cancelled) return;
        const out = [];
        responses.forEach((res, i) => {
          const sprint = sprints[i];
          const list = Array.isArray(res?.data) ? res.data : unwrapList(res);
          if (!Array.isArray(list)) return;
          list.forEach((r) => {
            const d = r.attendanceDate;
            const dateStr =
              d == null
                ? ""
                : typeof d === "string"
                  ? d.slice(0, 10)
                  : String(d).slice(0, 10);
            out.push({
              // id: DB id if provided, fallback to empId from payload
              id: r.employeeId ?? r.empId,
              // empId: human-friendly employee identifier (string) when available
              empId:
                r.empId ??
                (r.employeeId != null ? String(r.employeeId) : undefined),
              name: r.employeeName,
              techStack: r.technology,
              cohort: r.cohort,
              sprint: r.sprintTitle || sprint?.title,
              sprintId: sprint?.id,
              date: dateStr,
              status: r.status,
            });
          });
        });
        setApiRecords(out);
      })
      .finally(() => {
        if (!cancelled) setLoadingApi(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sprints]);

  const cohorts = useMemo(() => {
    const unique = [...new Set(employees.map((e) => e.cohort).filter(Boolean))];
    return ["All", ...unique.sort()];
  }, [employees]);

  const TECH_STACKS = useMemo(() => {
    const unique = [
      ...new Set(employees.map((e) => e.technology).filter(Boolean)),
    ];
    return ["All", ...unique.sort()];
  }, [employees]);

  const allRecords = useMemo(() => {
    if (!USE_MOCK) return apiRecords;
    const records = [];
    Object.entries(attendance).forEach(([date, dayRecords]) => {
      dayRecords.forEach((r) => {
        const sprint = sprints.find((s) => s.title === r.sprint);
        records.push({
          id: r.empId,
          name: r.name,
          techStack: r.technology,
          cohort: r.cohort,
          sprint: r.sprint,
          sprintId: sprint?.id ?? r.sprint,
          date,
          status: r.status,
        });
      });
    });
    return records;
  }, [attendance, sprints, apiRecords]);

  // When no date filter — show only LATEST record per employee per sprint
  // When date filter applied — show all records in that range
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const hasDateFilter = dateFrom || dateTo;

    // Step 1 — apply search/tech/cohort/date filters
    const base = allRecords.filter((e) => {
      const matchSearch =
        (e.name ?? "").toLowerCase().includes(q) ||
        String(e.id ?? "")
          .toLowerCase()
          .includes(q);
      const matchStack = stackFilter === "All" || e.techStack === stackFilter;
      const matchCohort = cohortFilter === "All" || e.cohort === cohortFilter;
      const matchDateFrom = !dateFrom || e.date >= dateFrom;
      const matchDateTo = !dateTo || e.date <= dateTo;
      return (
        matchSearch && matchStack && matchCohort && matchDateFrom && matchDateTo
      );
    });

    // Step 2 — if no date filter, deduplicate: keep latest record per employee per sprint
    if (!hasDateFilter) {
      const latestMap = {};
      base.forEach((r) => {
        const key = `${r.id}_${r.sprint}`;
        if (!latestMap[key] || r.date > latestMap[key].date) {
          latestMap[key] = r;
        }
      });
      return Object.values(latestMap);
    }

    return base;
  }, [allRecords, search, stackFilter, cohortFilter, dateFrom, dateTo]);

  // Group by sprint → cohort
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      if (!map[e.sprint]) map[e.sprint] = {};
      if (!map[e.sprint][e.cohort]) map[e.sprint][e.cohort] = [];
      map[e.sprint][e.cohort].push(e);
    });
    return map;
  }, [filtered]);

  const hasFilters =
    cohortFilter !== "All" ||
    stackFilter !== "All" ||
    search ||
    dateFrom ||
    dateTo;

  const handleDownload = () => {
    const header = "ID,Name,Tech Stack,Sprint,Cohort,Date,Status";
    const rows = filtered.map(
      (e) =>
        `${(e.empId ?? e.id) || ""},${e.name || ""},${e.techStack || ""},${e.sprint || ""},${e.cohort || ""},${e.date || ""},${e.status || ""}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px" }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 4,
                height: 28,
                background: T.accent,
                borderRadius: 2,
              }}
            />
            <div>
              <h1
                style={{
                  color: T.text,
                  fontSize: 22,
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                Attendance Overview
              </h1>
              <p style={{ color: T.muted, fontSize: 12, margin: 0 }}>
                {Object.keys(grouped).length} sprint
                {Object.keys(grouped).length !== 1 ? "s" : ""} ·{" "}
                {filtered.length} employees
                {!(dateFrom || dateTo) && (
                  <span style={{ color: T.accent }}>
                    {" "}
                    · latest record per employee
                  </span>
                )}
                {(dateFrom || dateTo) && (
                  <span style={{ color: T.accent }}>
                    {" "}
                    · all records in date range
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              borderRadius: 12,
              background: T.accent,
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              boxShadow: T.accentGlow,
            }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div
            style={{ position: "relative", flex: "1 1 200px", maxWidth: 260 }}
          >
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
              placeholder="Search name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...inp,
                paddingLeft: 32,
                width: "100%",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = T.accent)}
              onBlur={(e) => (e.target.style.borderColor = T.border)}
            />
          </div>

          {/* Cohort filter */}
          <select
            value={cohortFilter}
            onChange={(e) => setCohortFilter(e.target.value)}
            style={{ ...inp, height: 38, cursor: "pointer" }}
          >
            {cohorts.map((o) => (
              <option key={o} value={o}>
                {o === "All" ? "All Cohorts" : o}
              </option>
            ))}
          </select>

          {/* Tech stack filter */}
          <select
            value={stackFilter}
            onChange={(e) => setStackFilter(e.target.value)}
            style={{ ...inp, height: 38, cursor: "pointer" }}
          >
            {TECH_STACKS.map((o) => (
              <option key={o} value={o}>
                {o === "All" ? "All Tech Stacks" : o}
              </option>
            ))}
          </select>

          {/* Date range */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: T.muted, fontSize: 12 }}>From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ ...inp, height: 38, cursor: "pointer" }}
              onFocus={(e) => (e.target.style.borderColor = T.accent)}
              onBlur={(e) => (e.target.style.borderColor = T.border)}
            />
            <span style={{ color: T.muted, fontSize: 12 }}>To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ ...inp, height: 38, cursor: "pointer" }}
              onFocus={(e) => (e.target.style.borderColor = T.accent)}
              onBlur={(e) => (e.target.style.borderColor = T.border)}
            />
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => {
                setCohortFilter("All");
                setStackFilter("All");
                setSearch("");
                setDateFrom("");
                setDateTo("");
              }}
              style={{
                background: "none",
                border: "none",
                color: T.accent,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear ×
            </button>
          )}
        </div>

        {/* Content */}
        {!USE_MOCK && loadingApi ? (
          <div
            style={{ textAlign: "center", padding: "60px 0", color: T.muted }}
          >
            <p style={{ fontSize: 14, fontWeight: 600 }}>Loading attendance…</p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "60px 0", color: T.muted }}
          >
            <p style={{ fontSize: 14, fontWeight: 600 }}>No records found</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              Try adjusting your filters, or mark attendance on a sprint date.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(grouped).map(([sprintTitle, cohortMap]) => {
              const sprintMeta = sprints.find((s) => s.title === sprintTitle);
              return (
                <SprintAccordion
                  key={sprintTitle}
                  sprintTitle={sprintTitle}
                  sprintMeta={sprintMeta}
                  cohortMap={cohortMap}
                  hasDateFilter={!!(dateFrom || dateTo)}
                />
              );
            })}
          </div>
        )}

        <p style={{ color: T.muted, fontSize: 11 }}>
          Showing {filtered.length} of {allRecords.length} total records
          {dateFrom && (
            <span>
              {" "}
              · from <span style={{ color: T.accent }}>{dateFrom}</span>
            </span>
          )}
          {dateTo && (
            <span>
              {" "}
              · to <span style={{ color: T.accent }}>{dateTo}</span>
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}
