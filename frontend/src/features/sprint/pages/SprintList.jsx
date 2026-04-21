import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Search,
  SlidersHorizontal,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  ChevronRight,
  Eye,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useSprints } from "@/context/SprintContext";
import { useAppData } from "@/context/AppDataContext";
import { useNavigate } from "react-router-dom";
import { T } from "@/theme/trainer";
import Pagination from "@/components/ui/Pagination";
import CohortTag from "@/components/CohortTag";

const PAGE_SIZE = 8;

const statusConfig = {
  Scheduled: { color: T.accent, bg: T.accentBg },
  "On Hold": { color: T.amber, bg: T.amberBg },
  Completed: { color: "#059669", bg: "rgba(5,150,105,0.08)" },
};
const statuses = ["Scheduled", "On Hold", "Completed"];

// Strip room prefix — "Room C - Brahma" → "Brahma"
const formatRoom = (r) => (r?.includes(" - ") ? r.split(" - ")[1] : (r ?? "—"));

const ActionMenu = ({ sprint, onStatusChange, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const actions = [
    {
      label: "Hold",
      icon: PauseCircle,
      color: T.amber,
      show: sprint.status !== "On Hold",
      onClick: () => {
        onStatusChange(sprint.id, "On Hold");
        setOpen(false);
      },
    },
    {
      label: "Resume",
      icon: PlayCircle,
      color: "#059669",
      show: sprint.status === "On Hold",
      onClick: () => {
        onStatusChange(sprint.id, "Scheduled");
        setOpen(false);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      color: T.red,
      show: true,
      onClick: () => {
        onDelete(sprint.id);
        setOpen(false);
      },
    },
  ].filter((a) => a.show);
  if (actions.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      ref={ref}
      style={{ position: "relative" }}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "transparent",
          border: `1.5px solid ${T.border}`,
          color: T.muted,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <MoreVertical size={13} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -4 }}
            transition={{ duration: 0.13 }}
            style={{
              position: "absolute",
              right: 0,
              top: 34,
              zIndex: 50,
              background: T.card,
              border: `1.5px solid ${T.border}`,
              borderRadius: 12,
              overflow: "hidden",
              minWidth: 130,
              boxShadow: T.shadowMd,
            }}
          >
            {actions.map(({ label, icon: Icon, color, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 14px",
                  background: "transparent",
                  border: "none",
                  color,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const StatusBadge = ({ sprint, onStatusChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cfg = statusConfig[sprint.status] || statusConfig.Scheduled;
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleOpen = (e) => {
    e.stopPropagation();
    setOpen((p) => !p);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={handleOpen}
        style={{
          background: cfg.bg,
          color: cfg.color,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: "3px 10px",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: cfg.color,
          }}
        />
        {sprint.status}
        <span style={{ opacity: 0.5, fontSize: 9 }}>▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -4 }}
            transition={{ duration: 0.13 }}
            style={{
              position: "absolute",
              right: 0,
              top: 34,
              zIndex: 9999,
              background: T.card,
              border: `1.5px solid ${T.border}`,
              borderRadius: 12,
              overflow: "hidden",
              minWidth: 140,
              boxShadow: T.shadowMd,
            }}
          >
            {statuses.map((s) => {
              const c = statusConfig[s];
              return (
                <button
                  key={s}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(sprint.id, s);
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 14px",
                    background: "transparent",
                    border: "none",
                    color: c.color,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = T.bg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: c.color,
                    }}
                  />
                  {s}
                  {sprint.status === s && (
                    <span style={{ marginLeft: "auto" }}>✓</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SprintList = () => {
  const { sprints, updateStatus, deleteSprint } = useSprints();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const filtered = sprints.filter((s) => {
    const matchSearch =
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.trainer?.toLowerCase().includes(search.toLowerCase()) ||
      s.room?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getAttendeeCount = (sprint) => sprint.employeeCount ?? 0;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };
  const handleFilter = (val) => {
    setFilterStatus(val);
    setPage(1);
  };

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
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
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
              All Sprints
            </h1>
            <p style={{ color: T.muted, fontSize: 12, margin: 0 }}>
              Manage and track sprint schedules
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{ position: "relative", flex: "1 1 220px", maxWidth: 300 }}
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
              placeholder="Search title, trainer, room..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                background: "#ffffff",
                border: `1.5px solid ${T.border}`,
                borderRadius: 10,
                color: T.text,
                padding: "8px 12px 8px 32px",
                fontSize: 13,
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.target.style.borderColor = T.accent)}
              onBlur={(e) => (e.target.style.borderColor = T.border)}
            />
          </div>
          <div style={{ position: "relative" }}>
            <SlidersHorizontal
              size={13}
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                color: T.muted,
                pointerEvents: "none",
              }}
            />
            <Select value={filterStatus} onValueChange={handleFilter}>
              <SelectTrigger
                style={{
                  background: "#ffffff",
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 10,
                  color: T.text,
                  paddingLeft: 32,
                  height: 38,
                  width: 180,
                  fontSize: 13,
                }}
              >
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent
                // Ensure dropdown is readable (avoid “glass” blending).
                className="bg-white text-zinc-900 border border-zinc-200 shadow-xl backdrop-blur-none"
                style={{ backgroundColor: "#ffffff", backdropFilter: "none" }}
              >
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: T.card,
            border: `1.5px solid ${T.border}`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: T.shadow,
            minWidth: 0,
          }}
        >
          <div style={{ height: 3, background: T.line }} />
          <div style={{ overflowX: "auto" }}>
            <Table>
              <TableHeader>
                <TableRow
                  style={{
                    background: T.bg,
                    borderBottom: `1.5px solid ${T.border}`,
                  }}
                >
                  {[
                    "Sprint",
                    "Trainer",
                    "Dates",
                    "Time",
                    "Room",
                    // "Studentssaike",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      style={{
                        color: T.muted,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "11px 16px",
                      }}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          padding: "40px 0",
                          color: T.muted,
                          fontSize: 13,
                        }}
                      >
                        No sprints found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((s, index) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.04 }}
                        style={{
                          borderBottom: `1px solid ${T.border}`,
                          cursor: "pointer",
                          transition: "background 0.12s",
                        }}
                        onClick={() => navigate(`/sprints/${s.id}/attendance`)}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = T.bg)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "")
                        }
                      >
                        <TableCell style={{ padding: "13px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                color: T.accent,
                                fontWeight: 600,
                                fontSize: 13,
                              }}
                            >
                              {s.title}
                            </span>
                            <ChevronRight
                              size={12}
                              style={{ color: T.accent, opacity: 0.6 }}
                            />
                          </div>
                          {/* Show all cohorts as CohortTag pills */}
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
                            ).map((cohort) => (
                              <CohortTag key={cohort} cohort={cohort} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell
                          style={{
                            padding: "13px 16px",
                            color: T.sub,
                            fontSize: 13,
                          }}
                        >
                          {s.trainer || "—"}
                        </TableCell>
                        <TableCell
                          style={{
                            padding: "13px 16px",
                            color: T.sub,
                            fontSize: 12,
                          }}
                        >
                          {s.startDate}{" "}
                          <span style={{ color: T.muted }}>→</span> {s.endDate}
                        </TableCell>
                        <TableCell
                          style={{
                            padding: "13px 16px",
                            color: T.sub,
                            fontSize: 12,
                          }}
                        >
                          {s.sprintStart && s.sprintEnd
                            ? `${s.sprintStart} – ${s.sprintEnd}`
                            : "—"}
                        </TableCell>
                        <TableCell
                          style={{
                            padding: "13px 16px",
                            color: T.sub,
                            fontSize: 13,
                          }}
                        >
                          {formatRoom(s.room)}
                        </TableCell>
                        {/* <TableCell style={{ padding: "13px 16px" }}>
                          <span
                            style={{
                              color: T.text,
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            {getAttendeeCount(s)}
                          </span>
                          <span
                            style={{
                              color: T.muted,
                              fontSize: 11,
                              marginLeft: 4,
                            }}
                          >
                            students
                          </span>
                        </TableCell> */}
                        <TableCell
                          style={{ padding: "13px 16px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <StatusBadge
                            sprint={s}
                            onStatusChange={updateStatus}
                          />
                        </TableCell>
                        <TableCell
                          style={{ padding: "13px 16px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/sprints/${s.id}/attendance`);
                              }}
                              title="View attendance"
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                background: T.accentBg,
                                border: `1.5px solid ${T.accentBd ?? T.border}`,
                                color: T.accent,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  T.accent + "33")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = T.accentBg)
                              }
                            >
                              <Eye size={13} />
                            </button>
                            <ActionMenu
                              sprint={s}
                              onStatusChange={updateStatus}
                              onDelete={setDeleteId}
                            />
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
          {filtered.length > 0 && (
            <div style={{ padding: "16px 0 20px" }}>
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                theme={T}
              />
            </div>
          )}
        </motion.div>

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.5)",
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: T.card,
                border: `1.5px solid ${T.border}`,
                borderRadius: 18,
                padding: "28px 32px",
                maxWidth: 400,
                width: "90%",
                boxShadow: T.shadowMd,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: T.redBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={18} style={{ color: T.red }} />
                </div>
                <div>
                  <p style={{ color: T.text, fontWeight: 700, margin: 0 }}>
                    Delete Sprint
                  </p>
                  <p style={{ color: T.muted, fontSize: 11, margin: 0 }}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <p style={{ color: T.sub, fontSize: 13, marginBottom: 20 }}>
                Are you sure you want to delete{" "}
                <strong style={{ color: T.text }}>
                  {sprints.find((s) => s.id === deleteId)?.title}
                </strong>
                ?
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    deleteSprint(deleteId);
                    setDeleteId(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 10,
                    background: T.red,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 10,
                    background: "transparent",
                    color: T.sub,
                    fontWeight: 600,
                    fontSize: 13,
                    border: `1.5px solid ${T.border}`,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SprintList;
