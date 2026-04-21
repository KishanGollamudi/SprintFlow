import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Clock, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { useSprints } from "@/context/SprintContext";
import { H, hInp, hLbl } from "@/theme/hr";
import PageBanner from "@/components/PageBanner";
import { TECH_COHORTS } from "@/constants/cohortLabels";
import { useAppData } from "@/context/AppDataContext";
import sprintService from "@/services/sprintService";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  trainer: z.string().min(1, "Trainer is required"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  sprintStart: z.string().min(1, "Sprint start time required"),
  sprintEnd: z.string().min(1, "Sprint end time required"),
  room: z.string().min(1, "Room is required"),
  instructions: z.string().optional(),
});

const TECHNOLOGIES = ["Java", "Python", "Devops", "DotNet", "SalesForce"];

// rooms list is provided by AppDataContext (fetched from backend)
// trainers list is provided by AppDataContext (fetched from /api/users?role=TRAINER)

// ── Drum Picker ──────────────────────────────────────────────────
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
    onChange(`${hour}:${min} ${ampm}`);
  }, [hour, min, ampm, onChange]);

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

const Field = ({ label, children, error }) => (
  <div>
    <label style={hLbl}>{label}</label>
    {children}
    {error && (
      <p style={{ color: H.red, fontSize: 11, marginTop: 4 }}>{error}</p>
    )}
  </div>
);

