import { motion } from "framer-motion";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, ArrowRight, BarChart3 } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { B } from "@/theme/manager";
import PageBanner from "@/components/PageBanner";
import StatCard from "@/components/ui/StatCard";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area,
} from "recharts";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SPRINT_COLORS = [B.accent, B.blue, B.green, B.purple, B.amber];

const todayLabel = new Date().toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});

/* ── Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: B.card, border: `1px solid ${B.border}`, borderRadius: 10,
      padding: "10px 14px", boxShadow: B.shadowMd,
    }}>
      <p style={{ color: B.sub, fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: 11, margin: "2px 0" }}>
          {p.name}: <span style={{ fontWeight: 700 }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ── KPI Card ── */
const KpiCard = ({ label, value, sub, change, status }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.18 }}
    style={{
      background: B.card, border: `1px solid ${B.border}`, borderRadius: 16,
      padding: "22px 22px 18px", boxShadow: B.shadow, cursor: "default",
      transition: "border-color 0.2s, background 0.2s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = status === "up" ? "#34d399" : "#fb7185";
      e.currentTarget.style.background  = status === "up" ? "#ecfdf5" : "#fff1f2";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = B.border;
      e.currentTarget.style.background  = B.card;
    }}
  >
    <p style={{ color: B.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
      {label}
    </p>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
      <p style={{ color: B.text, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{value}</p>
      {change && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
          color:      status === "up" ? "#059669" : "#e11d48",
          background: status === "up" ? "#ecfdf5" : "#fff1f2",
        }}>
          {change}
        </span>
      )}
    </div>
    {sub && <p style={{ color: B.sub, fontSize: 12, marginTop: 6 }}>{sub}</p>}
  </motion.div>
);

