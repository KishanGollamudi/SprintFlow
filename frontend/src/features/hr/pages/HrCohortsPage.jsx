import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Layers,
  UserPlus,
  Trash2,
  Search,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { H, hInp, hSel, hLbl } from "@/theme/hr";
import PageBanner from "@/components/PageBanner";
import { useToast } from "@/context/ToastContext";

const TECHNOLOGIES = ["Java", "Python", "Devops", "DotNet", "SalesForce"];

const TECH_BADGE = {
  Java: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  Python: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  Devops: { color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  DotNet: { color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  SalesForce: { color: "#00c896", bg: "rgba(0,200,150,0.12)" },
};

const EMPTY_FORM = {
  name: "",
  empId: "",
  email: "",
  phone: "",
  technology: "",
  cohort: "",
};
const EMPTY_ERRS = {
  name: "",
  empId: "",
  email: "",
  cohort: "",
  technology: "",
};

const FieldError = ({ msg }) =>
  msg ? (
    <p
      style={{
        color: H.red,
        fontSize: 11,
        marginTop: 4,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <XCircle size={11} />
      {msg}
    </p>
  ) : null;

export default function HrCohortsPage() {
  const { employees, cohortNames, addCohort, removeCohort, addEmployee } =
    useAppData();
  const { toast } = useToast();

  // Derive technologies from DB employees, fallback to static list
  const technologies = useMemo(() => {
    const fromDB = [
      ...new Set(employees.map((e) => e.technology).filter(Boolean)),
    ].sort();
    return fromDB.length > 0
      ? fromDB
      : ["Java", "Python", "Devops", "DotNet", "SalesForce"];
  }, [employees]);

  const [newCohortName, setNewCohortName] = useState("");
  const [selectedCohort, setSelectedCohort] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errs, setErrs] = useState(EMPTY_ERRS);
  const [search, setSearch] = useState("");
  const [filterCohort, setFilterCohort] = useState("all");

  // showToast wraps global toast — keeps existing call sites unchanged
  const showToast = (type, message) => toast[type]?.(message);

  const countInCohort = (cohort) =>
    employees.filter((e) => e.cohort === cohort).length;

  const handleCreateCohort = (e) => {
    e.preventDefault();
    const res = addCohort(newCohortName);
    if (res.ok) {
      showToast("success", `Cohort "${newCohortName.trim()}" created.`);
      setNewCohortName("");
    } else showToast("error", res.message);
  };

  const handleRemoveCohort = (name) => {
    const res = removeCohort(name);
    if (res.ok) showToast("success", "Cohort removed.");
    else showToast("error", res.message);
  };

  const validate = (name, value) => {
    if (name === "name")
      return !value.trim()
        ? "Name is required."
        : !/^[a-zA-Z\s]+$/.test(value)
          ? "Letters only."
          : "";
    if (name === "empId")
      return !value.trim() ? "Employee ID is required." : "";
    if (name === "cohort")
      return !value.trim() ? "Select or create a cohort." : "";
    if (name === "technology") return !value ? "Select a technology." : "";
    if (name === "email" && value.trim()) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Invalid email.";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrs((p) => ({ ...p, [name]: validate(name, value) }));
  };

  const validateAll = () => {
    const keys = ["name", "empId", "cohort", "technology", "email"];
    const next = {};
    keys.forEach((k) => {
      next[k] = validate(k, form[k] || "");
    });
    setErrs((p) => ({ ...p, ...next }));
    return keys.every((k) => !next[k]);
  };

  const handleSubmitEmployee = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    try {
      await addEmployee({
        name: form.name.trim(),
        empId: form.empId.trim(),
        technology: form.technology,
        cohort: form.cohort,
        ...(form.email.trim() && { email: form.email.trim() }),
        ...(form.phone.trim() && { phone: form.phone.trim() }),
      });
      showToast("success", "Employee added.");
      setForm({ ...EMPTY_FORM, cohort: selectedCohort || form.cohort });
      setErrs(EMPTY_ERRS);
    } catch (err) {
      showToast("error", err.message || "Could not add employee.");
    }
  };

  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (filterCohort !== "all")
      list = list.filter((e) => e.cohort === filterCohort);
    const q = search.toLowerCase();
    if (!q) return list;
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.empId.toLowerCase().includes(q) ||
        (e.cohort || "").toLowerCase().includes(q),
    );
  }, [employees, filterCohort, search]);

  const card = {
    background: H.card,
    border: `1.5px solid ${H.border}`,
    borderRadius: 16,
    boxShadow: H.shadow,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      style={{ background: H.bg, minHeight: "100vh", padding: "28px 24px" }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <Link
          to="/hr"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: H.accent,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            width: "fit-content",
          }}
        >
          <ArrowLeft size={15} /> Back to HR dashboard
        </Link>

        <PageBanner
          title="Cohorts & employees"
          gradient={H.gradient}
          shadow="4px 0 24px rgba(29,111,164,0.28)"
          width="420px"
        />
        <p style={{ color: H.sub, fontSize: 13, margin: "-8px 0 0" }}>
          Create cohorts, then assign new hires to a cohort and technology
          stack.
        </p>

        {/* Toast rendered globally via ToastProvider */}

        {/* Create cohort */}
        <div style={{ ...card, padding: "20px 22px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
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
              }}
            >
              <Layers size={17} style={{ color: H.accent }} />
            </div>
            <div>
              <p
                style={{
                  color: H.text,
                  fontSize: 15,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Create cohort
              </p>
              <p style={{ color: H.muted, fontSize: 11, margin: 0 }}>
                Use the same labels as in the database, e.g. Java cohort 1,
                Python cohort 2.
              </p>
            </div>
          </div>
          <form
            onSubmit={handleCreateCohort}
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: "1 1 220px" }}>
              <label style={hLbl}>Cohort name</label>
              <input
                value={newCohortName}
                onChange={(e) => setNewCohortName(e.target.value)}
                placeholder="e.g. Java cohort 1"
                style={hInp}
                onFocus={(e) => {
                  e.target.style.borderColor = H.accent;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = H.border;
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                background: H.accent,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
                boxShadow: H.accentGlow,
              }}
            >
              Add cohort
            </button>
          </form>
        </div>

        {/* Cohort chips */}
        <div style={{ ...card, padding: "18px 22px" }}>
          <p style={{ ...hLbl, marginBottom: 12 }}>
            Your cohorts ({cohortNames.length})
          </p>
          {cohortNames.length === 0 ? (
            <p style={{ color: H.muted, fontSize: 13 }}>
              No cohorts yet — create one above.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {cohortNames.map((c) => {
                const n = countInCohort(c);
                const canRemove = n === 0;
                return (
                  <div
                    key={c}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 12,
                      background: selectedCohort === c ? H.accentBg : H.bg2,
                      border: `1.5px solid ${selectedCohort === c ? H.accentBd : H.border}`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCohort(c);
                        setForm((f) => ({ ...f, cohort: c }));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: H.text,
                        fontWeight: 600,
                        fontSize: 13,
                        padding: 0,
                      }}
                    >
                      {c}
                    </button>
                    <span style={{ color: H.muted, fontSize: 11 }}>
                      {n} emp.
                    </span>
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCohort(c)}
                        title="Remove empty cohort"
                        style={{
                          background: H.redBg,
                          border: `1px solid ${H.redBd}`,
                          borderRadius: 8,
                          padding: 4,
                          cursor: "pointer",
                          color: H.red,
                          display: "flex",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add employee */}
        <div style={{ ...card, padding: "22px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
              paddingBottom: 16,
              borderBottom: `1.5px solid ${H.border}`,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: H.accentBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1.5px solid ${H.accentBd}`,
              }}
            >
              <UserPlus size={18} style={{ color: H.accent }} />
            </div>
            <div>
              <p
                style={{
                  color: H.text,
                  fontSize: 15,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Add employee to a cohort
              </p>
              <p style={{ color: H.muted, fontSize: 11, margin: 0 }}>
                Employee ID must be unique. Email is optional.
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmitEmployee} noValidate>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                gap: 14,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={hLbl}>Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Priya Sharma"
                  style={{
                    ...hInp,
                    borderColor: errs.name ? H.red : H.border,
                  }}
                />
                <FieldError msg={errs.name} />
              </div>
              <div>
                <label style={hLbl}>Employee ID</label>
                <input
                  name="empId"
                  value={form.empId}
                  onChange={handleChange}
                  placeholder="e.g. EMP042"
                  style={{
                    ...hInp,
                    borderColor: errs.empId ? H.red : H.border,
                  }}
                />
                <FieldError msg={errs.empId} />
              </div>
              <div>
                <label style={hLbl}>Cohort</label>
                <select
                  name="cohort"
                  value={form.cohort}
                  onChange={handleChange}
                  style={{
                    ...hSel,
                    borderColor: errs.cohort ? H.red : H.border,
                  }}
                >
                  <option value="">Select cohort</option>
                  {cohortNames.map((c) => (
                    <option key={c} value={c} title={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <FieldError msg={errs.cohort} />
              </div>
              <div>
                <label style={hLbl}>Technology</label>
                <select
                  name="technology"
                  value={form.technology}
                  onChange={handleChange}
                  style={{
                    ...hSel,
                    borderColor: errs.technology ? H.red : H.border,
                  }}
                >
                  <option value="">Select technology</option>
                  {TECHNOLOGIES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <FieldError msg={errs.technology} />
              </div>
              <div>
                <label style={hLbl}>Email (optional)</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  style={{
                    ...hInp,
                    borderColor: errs.email ? H.red : H.border,
                  }}
                />
                <FieldError msg={errs.email} />
              </div>
              <div>
                <label style={hLbl}>Phone (optional)</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 …"
                  style={hInp}
                />
              </div>
              {/* Department field removed (not required) */}
            </div>
            <button
              type="submit"
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                background: H.gradient,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
                boxShadow: H.accentGlow,
              }}
            >
              Save employee
            </button>
          </form>
        </div>

        {/* Table */}
        <div style={{ ...card, overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: `1.5px solid ${H.border}`,
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
                Employees
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
                {filteredEmployees.length}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                value={filterCohort}
                onChange={(e) => setFilterCohort(e.target.value)}
                style={{ ...hSel, width: 160, height: 38 }}
              >
                <option value="all">All cohorts</option>
                {cohortNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div style={{ position: "relative" }}>
                <Search
                  size={13}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: H.muted,
                  }}
                />
                <input
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ ...hInp, width: 200, paddingLeft: 30, height: 38 }}
                />
              </div>
            </div>
          </div>
          {filteredEmployees.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 20px",
                color: H.muted,
                fontSize: 13,
              }}
            >
              No employees match your filters.
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
                    {["Name", "Emp ID", "Cohort", "Technology", "Email"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "11px 18px",
                            color: H.muted,
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
                  {filteredEmployees.map((emp) => {
                    const tb = TECH_BADGE[emp.technology] || {
                      color: H.sub,
                      bg: H.bg2,
                    };
                    return (
                      <tr
                        key={emp.id}
                        style={{ borderBottom: `1px solid ${H.border}` }}
                      >
                        <td
                          style={{
                            padding: "12px 18px",
                            fontWeight: 600,
                            color: H.text,
                          }}
                        >
                          {emp.name}
                        </td>
                        <td
                          style={{
                            padding: "12px 18px",
                            fontFamily: "monospace",
                            color: H.sub,
                            fontSize: 12,
                          }}
                        >
                          {emp.empId}
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span
                            style={{
                              background: H.bg2,
                              color: H.sub,
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "3px 9px",
                              borderRadius: 8,
                              border: `1px solid ${H.border}`,
                            }}
                          >
                            {emp.cohort}
                          </span>
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span
                            style={{
                              background: tb.bg,
                              color: tb.color,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 20,
                            }}
                          >
                            {emp.technology}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 18px",
                            color: H.muted,
                            fontSize: 12,
                          }}
                        >
                          {emp.email || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