const CreateSprint = () => {
  const { addSprint } = useSprints();
  const { rooms, trainers, employees } = useAppData();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  // Trainer time-slot conflict state
  const [conflicts, setConflicts]           = useState([]);
  const [conflictChecking, setChecking]     = useState(false);
  const [conflictAcknowledged, setAckd]     = useState(false);

  // Build cohort options per technology from DB employees, fallback to cohortLabels
  const cohortsByTech = useMemo(() => {
    const map = {};
    TECHNOLOGIES.forEach((tech) => {
      // From DB employees
      const fromDB = [
        ...new Set(
          employees
            .filter(
              (e) =>
                e.technology?.toLowerCase() === tech.toLowerCase() && e.cohort,
            )
            .map((e) => e.cohort),
        ),
      ].sort();
      // Fallback to cohortLabels static list
      const fallback = TECH_COHORTS[tech] ?? [];
      map[tech] = fromDB.length > 0 ? fromDB : fallback;
    });
    return map;
  }, [employees]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      trainer: "",
      startDate: "",
      endDate: "",
      sprintStart: "09:00 AM",
      sprintEnd: "05:00 PM",
      room: "",
      instructions: "",
    },
  });

  // Multiple technology+cohort pairs
  const [cohortPairs, setCohortPairs] = useState([
    { technology: "", cohort: "" },
  ]);
  const [pairErrors, setPairErrors] = useState([
    { technology: "", cohort: "" },
  ]);

  const addPair = () => {
    setCohortPairs((p) => [...p, { technology: "", cohort: "" }]);
    setPairErrors((p) => [...p, { technology: "", cohort: "" }]);
  };

  const removePair = (idx) => {
    if (cohortPairs.length === 1) return;
    setCohortPairs((p) => p.filter((_, i) => i !== idx));
    setPairErrors((p) => p.filter((_, i) => i !== idx));
  };

  const updatePair = (idx, field, value) => {
    setCohortPairs((p) =>
      p.map((r, i) =>
        i === idx
          ? {
              ...r,
              [field]: value,
              ...(field === "technology" ? { cohort: "" } : {}),
            }
          : r,
      ),
    );
    setPairErrors((p) =>
      p.map((r, i) => (i === idx ? { ...r, [field]: "" } : r)),
    );
  };

  const validatePairs = () => {
    const errs = cohortPairs.map((p) => ({
      technology: p.technology ? "" : "Required",
      cohort: p.cohort ? "" : "Required",
    }));
    setPairErrors(errs);
    return errs.every((e) => !e.technology && !e.cohort);
  };

  // Watch fields for conflict check — must be called at top level, not inside useEffect
  const watchedTrainer     = form.watch("trainer");
  const watchedStartDate   = form.watch("startDate");
  const watchedEndDate     = form.watch("endDate");
  const watchedSprintStart = form.watch("sprintStart");
  const watchedSprintEnd   = form.watch("sprintEnd");

  // ── Trainer conflict check ───────────────────────────────
  // Fires whenever trainer, dates, or times change — all five fields must be filled.
  useEffect(() => {
    const trainerObj = trainers.find((t) => t.name === watchedTrainer);
    if (!trainerObj?.id || !watchedStartDate || !watchedEndDate || !watchedSprintStart || !watchedSprintEnd) {
      setConflicts([]);
      return;
    }
    setChecking(true);
    setAckd(false);
    sprintService
      .checkTrainerConflict({
        trainerId:   trainerObj.id,
        startDate:   watchedStartDate,
        endDate:     watchedEndDate,
        sprintStart: watchedSprintStart,
        sprintEnd:   watchedSprintEnd,
      })
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setConflicts(list);
      })
      .catch(() => setConflicts([]))
      .finally(() => setChecking(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTrainer, watchedStartDate, watchedEndDate, watchedSprintStart, watchedSprintEnd]);

  const onSubmit = (data) => {
    if (!validatePairs()) return;
    // If there are conflicts the HR must acknowledge before submitting
    if (conflicts.length > 0 && !conflictAcknowledged) return;
    addSprint({
      ...data,
      cohorts: cohortPairs,
      cohort: cohortPairs[0]?.cohort || "",
    });
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      navigate("/hr/sprints");
    }, 1200);
  };

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
    appearance: "auto",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      style={{
        background: H.bg,
        minHeight: "100vh",
        padding: "32px 28px",
        fontFamily: H.fontFamily,
      }}
    >
      <div
        style={{
          maxWidth: 780,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Banner */}
        <div>
          <button
            onClick={() => navigate("/hr/sprints")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: H.sub,
              fontSize: 13,
              fontWeight: 600,
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: 12,
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = H.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = H.sub)}
          >
            <ArrowLeft size={15} /> Back to Sprints
          </button>
          <PageBanner
            title="Create Sprint"
            gradient={H.gradient}
            shadow="4px 0 24px rgba(29,111,164,0.30)"
            width="240px"
          />
          <p style={{ color: H.sub, fontSize: 13, margin: 0 }}>
            Fill in the details to schedule a new sprint.
          </p>
        </div>

        {/* Success banner */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 18px",
                borderRadius: 12,
                background: H.greenBg,
                border: `1.5px solid ${H.greenBd}`,
                color: H.green,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <CheckCircle size={16} /> Sprint created successfully!
              Redirecting…
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Card */}
        <div
          style={{
            background: H.card,
            border: `1.5px solid ${H.border}`,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: H.shadow,
          }}
        >
          <div style={{ height: 4, background: H.gradient }} />
          <div style={{ padding: "28px 28px 32px" }}>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                style={{ display: "flex", flexDirection: "column", gap: 22 }}
              >
                {/* Technology + Cohort Pairs */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <label style={{ ...hLbl, margin: 0 }}>
                      Technology &amp; Cohort Pairs
                    </label>
                    <button
                      type="button"
                      onClick={addPair}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 12px",
                        borderRadius: 8,
                        background: H.accentBg,
                        border: `1px solid ${H.accentBd}`,
                        color: H.accent,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      + Add Pair
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {cohortPairs.map((pair, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr auto",
                          gap: 10,
                          alignItems: "start",
                          background: H.bg,
                          borderRadius: 10,
                          padding: "12px 14px",
                          border: `1px solid ${H.border}`,
                        }}
                      >
                        <div>
                          <label style={{ ...hLbl, fontSize: 10 }}>
                            Technology
                          </label>
                          <select
                            value={pair.technology}
                            onChange={(e) =>
                              updatePair(idx, "technology", e.target.value)
                            }
                            style={{
                              ...nativeSel,
                              borderColor: pairErrors[idx]?.technology
                                ? H.red
                                : H.border,
                            }}
                          >
                            <option value="">Select technology</option>
                            {TECHNOLOGIES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          {pairErrors[idx]?.technology && (
                            <p
                              style={{
                                color: H.red,
                                fontSize: 11,
                                marginTop: 3,
                              }}
                            >
                              {pairErrors[idx].technology}
                            </p>
                          )}
                        </div>
                        <div>
                          <label style={{ ...hLbl, fontSize: 10 }}>
                            Cohort
                          </label>
                          <select
                            value={pair.cohort}
                            onChange={(e) =>
                              updatePair(idx, "cohort", e.target.value)
                            }
                            disabled={!pair.technology}
                            style={{
                              ...nativeSel,
                              borderColor: pairErrors[idx]?.cohort
                                ? H.red
                                : H.border,
                              opacity: !pair.technology ? 0.5 : 1,
                              cursor: !pair.technology
                                ? "not-allowed"
                                : "pointer",
                            }}
                          >
                            <option value="">
                              {pair.technology
                                ? "Select cohort"
                                : "Select technology first"}
                            </option>
                            {(cohortsByTech[pair.technology] ?? []).map((c) => (
                              <option key={c} value={c} title={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          {pairErrors[idx]?.cohort && (
                            <p
                              style={{
                                color: H.red,
                                fontSize: 11,
                                marginTop: 3,
                              }}
                            >
                              {pairErrors[idx].cohort}
                            </p>
                          )}
                        </div>
                        <div style={{ paddingTop: 22 }}>
                          <button
                            type="button"
                            onClick={() => removePair(idx)}
                            disabled={cohortPairs.length === 1}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background:
                                cohortPairs.length === 1
                                  ? "transparent"
                                  : "rgba(244,63,94,0.08)",
                              border: `1px solid ${cohortPairs.length === 1 ? H.border : "rgba(244,63,94,0.2)"}`,
                              color: cohortPairs.length === 1 ? H.muted : H.red,
                              cursor:
                                cohortPairs.length === 1
                                  ? "not-allowed"
                                  : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Preview tags */}
                  {cohortPairs.some((p) => p.technology && p.cohort) && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 10,
                      }}
                    >
                      {cohortPairs
                        .filter((p) => p.technology && p.cohort)
                        .map((p, i) => (
                          <span
                            key={i}
                            style={{
                              background: H.accentBg,
                              color: H.accent,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 20,
                              border: `1px solid ${H.accentBd}`,
                            }}
                          >
                            {p.technology} /{" "}
                            <span title={p.cohort}>{p.cohort}</span>
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Title + Trainer */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                  }}
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <Field
                          label="Sprint Title"
                          error={form.formState.errors.title?.message}
                        >
                          <input
                            placeholder="e.g. React Fundamentals Sprint"
                            {...field}
                            style={{
                              ...hInp,
                              borderColor: form.formState.errors.title
                                ? H.red
                                : H.border,
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = H.accent)
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = form.formState
                                .errors.title
                                ? H.red
                                : H.border)
                            }
                          />
                        </Field>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trainer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={hLbl}>Trainer</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            style={{
                              ...nativeSel,
                              borderColor: form.formState.errors.trainer
                                ? H.red
                                : H.border,
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = H.accent)
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = form.formState
                                .errors.trainer
                                ? H.red
                                : H.border)
                            }
                          >
                            <option value="">Select trainer</option>
                            {trainers.map((t) => (
                              <option key={t.id ?? t.name} value={t.name}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dates */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                  }}
                >
                  {["startDate", "endDate"].map((name) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <Field
                            label={
                              name === "startDate" ? "Start Date" : "End Date"
                            }
                            error={form.formState.errors[name]?.message}
                          >
                            <input
                              type="date"
                              {...field}
                              style={{
                                ...hInp,
                                borderColor: form.formState.errors[name]
                                  ? H.red
                                  : H.border,
                              }}
                              onFocus={(e) =>
                                (e.target.style.borderColor = H.accent)
                              }
                              onBlur={(e) =>
                                (e.target.style.borderColor = form.formState
                                  .errors[name]
                                  ? H.red
                                  : H.border)
                              }
                            />
                          </Field>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                {/* Times */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                  }}
                >
                  {["sprintStart", "sprintEnd"].map((name) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={hLbl}>
                            {name === "sprintStart" ? "Start Time" : "End Time"}
                          </FormLabel>
                          <FormControl>
                            <TimePicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                {/* Room */}
                <FormField
                  control={form.control}
                  name="room"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={hLbl}>Room</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          style={{
                            ...nativeSel,
                            borderColor: form.formState.errors.room
                              ? H.red
                              : H.border,
                          }}
                          onFocus={(e) =>
                            (e.target.style.borderColor = H.accent)
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = form.formState.errors
                              .room
                              ? H.red
                              : H.border)
                          }
                        >
                          <option value="">Choose a room</option>
                          {(rooms || []).map((r) => (
                            <option key={r} value={r} title={r}>
                              {r && r.includes(" - ") ? r.split(" - ")[1] : r}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Instructions */}
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <Field label="Instructions (optional)">
                        <textarea
                          placeholder="Add any notes or instructions for this sprint..."
                          rows={3}
                          {...field}
                          style={{
                            ...hInp,
                            resize: "vertical",
                            minHeight: 90,
                            padding: "10px 13px",
                          }}
                          onFocus={(e) =>
                            (e.target.style.borderColor = H.accent)
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = H.border)
                          }
                        />
                      </Field>
                    </FormItem>
                  )}
                />

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
                          {c.startDate} → {c.endDate} &nbsp;&bull;&nbsp; {c.sprintStart} – {c.sprintEnd}
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

                {/* Actions */}
                <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
                  <button
                    type="submit"
                    disabled={conflicts.length > 0 && !conflictAcknowledged}
                    style={{
                      padding: "11px 28px",
                      borderRadius: 12,
                      background: H.gradient,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      border: "none",
                      cursor: conflicts.length > 0 && !conflictAcknowledged ? "not-allowed" : "pointer",
                      boxShadow: H.accentGlow,
                      transition: "opacity 0.15s",
                      opacity: conflicts.length > 0 && !conflictAcknowledged ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!(conflicts.length > 0 && !conflictAcknowledged))
                        e.currentTarget.style.opacity = "0.88";
                    }}
                    onMouseLeave={(e) => {
                      if (!(conflicts.length > 0 && !conflictAcknowledged))
                        e.currentTarget.style.opacity = "1";
                    }}
                  >
                    Create Sprint
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/hr/sprints")}
                    style={{
                      padding: "11px 22px",
                      borderRadius: 12,
                      background: "transparent",
                      color: H.sub,
                      fontWeight: 600,
                      fontSize: 14,
                      border: `1.5px solid ${H.border}`,
                      cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = H.bg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateSprint;