/* ── Clipped Area Chart ── */
const AttendanceAreaChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={B.green}  stopOpacity={0.25} />
          <stop offset="95%" stopColor={B.green}  stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={B.amber}  stopOpacity={0.25} />
          <stop offset="95%" stopColor={B.amber}  stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={B.red}    stopOpacity={0.2} />
          <stop offset="95%" stopColor={B.red}    stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={B.bg2} vertical={false} />
      <XAxis dataKey="month" tick={{ fill: B.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: B.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
      <Tooltip content={<CustomTooltip />} />
      <Area type="monotone" dataKey="Present" stroke={B.green}  strokeWidth={2} fill="url(#gradPresent)" dot={false} />
      <Area type="monotone" dataKey="Late"    stroke={B.amber}  strokeWidth={2} fill="url(#gradLate)"    dot={false} />
      <Area type="monotone" dataKey="Absent"  stroke={B.red}    strokeWidth={2} fill="url(#gradAbsent)"  dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

/* ── Sprint Analytics ── */
const SprintCard = ({ s, idx }) => (
  <div style={{
    background: B.card, border: `1px solid ${B.border}`, borderRadius: 14,
    padding: "18px 18px 16px", boxShadow: B.shadow, position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 3,
      background: `linear-gradient(90deg,${SPRINT_COLORS[idx % SPRINT_COLORS.length]},transparent)`,
    }} />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <span style={{ color: B.text, fontSize: 14, fontWeight: 700 }}>{s.title}</span>
      <span style={{ background: B.accentBg, color: B.accent, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
        {s.status}
      </span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
      {[["Enrolled", s.enrolled, B.text], ["Sessions", s.sessions, B.text], ["Present", s.present, B.green]].map(([k, v, c]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: B.sub }}>{k}</span>
          <span style={{ color: c, fontWeight: 700 }}>{v}</span>
        </div>
      ))}
    </div>
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
        <span style={{ color: B.muted }}>Attendance rate</span>
        <span style={{ color: s.rate >= 75 ? B.green : s.rate >= 50 ? B.amber : B.red, fontWeight: 700 }}>
          {s.rate}%
        </span>
      </div>
      <div style={{ height: 5, background: B.bg2, borderRadius: 4, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${s.rate}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          style={{
            height: "100%",
            background: SPRINT_COLORS[idx % SPRINT_COLORS.length],
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════
   Main Dashboard
══════════════════════════════════════════ */
const Dashboard = () => {
  const { sprints, employees, hrbps, trainers, globalCohortStats, sprintCohortStats } = useAppData();
  const { user } = useAuth();

  // Compute totals from globalCohortStats (real DB data)
  const totalRecords = useMemo(
    () => globalCohortStats.reduce((s, c) => s + (Number(c.totalDays) || 0), 0),
    [globalCohortStats],
  );
  const presentCount = useMemo(
    () => globalCohortStats.reduce((s, c) => s + (Number(c.presentDays) || 0), 0),
    [globalCohortStats],
  );
  const overallRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  const monthlyData = useMemo(() => {
    // Build from sprintCohortStats grouped by sprint start month
    const buckets = MONTH_NAMES.map((m) => ({ month: m, Present: 0, Absent: 0, Late: 0 }));
    const year = new Date().getFullYear();
    sprints.forEach((s) => {
      if (!s.startDate) return;
      const d = new Date(s.startDate);
      if (d.getFullYear() !== year) return;
      const idx = d.getMonth();
      const stats = sprintCohortStats[s.id] ?? [];
      stats.forEach((c) => {
        buckets[idx].Present += Number(c.presentDays) || 0;
        buckets[idx].Late    += Number(c.lateDays)    || 0;
        buckets[idx].Absent  += Number(c.absentDays)  || 0;
      });
    });
    return buckets;
  }, [sprints, sprintCohortStats]);

  const sprintAnalytics = useMemo(
    () => sprints.map((s) => {
      const enrolled     = s.employeeCount ?? 0;
      const cohortStats  = sprintCohortStats[s.id] ?? [];
      const totalPresent = cohortStats.reduce((sum, c) => sum + (Number(c.presentDays) || 0), 0);
      const totalLate    = cohortStats.reduce((sum, c) => sum + (Number(c.lateDays)    || 0), 0);
      const totalRec     = cohortStats.reduce((sum, c) => sum + (Number(c.totalDays)   || 0), 0);
      const sessions     = cohortStats.length > 0 ? (cohortStats[0].sessions ?? 0) : 0;
      const rate = totalRec > 0 ? Math.round(((totalPresent + totalLate) / totalRec) * 100) : 0;
      return { ...s, enrolled, sessions, present: totalPresent, rate };
    }),
    [sprints, sprintCohortStats],
  );

  // Derived KPI values — only count Active users
  const kpis = [
    { label: "Total Employees",  value: employees.length,                                    sub: "Registered",            change: null,    status: "up"   },
    { label: "Total HRBPs",      value: hrbps.filter((h) => h.status === "Active").length,   sub: "HR Business Partners",  change: null,    status: "up"   },
    { label: "Total Trainers",   value: trainers.filter((t) => t.status === "Active").length, sub: "Sprint trainers",        change: null,    status: "up"   },
    {
      label: "Attendance Rate", value: `${overallRate}%`, sub: "Overall present rate",
      change: overallRate >= 75 ? "On Track" : "Needs Attention",
      status: overallRate >= 75 ? "up" : "down",
    },
  ];

  // Goal card: top sprint by rate
  const topSprint = sprintAnalytics.length
    ? sprintAnalytics.reduce((a, b) => (b.rate > a.rate ? b : a))
    : null;

  // User growth: present this month vs last month (from monthly chart data)
  const now = new Date();
  const thisMonth = monthlyData[now.getMonth()]?.Present ?? 0;
  const lastMonth = monthlyData[Math.max(0, now.getMonth() - 1)]?.Present ?? 0;
  const growthPct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4 }}
      style={{ background: B.bg, minHeight: "100vh", color: B.text }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── Header ── */}
        <div>
          <p style={{ color: B.muted, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{todayLabel}</p>
          <PageBanner
            title={`Welcome back, ${user?.name?.split(" ")[0] || ""} 👋`}
            gradient="linear-gradient(135deg, #ea580c 0%, #f97316 100%)"
            shadow="4px 0 24px rgba(249,115,22,0.30)"
            width="360px"
            right={
              <Link to="/manager/sprints" style={{
                display: "inline-flex", whiteSpace: "nowrap", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 10, background: B.accent, color: "#fff",
                fontWeight: 700, fontSize: 13, textDecoration: "none",
                boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
              }}>
                View Sprints <ArrowRight size={14} />
              </Link>
            }
          />
          <p style={{ color: B.sub, fontSize: 13, marginTop: -8 }}>Here's your team's performance at a glance.</p>
        </div>

        {/* ── KPI Cards — using reusable StatCard ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          {kpis.map((k, i) => (
            <StatCard
              key={k.label}
              title={k.label}
              value={k.value}
              sub={k.sub}
              index={i}
              cardBg={B.card}
              cardBorder={B.border}
              textColor={B.text}
              mutedColor={B.muted}
              variant="hover-fill"
              hoverGradient={k.status === "up" ? "#ecfdf5" : "#fff1f2"}
              iconColor={k.status === "up" ? "#059669" : "#e11d48"}
              iconBg={k.status === "up" ? "#ecfdf5" : "#fff1f2"}
            />
          ))}
        </div>

        {/* ── Sprint Analytics ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 4, height: 20, background: B.accent, borderRadius: 2 }} />
              <h2 style={{ color: B.text, fontSize: 15, fontWeight: 700, margin: 0 }}>Sprint Analytics</h2>
            </div>
            <Link to="/manager/sprints" style={{ display: "flex", alignItems: "center", gap: 4, color: B.accent, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
            {sprintAnalytics.map((s, idx) => <SprintCard key={s.id} s={s} idx={idx} />)}
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

          {/* Area Chart */}
          <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 16, overflow: "hidden", boxShadow: B.shadow }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${B.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: B.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart3 style={{ width: 18, height: 18, color: B.accent }} />
              </div>
              <div>
                <p style={{ color: B.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Monthly Attendance Performance</p>
                <p style={{ color: B.muted, fontSize: 11, margin: 0 }}>{new Date().getFullYear()} — Present, Late & Absent</p>
              </div>
            </div>
            <div style={{ padding: "20px 16px 12px" }}>
              {totalRecords === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 8 }}>
                  <BarChart3 style={{ width: 40, height: 40, color: B.muted }} />
                  <p style={{ color: B.muted, fontSize: 13 }}>No attendance data yet.</p>
                </div>
              ) : (
                <AttendanceAreaChart data={monthlyData} />
              )}
            </div>
          </div>

          {/* Sidebar: Goal + Growth */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Dark Goal Card */}
            <div style={{
              background: "#18181b", borderRadius: 16, padding: "24px", boxShadow: B.shadowMd,
              display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1,
            }}>
              <div>
                <p style={{ color: "#71717a", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6 }}>
                  Top Sprint
                </p>
                <h4 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>
                  {topSprint ? topSprint.title : "No Data"}
                </h4>
              </div>
              <div style={{ marginTop: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                  <span style={{ color: "#fff", fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
                    {topSprint ? `${topSprint.rate}%` : "—"}
                  </span>
                  <span style={{ color: "#71717a", fontSize: 12, marginBottom: 2 }}>Target: 90%</span>
                </div>
                <div style={{ width: "100%", height: 6, background: "#3f3f46", borderRadius: 99, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topSprint?.rate ?? 0}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
                    style={{ height: "100%", background: "#fff", borderRadius: 99 }}
                  />
                </div>
              </div>
            </div>

            {/* User Growth Card */}
            <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 16, padding: "22px", boxShadow: B.shadow }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: B.bg2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users style={{ width: 18, height: 18, color: B.text }} />
                </div>
                <h4 style={{ color: B.text, fontWeight: 700, fontSize: 14, margin: 0 }}>Attendance Growth</h4>
              </div>
              <p style={{ color: B.sub, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Present count this month is{" "}
                <span style={{ color: B.text, fontWeight: 700 }}>{thisMonth}</span>
                {lastMonth > 0 && (
                  <>
                    {" "}—{" "}
                    <span style={{ color: growthPct >= 0 ? B.green : B.red, fontWeight: 700 }}>
                      {growthPct >= 0 ? "+" : ""}{growthPct}%
                    </span>{" "}
                    vs last month.
                  </>
                )}
              </p>
            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Dashboard;
