import { motion, AnimatePresence } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSprints } from "@/context/SprintContext";
import { useAppData } from "@/context/AppDataContext";
import { T } from "@/theme/trainer";
import { useToast } from "@/context/ToastContext";

const DRAFT_KEY = "createSprint_draft";

const timeToMinutes = (t) => {
  if (!t) return 0;
  const [time, period] = t.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

const formSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    trainer: z.string().min(1, "Trainer is required"),
    startDate: z.string().min(1, "Start date required"),
    endDate: z.string().min(1, "End date required"),
    sprintStart: z.string().min(1, "Start time is required"),
    sprintEnd: z.string().min(1, "End time is required"),
    room: z.string().min(1, "Room is required"),
    cohort: z.string().min(1, "Cohort is required"),
    instructions: z.string().optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })
  .refine((d) => timeToMinutes(d.sprintEnd) > timeToMinutes(d.sprintStart), {
    message: "End time must be after start time",
    path: ["sprintEnd"],
  });

const TIME_OPTIONS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

const inp = {
  background: T.card,
  border: `1.5px solid ${T.border}`,
  borderRadius: 10,
  color: T.text,
  padding: "9px 13px",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const lbl = {
  color: T.muted,
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  display: "block",
  marginBottom: 5,
};

const selStyle = {
  background: T.card,
  border: `1.5px solid ${T.border}`,
  borderRadius: 10,
  color: T.text,
  height: 40,
  fontSize: 13,
  width: "100%",
};

const FIELD_LABELS = {
  title: "Sprint Title",
  trainer: "Trainer",
  startDate: "Start Date",
  endDate: "End Date",
  sprintStart: "Start Time",
  sprintEnd: "End Time",
  room: "Room",
  cohort: "Cohort",
  instructions: "Instructions",
};

const CreateSprint = () => {
  const { addSprint } = useSprints();
  const navigate = useNavigate();
  const { trainers, rooms, cohortNames } = useAppData();
  // Use global toast — replaces the inline motion toast banner
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const savedDraft = (() => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {};
    } catch {
      return {};
    }
  })();

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
      cohort: "",
      instructions: "",
      ...savedDraft,
    },
  });

  const watchedValues = useWatch({ control: form.control });

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(watchedValues));
  }, [watchedValues]);

  const onSubmit = (data) => {
    setPendingData(data);
    setShowPreview(true);
  };

  const confirmSubmit = () => {
    addSprint(pendingData);
    localStorage.removeItem(DRAFT_KEY);
    setShowPreview(false);
    // Show global toast instead of inline motion banner
    toast.success("Sprint created successfully!");
    setTimeout(() => {
      navigate("/sprints");
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px" }}
    >
      {/* Toast is rendered globally by ToastProvider in App.jsx */}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && pendingData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: T.card,
                borderRadius: 18,
                padding: "28px 32px",
                maxWidth: 480,
                width: "90%",
                boxShadow: T.shadowMd,
                border: `1.5px solid ${T.border}`,
              }}
            >
              <div
                style={{
                  height: 3,
                  background: T.line,
                  borderRadius: 2,
                  marginBottom: 20,
                }}
              />
              <h2
                style={{
                  color: T.text,
                  fontSize: 17,
                  fontWeight: 800,
                  margin: "0 0 4px",
                }}
              >
                Review Sprint Details
              </h2>
              <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>
                Confirm before creating the sprint.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {Object.entries(FIELD_LABELS).map(([key, label]) =>
                  pendingData[key] ? (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          color: T.muted,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          fontSize: 11,
                          letterSpacing: "0.06em",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          color: T.text,
                          fontWeight: 600,
                          maxWidth: 260,
                          textAlign: "right",
                        }}
                      >
                        {pendingData[key]}
                      </span>
                    </div>
                  ) : null,
                )}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button
                  onClick={confirmSubmit}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 12,
                    background: T.accent,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: T.accentGlow,
                  }}
                >
                  Confirm & Create
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 12,
                    background: "transparent",
                    color: T.sub,
                    fontWeight: 600,
                    fontSize: 14,
                    border: `1.5px solid ${T.border}`,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
                Create Sprint
              </h1>
              <p style={{ color: T.muted, fontSize: 12, margin: 0 }}>
                Fill in the details to schedule a new sprint.
              </p>
            </div>
          </div>
          {Object.values(watchedValues).some(Boolean) && (
            <span
              style={{
                fontSize: 11,
                color: T.accent,
                fontWeight: 700,
                background: T.accentBg,
                border: `1px solid ${T.accentBd}`,
                borderRadius: 8,
                padding: "3px 10px",
              }}
            >
              Draft saved
            </span>
          )}
        </div>

        {/* Form Card */}
        <div
          style={{
            background: T.card,
            border: `1.5px solid ${T.border}`,
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: T.shadow,
          }}
        >
          <div style={{ height: 3, background: T.line }} />
          <div style={{ padding: "28px 28px 32px" }}>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {/* Title + Trainer */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={lbl}>Sprint Title</FormLabel>
                        <FormControl>
                          <input
                            placeholder="e.g. React Advanced Training"
                            {...field}
                            style={inp}
                            onFocus={(e) =>
                              (e.target.style.borderColor = T.accent)
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = T.border)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trainer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={lbl}>Trainer</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger style={selStyle}>
                              <SelectValue placeholder="Select trainer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {trainers.map((t) => (
                              <SelectItem
                                key={t.id ?? t.name}
                                value={t.name ?? t}
                              >
                                {t.name ?? t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    gap: 16,
                  }}
                >
                  {["startDate", "endDate"].map((name) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={lbl}>
                            {name === "startDate" ? "Start Date" : "End Date"}
                          </FormLabel>
                          <FormControl>
                            <input
                              type="date"
                              {...field}
                              style={inp}
                              onFocus={(e) =>
                                (e.target.style.borderColor = T.accent)
                              }
                              onBlur={(e) =>
                                (e.target.style.borderColor = T.border)
                              }
                            />
                          </FormControl>
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
                    gap: 16,
                  }}
                >
                  {["sprintStart", "sprintEnd"].map((name) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={lbl}>
                            {name === "sprintStart" ? "Start Time" : "End Time"}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger style={selStyle}>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIME_OPTIONS.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                {/* Room + Cohort */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <FormField
                    control={form.control}
                    name="room"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={lbl}>Room</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger style={selStyle}>
                              <SelectValue placeholder="Select room" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rooms.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r && r.includes(" - ") ? r.split(" - ")[1] : r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cohort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={lbl}>Cohort</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger style={selStyle}>
                              <SelectValue placeholder="Select cohort" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cohortNames.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Instructions */}
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={lbl}>
                        Instructions{" "}
                        <span
                          style={{
                            textTransform: "none",
                            fontWeight: 400,
                            color: T.muted,
                          }}
                        >
                          (optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any notes or instructions for this sprint..."
                          rows={3}
                          {...field}
                          style={{
                            ...inp,
                            resize: "vertical",
                            minHeight: 80,
                            padding: "10px 13px",
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actions */}
                <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 28px",
                      borderRadius: 12,
                      background: T.accent,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: T.accentGlow,
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.88")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Review & Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(DRAFT_KEY);
                      navigate("/sprints");
                    }}
                    style={{
                      padding: "10px 22px",
                      borderRadius: 12,
                      background: "transparent",
                      color: T.sub,
                      fontWeight: 600,
                      fontSize: 14,
                      border: `1.5px solid ${T.border}`,
                      cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.bg)
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
