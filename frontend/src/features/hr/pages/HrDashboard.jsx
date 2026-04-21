import { motion } from "framer-motion";
import {
  Calendar,
  PauseCircle,
  CheckCircle,
  ArrowRight,
  PlusCircle,
  List,
  TrendingUp,
  Clock,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSprints } from "@/context/SprintContext";
import { H } from "@/theme/hr";
import PageBanner from "@/components/PageBanner";
import StatCard from "@/components/ui/StatCard";
import StatCardSkeleton from "@/components/ui/StatCardSkeleton";
import { formatDateRange } from "@/utils/dateUtils";

// Strip room prefix — "Room C - Brahma" → "Brahma"
const formatRoom = (r) => (r?.includes(" - ") ? r.split(" - ")[1] : (r ?? "—"));

const StatusPill = ({ status }) => {
  const map = {
    Scheduled: { color: H.accent, bg: H.accentBg, bd: H.accentBd },
    "On Hold": { color: H.amber, bg: H.amberBg, bd: H.amberBd },
    Completed: { color: H.green, bg: H.greenBg, bd: H.greenBd },
  };
  const s = map[status] || map.Scheduled;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.bd}`,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 20,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.color,
        }}
      />
      {status}
    </span>
  );
};

const HrDashboard = () => {
  const { user } = useAuth();
  const { sprints, loading } = useSprints();

  const total = sprints.length;
  const scheduled = sprints.filter((s) => s.status === "Scheduled").length;
  const onHold = sprints.filter((s) => s.status === "On Hold").length;
  const completed = sprints.filter((s) => s.status === "Completed").length;

  const stats = [
    {
      label: "Total Sprints",
      value: total,
      icon: Calendar,
      accent: H.accent,
      accentBg: H.accentBg,
      accentBd: H.accentBd,
    },
    {
      label: "Scheduled",
      value: scheduled,
      icon: TrendingUp,
      accent: H.green,
      accentBg: H.greenBg,
      accentBd: H.greenBd,
    },
    {
      label: "On Hold",
      value: onHold,
      icon: PauseCircle,
      accent: H.amber,
      accentBg: H.amberBg,
      accentBd: H.amberBd,
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle,
      accent: H.purple,
      accentBg: H.purpleBg,
      accentBd: "rgba(139,92,246,0.2)",
    },
  ];

  const recentSprints = [...sprints]
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ background: H.bg, minHeight: "100vh", padding: "32px 28px" }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Banner */}
        <PageBanner
          title={`Welcome back, ${user?.name?.split(" ")[0] || ""}`}
          gradient={H.gradient}
          shadow="4px 0 24px rgba(29,111,164,0.30)"
          width="360px"
          right={
            <div style={{ display: "flex", gap: 10 }}>
              <Link
                to="/hr/create-sprint"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 18px",
                  borderRadius: 10,
                  background: H.gradient,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                  boxShadow: H.accentGlow,
                  border: "none",
                }}
              >
                <PlusCircle size={15} /> Create Sprint
              </Link>
              <Link
                to="/hr/sprints"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 18px",
                  borderRadius: 10,
                  background: H.card,
                  color: H.text,
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "none",
                  border: `1.5px solid ${H.border}`,
                  boxShadow: H.shadow,
                }}
              >
                <List size={15} /> View All
              </Link>
            </div>
          }
        />

        {/* Sub heading */}
        <p style={{ color: H.sub, fontSize: 13, marginTop: -8 }}>
          Manage and track all sprint activities from here.
        </p>

        {/* Stat Cards — show skeleton while loading, fix #6 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 16,
          }}
        >
          {loading ? (
            <StatCardSkeleton
              count={4}
              cardBg={H.card}
              borderColor={H.border}
            />
          ) : (
            stats.map((s, i) => (
              <StatCard
                key={s.label}
                title={s.label}
                value={s.value}
                icon={s.icon}
                iconColor={s.accent}
                iconBg={s.accentBg}
                gradient={`linear-gradient(135deg,${s.accent},${s.accentBg})`}
                glow={`${s.accent}33`}
                index={i}
                cardBg={H.card}
                cardBorder={H.border}
                textColor={H.text}
                mutedColor={H.muted}
                variant="hover-fill"
                hoverGradient={H.gradient}
              />
            ))
          )}
        </div>

        {/* Recent Sprints */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            background: H.card,
            border: `1.5px solid ${H.border}`,
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: H.shadow,
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: "18px 24px",
              borderBottom: `1.5px solid ${H.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 4,
                  height: 20,
                  background: H.accent,
                  borderRadius: 2,
                }}
              />
              <p
                style={{
                  color: H.text,
                  fontSize: 15,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Recent Sprints
              </p>
              <span
                style={{
                  background: H.accentBg,
                  color: H.accent,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 9px",
                  borderRadius: 20,
                  border: `1px solid ${H.accentBd}`,
                }}
              >
                {sprints.length}
              </span>
            </div>
            <Link
              to="/hr/sprints"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: H.accent,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {recentSprints.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "60px 0",
                gap: 10,
              }}
            >
              <Calendar size={40} style={{ color: H.muted }} />
              <p style={{ color: H.muted, fontSize: 13 }}>
                No sprints yet. Create your first sprint.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
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
                      background: H.bg,
                      borderBottom: `1.5px solid ${H.border}`,
                    }}
                  >
                    {[
                      "Sprint",
                      "Trainer",
                      "Dates",
                      "Time",
                      "Room",
                      "Cohort",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "11px 20px",
                          color: H.muted,
                          fontSize: 11,
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
                  {recentSprints.map((s, i) => {
                    const cohortLabel =
                      s.cohorts && s.cohorts.length
                        ? s.cohorts
                            .map((p) => p.cohort)
                            .filter(Boolean)
                            .join(" / ")
                        : s.cohort || "—";
                    return (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.05 }}
                        style={{
                          borderBottom: `1px solid ${H.border}`,
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = H.bg)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "")
                        }
                      >
                        <td style={{ padding: "14px 20px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                background: H.accentBg,
                                border: `1.5px solid ${H.accentBd}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 800,
                                color: H.accent,
                              }}
                            >
                              {(s.title ?? "").slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ color: H.text, fontWeight: 600 }}>
                              {s.title}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", color: H.sub }}>
                          {s.trainer || "—"}
                        </td>
                        <td
                          style={{
                            padding: "14px 20px",
                            color: H.sub,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDateRange(s.startDate, s.endDate)}
                        </td>
                        <td
                          style={{
                            padding: "14px 20px",
                            color: H.sub,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Clock size={12} style={{ color: H.muted }} />
                            {s.sprintStart && s.sprintEnd
                              ? `${s.sprintStart} – ${s.sprintEnd}`
                              : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", color: H.sub }}>
                          {formatRoom(s.room)}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            style={{
                              background: H.bg,
                              color: H.sub,
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "3px 9px",
                              borderRadius: 8,
                              border: `1px solid ${H.border}`,
                            }}
                          >
                            {cohortLabel}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <StatusPill status={s.status} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: H.card,
            border: `1.5px solid ${H.border}`,
            borderRadius: 18,
            padding: "22px 24px",
            boxShadow: H.shadow,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 4,
                height: 18,
                background: H.accent,
                borderRadius: 2,
              }}
            />
            <p
              style={{
                color: H.text,
                fontSize: 14,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Quick Actions
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {[
              {
                label: "Create Sprint",
                to: "/hr/create-sprint",
                icon: PlusCircle,
                bg: H.gradient,
                color: "#fff",
                shadow: H.accentGlow,
              },
              {
                label: "View Sprints",
                to: "/hr/sprints",
                icon: List,
                bg: H.card,
                color: H.text,
                shadow: H.shadow,
                border: `1.5px solid ${H.border}`,
              },
              {
                label: "Cohorts",
                to: "/hr/cohorts",
                icon: Layers,
                bg: H.card,
                color: H.text,
                shadow: H.shadow,
                border: `1.5px solid ${H.border}`,
              },
            ].map(({ label, to, icon: Icon, bg, color, shadow, border }) => (
              <Link
                key={label}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 12,
                  background: bg,
                  color,
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "none",
                  boxShadow: shadow,
                  border: border || "none",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Icon size={15} /> {label}{" "}
                <ArrowRight size={13} style={{ opacity: 0.6 }} />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HrDashboard;
