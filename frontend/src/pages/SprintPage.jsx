import { useNavigate } from "react-router-dom";
import { useSprints } from "@/context/SprintContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { B } from "@/theme/manager";
import CohortTag from "@/components/CohortTag";
import Pagination from "@/components/ui/Pagination";
import sprintService from "@/services/sprintService";
import { unwrapList } from "@/utils/apiResponse";

const statusConfig = {
  Scheduled: { color: B.accent, bg: B.accentBg },
  "On Hold": { color: B.amber, bg: B.amberBg },
  Completed: { color: B.green, bg: "rgba(16,185,129,0.08)" },
};

const SprintPage = () => {
  const { sprints: ctxSprints } = useSprints();
  const [sprints, setSprints] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewSprint, setViewSprint] = useState(null);
  const [viewEmployees, setViewEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Fetch paginated sprints from backend; fall back to context if API doesn't provide pagination
    sprintService
      .getAll({ page, pageSize })
      .then((res) => {
        const payload = res?.data ?? res;
        if (!mounted) return;
        if (Array.isArray(payload)) {
          setSprints(payload);
          setTotalCount(payload.length);
          setTotalPages(
            Math.max(1, Math.ceil((payload.length || 0) / pageSize)),
          );
        } else if (payload && Array.isArray(payload.items)) {
          setSprints(payload.items);
          setTotalCount(Number(payload.total) || payload.items.length);
          setTotalPages(
            Math.max(
              1,
              Math.ceil(
                (Number(payload.total) || payload.items.length) / pageSize,
              ),
            ),
          );
        } else {
          // fallback to context sprints
          setSprints(ctxSprints);
          setTotalCount(ctxSprints.length);
          setTotalPages(Math.max(1, Math.ceil(ctxSprints.length / pageSize)));
        }
      })
      .catch(() => {
        setSprints(ctxSprints);
        setTotalCount(ctxSprints.length);
        setTotalPages(Math.max(1, Math.ceil(ctxSprints.length / pageSize)));
      });
    return () => (mounted = false);
  }, [page, pageSize, ctxSprints]);

  const openViewEmployees = async (sprint) => {
    setViewSprint(sprint);
    setLoadingEmployees(true);
    try {
      const res = await sprintService.getEmployees(sprint.id);
      const list = unwrapList(res);
      setViewEmployees(list);
      setSprints((prev) =>
        prev.map((p) =>
          p.id === sprint.id ? { ...p, employeeCount: list.length } : p
        ),
      );
    } catch {
      setViewEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };
  const navigate = useNavigate();

  // friendly room name: show substring after ' - '
  const formatRoom = (r) =>
    r?.includes(" - ") ? r.split(" - ")[1] : (r ?? "—");
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ background: B.bg, minHeight: "100vh", padding: "28px 24px" }}
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 4,
                height: 28,
                background: B.accent,
                borderRadius: 2,
              }}
            />
            <div>
              <h1
                style={{
                  color: B.text,
                  fontSize: 22,
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                All Sprints
              </h1>
              <p style={{ color: B.muted, fontSize: 12, margin: 0 }}>
                {sprints.length} sprints total
              </p>
            </div>
          </div>
          <div
            style={{
              background: B.card,
              border: `1px solid ${B.border}`,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: B.shadow,
            }}
          >
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
                    background: B.bg2,
                    borderBottom: `1px solid ${B.border}`,
                  }}
                >
                  {[
                    "Sprint",
                    "Trainer",
                    "Dates",
                    "Room",
                    "Students",
                    "Actions",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "11px 16px",
                        color: B.muted,
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
                {sprints.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: B.muted,
                        fontSize: 13,
                      }}
                    >
                      No sprints found.
                    </td>
                  </tr>
                ) : (
                  sprints.map((s) => {
                    const cfg =
                      statusConfig[s.status] || statusConfig.Scheduled;
                    const count = s.employeeCount ?? 0;
                    return (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: `1px solid ${B.border}`,
                          cursor: "pointer",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = B.bg2)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "")
                        }
                      >
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ color: B.text, fontWeight: 600 }}>
                            {s.title}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 3,
                              marginTop: 3,
                            }}
                          >
                            {(s.cohorts?.length
                              ? s.cohorts.map((c) => c.cohort).filter(Boolean)
                              : [s.cohort].filter(Boolean)
                            ).map((c) => (
                              <CohortTag key={c} cohort={c} />
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "13px 16px", color: B.sub }}>
                          {s.trainer || "—"}
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            color: B.sub,
                            fontSize: 12,
                          }}
                        >
                          {s.startDate} → {s.endDate}
                        </td>
                        <td style={{ padding: "13px 16px", color: B.sub }}>
                          {formatRoom(s.room)}
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            color: B.text,
                            fontWeight: 600,
                          }}
                        >
                          {count}
                        </td>
                        <td
                          style={{ padding: "13px 16px", whiteSpace: "nowrap" }}
                        >
                          <button
                            onClick={() => openViewEmployees(s)}
                            title="View sprint employees"
                            type="button"
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: B.accent,
                            }}
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <span
                            style={{
                              background: cfg.bg,
                              color: cfg.color,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 20,
                            }}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          </div>
        </div>
      </motion.div>
      {viewSprint && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              width: 720,
              maxHeight: "80vh",
              overflowY: "auto",
              background: B.card,
              border: `1px solid ${B.border}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0, color: B.text }}>
                {viewSprint.title} — Employees
              </h3>
              <button
                onClick={() => {
                  setViewSprint(null);
                  setViewEmployees([]);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: B.muted,
                }}
              >
                Close
              </button>
            </div>
            <div>
              {loadingEmployees ? (
                <p style={{ color: B.muted }}>Loading…</p>
              ) : viewEmployees.length === 0 ? (
                <p style={{ color: B.muted }}>
                  No employees enrolled for this sprint.
                </p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: 8,
                          color: B.muted,
                        }}
                      >
                        ID
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: 8,
                          color: B.muted,
                        }}
                      >
                        Name
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: 8,
                          color: B.muted,
                        }}
                      >
                        Email
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: 8,
                          color: B.muted,
                        }}
                      >
                        Cohort
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewEmployees.map((e) => (
                      <tr key={e.id}>
                        <td style={{ padding: 8, color: B.text }}>
                          {e.empId ?? e.id}
                        </td>
                        <td style={{ padding: 8, color: B.text }}>
                          {e.name ?? e.employeeName}
                        </td>
                        <td style={{ padding: 8, color: B.text }}>
                          {e.email ?? "—"}
                        </td>
                        <td style={{ padding: 8, color: B.text }}>
                          {e.cohort ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SprintPage;
