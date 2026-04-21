import { motion } from 'framer-motion';
import { useMemo, useState } from "react";
import { Users, Search, Pencil, Trash2, XCircle, UserPlus, Code2 } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { G, inp, sel, lbl } from "@/theme/manager";
import { useToast } from "@/context/ToastContext";

const TECH_COLOR = {
  Java:       { color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  Python:     { color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  Devops:     { color: "#a855f7", bg: "rgba(168,85,247,0.12)"  },
  DotNet:     { color: "#06b6d4", bg: "rgba(6,182,212,0.12)"   },
  SalesForce: { color: "#00c896", bg: "rgba(0,200,150,0.12)"   },
};

const EMPTY_FORM = { name: "", empId: "", cohort: "", technology: "", phone: "", email: "", department: "" };
const EMPTY_ERRS = { name: "", empId: "", cohort: "", technology: "" };

const FieldError = ({ msg }) =>
  msg ? <p style={{ color: G.red, fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><XCircle size={11} />{msg}</p> : null;

const EmployeesPage = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useAppData();
  // Use global toast instead of local inline alert card
  const { toast } = useToast();
  const [form, setForm]         = useState(EMPTY_FORM);
  const [errs, setErrs]         = useState(EMPTY_ERRS);
  const [editId, setEditId]     = useState(null);
  const [search, setSearch]     = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // showToast is now a thin wrapper around the global toast system
  const showToast = (type, message) => toast[type]?.(message);

  const validate = (name, value) => {
    if (name === "name")       return !value.trim() ? "Name is required." : !/^[a-zA-Z\s]+$/.test(value) ? "Letters only." : "";
    if (name === "empId")      return !value.trim() ? "Employee ID is required." : "";
    if (name === "cohort")     return !value.trim() ? "Cohort is required." : "";
    if (name === "technology") return !value ? "Please select a technology." : "";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrs((p) => ({ ...p, [name]: validate(name, value) }));
  };

  const validateAll = () => {
    const newErrs = Object.fromEntries(Object.keys(EMPTY_ERRS).map((k) => [k, validate(k, form[k])]));
    setErrs(newErrs);
    return Object.values(newErrs).every((e) => e === "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    if (editId) { updateEmployee(editId, form); showToast("success", "Employee updated."); }
    else        { addEmployee(form);            showToast("success", "Employee added.");   }
    setForm(EMPTY_FORM); setErrs(EMPTY_ERRS); setEditId(null); setShowForm(false);
  };

  const handleEdit = (emp) => {
    setForm({
      name: emp.name ?? "",
      empId: emp.empId ?? "",
      cohort: emp.cohort ?? "",
      technology: emp.technology ?? "",
      phone: emp.phone ?? "",
      email: emp.email ?? "",
      department: emp.department ?? "",
    });
    setErrs(EMPTY_ERRS); setEditId(emp.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = () => { deleteEmployee(deleteId); setDeleteId(null); showToast("success", "Employee removed."); };
  const handleCancel = () => { setForm(EMPTY_FORM); setErrs(EMPTY_ERRS); setEditId(null); setShowForm(false); };

  const filtered = useMemo(() =>
    employees.filter((e) =>
      (e.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.empId ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.cohort ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.technology ?? "").toLowerCase().includes(search.toLowerCase())
    ), [employees, search]);

  const techCounts = useMemo(() => {
    const techs = [...new Set(employees.map((e) => e.technology).filter(Boolean))];
    return techs.map((tech) => ({ tech, count: employees.filter((e) => e.technology === tech).length }));
  }, [employees]);

  const card = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 14 };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}  style={{ background: G.bg, minHeight: "100vh", color: G.text }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 3, height: 22, background: G.accent, borderRadius: 2 }} />
              <h1 style={{ color: G.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Employees</h1>
            </div>
            <p style={{ color: G.sub, fontSize: 13, margin: 0 }}>Register and manage all employees across cohorts and technologies.</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: G.accent, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
              <UserPlus size={15} /> Add Employee
            </button>
          )}
        </div>

        {/* Toast is now rendered globally via ToastProvider — removed inline card */}

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
          <div style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: G.accentBg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${G.accentBd}` }}>
              <Users size={18} style={{ color: G.accent }} />
            </div>
            <div>
              <p style={{ color: G.text, fontSize: 24, fontWeight: 800, margin: 0 }}>{employees.length}</p>
              <p style={{ color: G.muted, fontSize: 11, margin: 0 }}>Total Employees</p>
            </div>
          </div>
          {techCounts.map(({ tech, count }) => {
            const c = TECH_COLOR[tech] || { color: G.sub, bg: "rgba(255,255,255,0.06)" };
            return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }} key={tech} style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${c.color}22` }}>
                  <Code2 size={18} style={{ color: c.color }} />
                </div>
                <div>
                  <p style={{ color: G.text, fontSize: 24, fontWeight: 800, margin: 0 }}>{count}</p>
                  <p style={{ color: G.muted, fontSize: 11, margin: 0 }}>{tech}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ ...card, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${G.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: G.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserPlus size={17} style={{ color: G.accent }} />
              </div>
              <div>
                <p style={{ color: G.text, fontSize: 14, fontWeight: 700, margin: 0 }}>{editId ? "Edit Employee" : "Add New Employee"}</p>
                <p style={{ color: G.muted, fontSize: 11, margin: 0 }}>{editId ? "Update the employee details below." : "Fill in the details to register a new employee."}</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 20 }}>
                {[
                  { name: "name",       label: "Full Name",         placeholder: "e.g. Ashok Kumar",   type: "text" },
                  { name: "empId",      label: "Employee ID",       placeholder: "e.g. EMP001",        type: "text" },
                  { name: "cohort",     label: "Cohort",            placeholder: "e.g. Java cohort 1", type: "text" },
                  { name: "phone",      label: "Phone (optional)",  placeholder: "e.g. 9876543210",    type: "text" },
                  { name: "email",      label: "Email (optional)",  placeholder: "e.g. user@co.com",   type: "email" },
                  { name: "department", label: "Dept (optional)",   placeholder: "e.g. Engineering",   type: "text" },
                ].map(({ name, label, placeholder, type }) => (
                  <div key={name}>
                    <label style={lbl}>{label}</label>
                    <input name={name} value={form[name]} placeholder={placeholder} type={type} onChange={handleChange}
                    style={{ ...inp, borderColor: errs[name] ? G.red : G.border }} />
                    <FieldError msg={errs[name]} />
                  </div>
                ))}
                <div>
                  <label style={lbl}>Technology</label>
                  <select name="technology" value={form.technology} onChange={handleChange}
                    style={{ ...sel, borderColor: errs.technology ? G.red : G.border }}>
                    <option value="" style={{ background: G.card }}>Select technology</option>
                    {[...new Set(employees.map((e) => e.technology).filter(Boolean))].sort()
                      .concat(["Java","Python","Devops","DotNet","SalesForce"].filter(
                        (t) => !employees.some((e) => e.technology === t)
                      ))
                      .map((t) => <option key={t} value={t} style={{ background: G.card }}>{t}</option>)}
                  </select>
                  <FieldError msg={errs.technology} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: G.accent, color: "#0a1628", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  {editId ? <><Pencil size={13} />Save Changes</> : <><UserPlus size={13} />Add Employee</>}
                </button>
                <button type="button" onClick={handleCancel} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", color: G.sub, fontWeight: 600, fontSize: 13, border: `1px solid ${G.border}`, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 18, background: G.accent, borderRadius: 2 }} />
              <p style={{ color: G.text, fontSize: 14, fontWeight: 700, margin: 0 }}>All Employees</p>
              <span style={{ background: G.accentDim, color: G.accent, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: `1px solid ${G.border}` }}>{filtered.length}</span>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: G.muted }} />
              <input placeholder="Search name, ID, cohort..." value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ ...inp, width: 220, paddingLeft: 30 }} />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 10 }}>
              <Users size={40} style={{ color: G.muted }} />
              <p style={{ color: G.muted, fontSize: 13 }}>{employees.length === 0 ? "No employees yet. Click \"Add Employee\" to get started." : "No employees match your search."}</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${G.border}`, background: "rgba(0,200,150,0.04)" }}>
                    {["#", "Name", "Emp ID", "Cohort", "Technology", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: G.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp, i) => {
                    const tc = TECH_COLOR[emp.technology] || { color: G.sub, bg: "rgba(255,255,255,0.06)" };
                    return (
                      <tr key={emp.id} style={{ borderBottom: `1px solid rgba(0,200,150,0.06)` }}
                        onMouseEnter={(e) => e.currentTarget.style.background = G.bg2}
                        onMouseLeave={(e) => e.currentTarget.style.background = ""}
                      >
                        <td style={{ padding: "12px 16px", color: G.muted }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: G.accentBg, display: "flex", alignItems: "center", justifyContent: "center", color: G.accent, fontSize: 11, fontWeight: 800, border: `1px solid ${G.border}` }}>
                              {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ color: G.text, fontWeight: 600 }}>{emp.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", color: G.sub }}>{emp.empId}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: "rgba(255,255,255,0.06)", color: G.sub, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, border: `1px solid rgba(255,255,255,0.08)` }}>{emp.cohort}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: `1px solid ${tc.color}33` }}>{emp.technology}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => handleEdit(emp)} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: G.blue, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeleteId(emp.id)} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: G.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Modal */}
        {deleteId && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }}>
            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 380 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(244,63,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={18} style={{ color: G.red }} />
                </div>
                <div>
                  <p style={{ color: G.text, fontWeight: 700, margin: 0 }}>Remove Employee</p>
                  <p style={{ color: G.muted, fontSize: 11, margin: 0 }}>This action cannot be undone.</p>
                </div>
              </div>
              <p style={{ color: G.sub, fontSize: 13, marginBottom: 20 }}>
                Are you sure you want to remove <strong style={{ color: G.text }}>{employees.find((e) => e.id === deleteId)?.name}</strong>?
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleDelete} style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: G.red, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>Yes, Remove</button>
                <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "transparent", color: G.sub, fontWeight: 600, fontSize: 13, border: `1px solid ${G.border}`, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default EmployeesPage;
