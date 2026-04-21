import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  Clock,
  SlidersHorizontal,
  Eye,
  Pencil,
  X,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useSprints } from "@/context/SprintContext";
import sprintService from "@/services/sprintService";
import { H, hInp, hLbl } from "@/theme/hr";
import PageBanner from "@/components/PageBanner";
import Pagination from "@/components/ui/Pagination";
import { useAppData } from "@/context/AppDataContext";

const PAGE_SIZE = 10;

// ── Time Picker Component (from CreateSprint) ────────────────────
const hours = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const minutes = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const ITEM_H = 40;
const VISIBLE = 5;
const REPEATS = 3;

const DrumColumn = ({ items, selected, onSelect }) => {
  const ref = useRef(null);
  const count = items.length;
  const offset = count * Math.floor(REPEATS / 2);

  const scrollToIndex = useCallback((idx, smooth = true) => {
    if (!ref.current) return;
    ref.current.scrollTo({
      top: idx * ITEM_H,
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx !== -1) scrollToIndex(offset + idx, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const rawIdx = Math.round(el.scrollTop / ITEM_H);
        const itemIdx = ((rawIdx % count) + count) % count;
        const target = offset + itemIdx;
        if (rawIdx < count || rawIdx >= count * (REPEATS - 1))
          el.scrollTop = target * ITEM_H;
        scrollToIndex(target);
        onSelect(items[itemIdx]);
      }, 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [items, onSelect, scrollToIndex, count, offset]);

  const pad = ITEM_H * Math.floor(VISIBLE / 2);
  const repeated = Array.from({ length: REPEATS }, () => items).flat();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ position: "relative", flex: 1, height: ITEM_H * VISIBLE }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: pad,
          background: "linear-gradient(to bottom,#fff,transparent)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: pad,
          background: "linear-gradient(to top,#fff,transparent)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: pad,
          height: ITEM_H,
          background: H.accentBg,
          borderTop: `1px solid ${H.accentBd}`,
          borderBottom: `1px solid ${H.accentBd}`,
          borderRadius: 8,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        ref={ref}
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "scroll",
          scrollbarWidth: "none",
        }}
      >
        <div style={{ height: pad }} />
        {repeated.map((item, i) => {
          const isSel = item === selected;
          return (
            <div
              key={i}
              style={{
                height: ITEM_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: isSel ? 20 : 15,
                  fontWeight: isSel ? 800 : 400,
                  color: isSel ? H.accent : H.muted,
                  transition: "all 0.2s",
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
        <div style={{ height: pad }} />
      </div>
    </motion.div>
  );
};

const TimePicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const parsed = value ? value.split(/:| /) : ["09", "00", "AM"];
  const [hour, setHour] = useState(parsed[0] || "09");
  const [min, setMin] = useState(parsed[1] || "00");
  const [ampm, setAmpm] = useState(parsed[2] || "AM");

  useEffect(() => {
    if (onChange) {
      onChange(`${hour}:${min} ${ampm}`);
    }
  }, [hour, min, ampm, onChange]);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      const parts = value.split(/:| /);
      if (parts.length >= 3) {
        setHour(parts[0] || "09");
        setMin(parts[1] || "00");
        setAmpm(parts[2] || "AM");
      }
    }
  }, [value]);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          ...hInp,
          height: 40,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          width: "100%",
        }}
      >
        <Clock size={15} style={{ color: H.accent, flexShrink: 0 }} />
        <span style={{ color: H.text, fontWeight: 700 }}>
          {hour}:{min}
        </span>
        <span
          style={{
            background: H.accentBg,
            color: H.accent,
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 6,
            border: `1px solid ${H.accentBd}`,
          }}
        >
          {ampm}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              left: 0,
              top: 46,
              zIndex: 50,
              background: H.card,
              border: `1.5px solid ${H.border}`,
              borderRadius: 16,
              overflow: "hidden",
              width: 210,
              boxShadow: H.shadowMd,
            }}
          >
            <div style={{ height: 3, background: H.accent }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 12px 8px",
                gap: 4,
              }}
            >
              <DrumColumn items={hours} selected={hour} onSelect={setHour} />
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: H.muted,
                  paddingBottom: 4,
                }}
              >
                :
              </span>
              <DrumColumn items={minutes} selected={min} onSelect={setMin} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  paddingLeft: 8,
                  height: ITEM_H * VISIBLE,
                  justifyContent: "center",
                }}
              >
                {["AM", "PM"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmpm(p)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background: ampm === p ? H.accent : H.bg2,
                      color: ampm === p ? "#fff" : H.muted,
                      transition: "all 0.15s",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: "0 12px 12px" }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  borderRadius: 8,
                  background: H.accent,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const STATUS_MAP = {
  Scheduled: { color: H.accent, bg: H.accentBg, bd: H.accentBd },
  "On Hold": { color: H.amber, bg: H.amberBg, bd: H.amberBd },
  Completed: { color: H.green, bg: H.greenBg, bd: H.greenBd },
};

const STATUSES = ["Scheduled", "On Hold", "Completed"];

const nativeSel = {
  background: "#ffffff",
  border: `1.5px solid ${H.border}`,
  borderRadius: 10,
  color: H.text,
  padding: "9px 13px",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  height: 40,
  cursor: "pointer",
};

// Strip room prefix — "Room C - Brahma" → "Brahma"
const formatRoom = (r) => (r?.includes(" - ") ? r.split(" - ")[1] : (r ?? "—"));

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.Scheduled;
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

// View Modal
const ViewModal = ({ sprint, onClose }) => {
  if (!sprint) return null;
  // compute cohort label: if multiple cohort pairs are present, join their cohort names
  const cohortLabel =
    sprint.cohorts && sprint.cohorts.length
      ? sprint.cohorts
          .map((p) => p.cohort)
          .filter(Boolean)
          .join(" / ")
      : sprint.cohort || "—";

  const rows = [
    { label: "Title", value: sprint.title },
    { label: "Trainer", value: sprint.trainer || "—" },
    { label: "Start Date", value: sprint.startDate },
    { label: "End Date", value: sprint.endDate },
    {
      label: "Time",
      value:
        sprint.sprintStart && sprint.sprintEnd
          ? `${sprint.sprintStart} – ${sprint.sprintEnd}`
          : "—",
    },
    { label: "Room", value: formatRoom(sprint.room) },
    { label: "Cohort", value: cohortLabel },
    { label: "Status", value: sprint.status },
  ];
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        style={{
          background: H.card,
          border: `1.5px solid ${H.border}`,
          borderRadius: 20,
          width: "100%",
          maxWidth: 460,
          boxShadow: H.shadowMd,
          overflow: "hidden",
        }}
      >
        <div style={{ height: 4, background: H.gradient }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: `1px solid ${H.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: H.accentBg,
                border: `1.5px solid ${H.accentBd}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: H.accent,
              }}
            >
              {(sprint.title ?? "").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p
                style={{
                  color: H.text,
                  fontWeight: 700,
                  fontSize: 15,
                  margin: 0,
                }}
              >
                {sprint.title}
              </p>
              <StatusPill status={sprint.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: H.muted,
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {rows
            .filter((r) => r.label !== "Title" && r.label !== "Status")
            .map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <span style={{ color: H.muted, fontWeight: 600 }}>{label}</span>
                <span style={{ color: H.text, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          {sprint.instructions && (
            <div style={{ marginTop: 4 }}>
              <p
                style={{
                  color: H.muted,
                  fontWeight: 600,
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                Instructions
              </p>
              <p
                style={{
                  color: H.sub,
                  fontSize: 13,
                  background: H.bg,
                  borderRadius: 8,
                  padding: "8px 12px",
                  border: `1px solid ${H.border}`,
                  margin: 0,
                }}
              >
                {sprint.instructions}
              </p>
            </div>
          )}
        </div>
        <div style={{ padding: "0 24px 20px" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 10,
              background: H.gradient,
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Edit Modal
const EditModal = ({ sprint, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: sprint.title || "",
    trainer: sprint.trainer || "",
    startDate: sprint.startDate || "",
    endDate: sprint.endDate || "",
    sprintStart: sprint.sprintStart || "09:00 AM",
    sprintEnd: sprint.sprintEnd || "05:00 PM",
    room: sprint.room || "",
    cohort: sprint.cohort || "",
    status: sprint.status || "Scheduled",
    instructions: sprint.instructions || "",
  });

  // Trainer time-slot conflict state
  const [conflicts, setConflicts] = useState([]);
  const [conflictChecking, setChecking] = useState(false);
  const [conflictAcknowledged, setAckd] = useState(false);

  const inp = { ...hInp, width: "100%", boxSizing: "border-box" };
  const {
    cohortNames,
    trainers,
    rooms,
    employees,
    updateSprint: updateAppSprint,
  } = useAppData();

  // Load already-enrolled employees from backend on open
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loadingEnrolled, setLoadingEnrolled] = useState(true);
  const selectAllEnrolled = () => {
    if (!eligibleEmployees || eligibleEmployees.length === 0) return;
    const allIds = new Set(
      eligibleEmployees.map((e) => String(e.id ?? e.employeeId ?? e.empId)),
    );
    // Toggle: if everything already selected, clear; otherwise select all
    const everythingSelected = eligibleEmployees.every(
      (e) => allIds.has(String(e.id)) && enrolledIds.has(String(e.id)),
    );
    if (everythingSelected) {
      setEnrolledIds(new Set());
    } else {
      setEnrolledIds(allIds);
    }
  };

  useEffect(() => {
    sprintService
      .getEmployees(sprint.id)
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        // normalize: backend may return employee objects with different id keys
        setEnrolledIds(
          new Set(list.map((e) => String(e.employeeId ?? e.id ?? e.empId))),
        );
      })
      .catch(() => {})
      .finally(() => setLoadingEnrolled(false));
  }, [sprint.id]);

  const sprintCohorts = sprint.cohorts?.length
    ? sprint.cohorts
    : [{ technology: sprint.technology || "", cohort: sprint.cohort || "" }];

  const eligibleEmployees = employees.filter((e) =>
    sprintCohorts.some(
      (p) =>
        p.technology?.toLowerCase() === e.technology?.toLowerCase() &&
        p.cohort?.toLowerCase() === e.cohort?.toLowerCase(),
    ),
  );

  const toggleEnroll = (id) => {
    setEnrolledIds((prev) => {
      const next = new Set(prev);
      next.has(String(id)) ? next.delete(String(id)) : next.add(String(id));
      return next;
    });
  };

  // ── Trainer conflict check ───────────────────────────────
  // Fires whenever trainer, dates, or times change — all five fields must be filled.
  useEffect(() => {
    const trainerObj = trainers.find((t) => t.name === form.trainer);
    if (!trainerObj?.id || !form.startDate || !form.endDate || !form.sprintStart || !form.sprintEnd) {
      setConflicts([]);
      return;
    }
    setChecking(true);
    setAckd(false);
    sprintService
      .checkTrainerConflict({
        trainerId: trainerObj.id,
        startDate: form.startDate,
        endDate: form.endDate,
        sprintStart: form.sprintStart,
        sprintEnd: form.sprintEnd,
        excludeSprintId: sprint.id, // Exclude current sprint from conflict check
      })
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setConflicts(list);
      })
      .catch(() => setConflicts([]))
      .finally(() => setChecking(false));
  }, [form.trainer, form.startDate, form.endDate, form.sprintStart, form.sprintEnd, sprint.id, trainers]);

  const handleSave = () => {
    // If there are conflicts the HR must acknowledge before saving
    if (conflicts.length > 0 && !conflictAcknowledged) return;
    onSave(form, enrolledIds, eligibleEmployees);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        style={{
          background: H.card,
          border: `1.5px solid ${H.border}`,
          borderRadius: 20,
          width: "100%",
          maxWidth: 520,
          boxShadow: H.shadowMd,
          overflow: "hidden",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ height: 4, background: H.gradient }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: `1px solid ${H.border}`,
          }}
        >
          <p
            style={{ color: H.text, fontWeight: 700, fontSize: 15, margin: 0 }}
          >
            Edit Sprint
          </p>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: H.muted,
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            {[
              { name: "title", label: "Sprint Title", type: "text" },
              { name: "startDate", label: "Start Date", type: "date" },
              { name: "endDate", label: "End Date", type: "date" },
            ].map(({ name, label, type }) => (
              <div key={name}>
                <label style={hLbl}>{label}</label>
                <input
                  type={type}
                  value={form[name]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [name]: e.target.value }))
                  }
                  style={inp}
                  onFocus={(e) => (e.target.style.borderColor = H.accent)}
                  onBlur={(e) => (e.target.style.borderColor = H.border)}
                />
              </div>
            ))}
            
            {/* Time Pickers */}
            <div>
              <label style={hLbl}>Start Time</label>
              <TimePicker
                value={form.sprintStart}
                onChange={(value) => setForm((p) => ({ ...p, sprintStart: value }))}
              />
            </div>
            <div>
              <label style={hLbl}>End Time</label>
              <TimePicker
                value={form.sprintEnd}
                onChange={(value) => setForm((p) => ({ ...p, sprintEnd: value }))}
              />
            </div>
            {/* Trainer dropdown */}
            <div>
              <label style={hLbl}>Trainer</label>
              <select
                value={form.trainer}
                onChange={(e) =>
                  setForm((p) => ({ ...p, trainer: e.target.value }))
                }
                style={nativeSel}
              >
                <option value="">Select trainer</option>
                {trainers.map((t) => (
                  <option key={t.id ?? t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Room dropdown */}
            <div>
              <label style={hLbl}>Room</label>
              <select
                value={form.room}
                onChange={(e) =>
                  setForm((p) => ({ ...p, room: e.target.value }))
                }
                style={nativeSel}
              >
                <option value="">Select room</option>
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r.includes(" - ") ? r.split(" - ")[1] : r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={hLbl}>Cohort</label>
              <select
                value={form.cohort}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cohort: e.target.value }))
                }
                style={nativeSel}
              >
                <option value="">Select cohort</option>
                {(cohortNames ?? []).map((c) => (
                  <option key={c} value={c} title={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={hLbl}>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
              style={nativeSel}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={hLbl}>Instructions (optional)</label>
            <textarea
              value={form.instructions}
              onChange={(e) =>
                setForm((p) => ({ ...p, instructions: e.target.value }))
              }
              rows={3}
              style={{
                ...inp,
                resize: "vertical",
                minHeight: 80,
                padding: "10px 13px",
              }}
              onFocus={(e) => (e.target.style.borderColor = H.accent)}
              onBlur={(e) => (e.target.style.borderColor = H.border)}
            />
          </div>

          {/* Trainer conflict warning */}
          {conflicts.length > 0 && (
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              background: "rgba(245,158,11,0.07)",
              border: `1.5px solid ${H.amberBd}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={15} style={{ color: H.amber, flexShrink: 0 }} />
                <span style={{ color: H.amber, fontWeight: 700, fontSize: 13 }}>
                  Trainer time-slot conflict detected
                </span>
              </div>
              <p style={{ color: H.sub, fontSize: 12, margin: "0 0 8px" }}>
                This trainer is already assigned to the following sprint(s) during the selected period:
              </p>
              {conflicts.map((c) => (
                <div key={c.id} style={{
                  background: H.card, borderRadius: 8, padding: "8px 12px",
                  marginBottom: 6, border: `1px solid ${H.border}`, fontSize: 12,
                }}>
                  <span style={{ color: H.text, fontWeight: 700 }}>{c.title}</span>
                  <span style={{ color: H.muted, marginLeft: 8 }}>
                    {c.startDate} → {c.endDate} &nbsp;•&nbsp; {c.sprintStart} – {c.sprintEnd}
                  </span>
                </div>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={conflictAcknowledged}
                  onChange={(e) => setAckd(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: H.amber, cursor: "pointer" }}
                />
                <span style={{ color: H.sub, fontSize: 12, fontWeight: 600 }}>
                  I understand the conflict and want to proceed anyway
                </span>
              </label>
            </div>
          )}

          {/* Enrolled Employees */}
          {eligibleEmployees.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <label style={{ ...hLbl, marginBottom: 8 }}>
                  Employees ({loadingEnrolled ? "…" : enrolledIds.size} enrolled
                  / {eligibleEmployees.length} eligible)
                </label>
                <button
                  type="button"
                  onClick={selectAllEnrolled}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: H.accent,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Select all
                </button>
              </div>
              <div
                style={{
                  maxHeight: 180,
                  overflowY: "auto",
                  border: `1px solid ${H.border}`,
                  borderRadius: 10,
                }}
              >
                {eligibleEmployees.map((emp) => {
                  const checked = enrolledIds.has(String(emp.id));
                  return (
                    <label
                      key={emp.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        cursor: "pointer",
                        borderBottom: `1px solid ${H.border}`,
                        background: checked ? H.accentBg : "transparent",
                        transition: "background 0.12s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEnroll(emp.id)}
                        style={{ accentColor: H.accent, width: 14, height: 14 }}
                      />
                      <span
                        style={{ fontSize: 13, color: H.text, fontWeight: 600 }}
                      >
                        {emp.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: H.muted,
                          fontFamily: "monospace",
                        }}
                      >
                        {emp.empId}
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          fontWeight: 600,
                          color: H.accent,
                          background: H.accentBg,
                          padding: "1px 7px",
                          borderRadius: 10,
                          border: `1px solid ${H.accentBd}`,
                        }}
                      >
                        {emp.cohort}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 24px 20px" }}>
          <button
            onClick={handleSave}
            disabled={conflicts.length > 0 && !conflictAcknowledged}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              background: conflicts.length > 0 && !conflictAcknowledged ? H.muted : H.gradient,
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: conflicts.length > 0 && !conflictAcknowledged ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: conflicts.length > 0 && !conflictAcknowledged ? 0.6 : 1,
            }}
          >
            <CheckCircle size={14} /> Save Changes
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              background: "transparent",
              color: H.sub,
              fontWeight: 600,
              fontSize: 13,
              border: `1.5px solid ${H.border}`,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const SprintList = () => {
  const { sprints, deleteSprint, updateSprint, refetch } = useSprints();
  const { cohortNames, rooms, trainers, employees, updateSprint: updateAppSprint } = useAppData();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewSprint, setViewSprint] = useState(null);
  const [editSprint, setEditSprint] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);

  const [apiSprints, setApiSprints] = useState(null);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [apiTotalCount, setApiTotalCount] = useState(0);

  // handleSearch resets page to 1 so results always start from the beginning
  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };
  const filtered = sprints.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.title?.toLowerCase().includes(q) ||
      s.trainer?.toLowerCase().includes(q) ||
      s.room?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = async (form, enrolledIds, eligibleEmployees) => {
    if (!form.title?.trim() || !form.startDate || !form.endDate) return;
    await updateSprint(editSprint.id, form);
    // Clear any API-paginated result cache so UI shows updated title immediately
    setApiSprints(null);
    // Sync enrollments: enroll checked, unenroll unchecked
    try {
      const promises = eligibleEmployees.map((emp) => {
        const empDbId = emp.id ?? emp.employeeId ?? emp.empId;
        const idNum = Number(empDbId);
        const idStr = String(empDbId);
        if (enrolledIds.has(idStr)) {
          return sprintService.enrollEmployee(editSprint.id, idNum);
        }
        if (sprintService.removeEmployee) {
          return sprintService.removeEmployee(editSprint.id, idNum);
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
    } catch (err) {
      // log errors so failures don't silently fail
      // eslint-disable-next-line no-console
      console.error("Failed to sync sprint enrollments", err);
    }
    // Update AppData sprint count immediately so manager view reflects change,
    // and refresh SprintContext from server as a final step.
    try {
      if (typeof updateAppSprint === "function") {
        // best-effort local update: send employeeCount; backend may ignore or override
        updateAppSprint(editSprint.id, {
          employeeCount: Number(enrolledIds.size),
        }).catch(() => {});
      }
    } catch {}
    try {
      if (typeof refetch === "function") await refetch();
    } catch {}
    setEditSprint(null);
  };

  const totalPages = apiSprints
    ? apiTotalPages
    : Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = apiSprints
    ? apiSprints
    : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Fetch paginated sprints from backend when search/filter/page changes
  useEffect(() => {
    let mounted = true;
    const params = { page, pageSize: PAGE_SIZE };
    if (search?.trim()) params.q = search.trim();
    if (filterStatus && filterStatus !== "all") params.status = filterStatus;
    sprintService
      .getAll(params)
      .then((res) => {
        const payload = res?.data ?? res;
        if (!mounted) return;
        if (payload && Array.isArray(payload.items)) {
          setApiSprints(payload.items);
          setApiTotalCount(Number(payload.total) || payload.items.length);
          setApiTotalPages(
            Math.max(
              1,
              Math.ceil(
                (Number(payload.total) || payload.items.length) / PAGE_SIZE,
              ),
            ),
          );
        } else if (Array.isArray(payload)) {
          // backend returned plain array — emulate pagination
          setApiSprints(
            payload.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
          );
          setApiTotalCount(payload.length);
          setApiTotalPages(Math.max(1, Math.ceil(payload.length / PAGE_SIZE)));
        } else {
          // no structured pagination — clear apiSprints to fall back to client-side
          setApiSprints(null);
          setApiTotalPages(1);
          setApiTotalCount(0);
        }
      })
      .catch(() => {
        setApiSprints(null);
        setApiTotalPages(1);
        setApiTotalCount(0);
      });
    return () => (mounted = false);
  }, [page, search, filterStatus]);

  const handleFilter = (val) => {
    setFilterStatus(val);
    setPage(1);
  };

  const inpStyle = {
    background: "#ffffff",
    border: `1.5px solid ${H.border}`,
    borderRadius: 10,
    color: H.text,
    padding: "9px 13px",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      style={{ background: H.bg, minHeight: "100vh", padding: "32px 28px" }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <PageBanner
          title="All Sprints"
          gradient={H.gradient}
          shadow="4px 0 24px rgba(29,111,164,0.30)"
          width="230px"
          right={
            <span
              style={{
                background: H.accentBg,
                color: H.accent,
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: 20,
                border: `1px solid ${H.accentBd}`,
              }}
            >
              {sprints.length} total
            </span>
          }
        />
        <p style={{ color: H.sub, fontSize: 13, marginTop: -8 }}>
          Manage and track all sprint schedules.
        </p>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{ position: "relative", flex: "1 1 240px", maxWidth: 320 }}
          >
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: H.muted,
              }}
            />
            <input
              placeholder="Search title, trainer, room..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                ...inpStyle,
                width: "100%",
                paddingLeft: 36,
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = H.accent)}
              onBlur={(e) => (e.target.style.borderColor = H.border)}
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
                color: H.muted,
                pointerEvents: "none",
              }}
            />
            <select
              value={filterStatus}
              onChange={(e) => handleFilter(e.target.value)}
              style={{
                ...inpStyle,
                paddingLeft: 32,
                height: 40,
                cursor: "pointer",
                background: "#ffffff",
                color: H.text,
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: H.card,
            border: `1.5px solid ${H.border}`,
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: H.shadow,
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              borderBottom: `1.5px solid ${H.border}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
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
              Sprint List
            </p>
            <span
              style={{
                background: H.accentBg,
                color: H.accent,
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
                border: `1px solid ${H.accentBd}`,
              }}
            >
              {filtered.length}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 0",
                gap: 10,
              }}
            >
              <Search size={36} style={{ color: H.muted }} />
              <p style={{ color: H.sub, fontSize: 13 }}>
                No sprints found. Try adjusting your search.
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
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "11px 16px",
                          color: H.muted,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginated.map((s, i) => {
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
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.04 }}
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
                          <td
                            style={{
                              padding: "13px 16px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: H.accentBg,
                                  border: `1.5px solid ${H.accentBd}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: H.accent,
                                  flexShrink: 0,
                                }}
                              >
                                {(s.title ?? "").slice(0, 2).toUpperCase()}
                              </div>
                              <span
                                title={cohortLabel}
                                style={{
                                  background: H.bg,
                                  color: H.sub,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "3px 9px",
                                  borderRadius: 8,
                                  border: `1px solid ${H.border}`,
                                  marginRight: 8,
                                }}
                              >
                                {cohortLabel}
                              </span>
                              <span style={{ color: H.text, fontWeight: 600 }}>
                                {s.title}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "13px 16px",
                              color: H.sub,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s.trainer || "—"}
                          </td>
                          <td
                            style={{
                              padding: "13px 16px",
                              color: H.sub,
                              fontSize: 12,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s.startDate}{" "}
                            <span style={{ color: H.muted }}>→</span>{" "}
                            {s.endDate}
                          </td>
                          <td
                            style={{
                              padding: "13px 16px",
                              color: H.sub,
                              fontSize: 12,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Clock size={11} style={{ color: H.muted }} />
                              {s.sprintStart && s.sprintEnd
                                ? `${s.sprintStart} – ${s.sprintEnd}`
                                : "—"}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "13px 16px",
                              color: H.sub,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatRoom(s.room)}
                          </td>
                          <td
                            style={{
                              padding: "13px 16px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span
                              title={cohortLabel}
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
                          <td
                            style={{
                              padding: "13px 16px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <StatusPill status={s.status} />
                          </td>
                          <td
                            style={{
                              padding: "13px 16px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 5,
                                alignItems: "center",
                              }}
                            >
                              <button
                                onClick={() => setViewSprint(s)}
                                title="View sprint"
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  background: H.accentBg,
                                  border: `1px solid ${H.accentBd}`,
                                  color: H.accent,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    H.accentBd)
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    H.accentBg)
                                }
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => setEditSprint(s)}
                                title="Edit sprint"
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  background: "rgba(59,130,246,0.08)",
                                  border: "1px solid rgba(59,130,246,0.2)",
                                  color: "#3b82f6",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(59,130,246,0.18)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(59,130,246,0.08)")
                                }
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteId(s.id)}
                                title="Delete sprint"
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  background: "rgba(244,63,94,0.08)",
                                  border: "1px solid rgba(244,63,94,0.2)",
                                  color: H.red,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(244,63,94,0.18)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(244,63,94,0.08)")
                                }
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > 0 && (
            <div style={{ padding: "16px 0 20px" }}>
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                theme={H}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {viewSprint && (
          <ViewModal sprint={viewSprint} onClose={() => setViewSprint(null)} />
        )}
        {editSprint && (
          <EditModal
            sprint={editSprint}
            onSave={handleSave}
            onClose={() => setEditSprint(null)}
          />
        )}
        {deleteId && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.6)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              style={{
                background: H.card,
                border: `1.5px solid ${H.border}`,
                borderRadius: 16,
                padding: 28,
                width: "100%",
                maxWidth: 380,
                boxShadow: H.shadowMd,
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
                    background: "rgba(244,63,94,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={18} style={{ color: H.red }} />
                </div>
                <div>
                  <p style={{ color: H.text, fontWeight: 700, margin: 0 }}>
                    Delete Sprint
                  </p>
                  <p style={{ color: H.muted, fontSize: 11, margin: 0 }}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <p style={{ color: H.sub, fontSize: 13, marginBottom: 20 }}>
                Are you sure you want to delete{" "}
                <strong style={{ color: H.text }}>
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
                    borderRadius: 8,
                    background: H.red,
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
                    borderRadius: 8,
                    background: "transparent",
                    color: H.sub,
                    fontWeight: 600,
                    fontSize: 13,
                    border: `1.5px solid ${H.border}`,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default SprintList;
