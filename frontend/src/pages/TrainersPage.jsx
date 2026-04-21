import { motion } from 'framer-motion';
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Users, Search, Pencil, Trash2, XCircle, ShieldCheck, UserCheck, RefreshCw, RotateCcw } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import userService from "@/services/userService";
import { useToast } from "@/context/ToastContext";

const ROLES       = ["Manager-Trainings", "Director-Trainings", "Delivery Head"];
const DEPARTMENTS = ["Communication", "Java", "Python", "Devops", "R&D", "Scrum"];

const STATUS_STYLE = {
  Active:   "bg-emerald-100 text-emerald-600 border border-emerald-200",
  Inactive: "bg-red-100 text-red-600 border border-red-200",
};
const ROLE_STYLE = {
  "Manager-Trainings":  "bg-violet-100 text-violet-600 border border-violet-200",
  "Director-Trainings": "bg-sky-100 text-sky-600 border border-sky-200",
  "Delivery Head":      "bg-amber-100 text-amber-600 border border-amber-200",
};

const EMPTY_FORM = { name: "", email: "", phone: "", role: "", department: "", status: "Active", joined: "" };
const EMPTY_ERRS = { name: "", email: "", phone: "", role: "", department: "", joined: "" };

const FieldError = ({ msg }) =>
  msg ? <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><XCircle className="h-3 w-3" />{msg}</p> : null;

const TrainersPage = () => {
  const { trainers, addTrainer, updateTrainer, deleteTrainer, restoreTrainer } = useAppData();
  // Use global toast instead of local inline alert card
  const { toast } = useToast();
  const [form, setForm]         = useState(EMPTY_FORM);
  const [errs, setErrs]         = useState(EMPTY_ERRS);
  const [editId, setEditId]     = useState(null);
  const [search, setSearch]     = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // showToast wraps global toast — keeps existing call sites unchanged
  const showToast = (type, message) => toast[type]?.(message);

  const filtered = useMemo(() =>
    trainers.filter((tr) =>
      (tr.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (tr.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (tr.trainerRole ?? tr.role ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (tr.department ?? "").toLowerCase().includes(search.toLowerCase())
    ), [trainers, search]);

  const stats = useMemo(() => ({
    total:    trainers.length,
    active:   trainers.filter((tr) => tr.status === "Active").length,
    inactive: trainers.filter((tr) => tr.status === "Inactive").length,
  }), [trainers]);

  const validateField = (name, value) => {
    switch (name) {
      case "name":       return !value.trim() ? "Full name is required." : !/^[a-zA-Z\s]+$/.test(value) ? "Name must contain letters only." : "";
      case "email":      return !value.trim() ? "Email address is required." : !/\S+@\S+\.\S+/.test(value) ? "Enter a valid email address (e.g. user@example.com)." : "";
      case "phone":      return value && value.length !== 10 ? "Phone number must be exactly 10 digits." : "";
      case "role":       return !value ? "Please select a role." : "";
      case "department": return !value ? "Please select a department." : "";
      case "joined":     return !value ? "Joining date is required." : "";
      default:           return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && !/^\d{0,10}$/.test(value)) return;
    setForm((f) => ({ ...f, [name]: value }));
    setErrs((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateAll = () => {
    const newErrs = Object.fromEntries(Object.keys(EMPTY_ERRS).map((k) => [k, validateField(k, form[k])]));
    setErrs(newErrs);
    return Object.values(newErrs).every((e) => e === "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    if (editId) {
      updateTrainer(editId, form);
      showToast("success", "Trainer updated successfully.");
    } else {
      addTrainer(form);
      showToast("success", "Trainer added successfully.");
    }
    setForm(EMPTY_FORM); setErrs(EMPTY_ERRS); setEditId(null); setShowForm(false);
  };

  const handleEdit = (t) => {
    setForm({ name: t.name, email: t.email, phone: t.phone ?? "", role: t.trainerRole ?? t.role ?? "", department: t.department ?? "", status: t.status, joined: t.joined ?? t.joinedDate ?? "" });
    setErrs(EMPTY_ERRS); setEditId(t.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = () => {
    deleteTrainer(deleteId);
    setDeleteId(null);
    showToast("success", "Trainer deactivated.");
  };

  const handleRestore = async (id) => {
    try {
      await restoreTrainer(id);
      showToast("success", "Trainer restored successfully.");
    } catch {
      showToast("error", "Failed to restore trainer.");
    }
  };

  const handleResend = async (id) => {
    try {
      await userService.resendCredentials(id);
      showToast("success", "Credentials resent successfully.");
    } catch {
      showToast("error", "Failed to resend credentials.");
    }
  };

  const handleCancel = () => { setForm(EMPTY_FORM); setErrs(EMPTY_ERRS); setEditId(null); setShowForm(false); };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}  className="bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

        <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Trainers</h1>
            <p className="text-sm text-gray-500 mt-1">Manage, register and track all Trainers.</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white mt-3 sm:mt-0">
              <UserPlus className="h-4 w-4 mr-2" /> Add Trainer
            </Button>
          )}
        </header>

        {/* Toast rendered globally via ToastProvider */}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Trainers", value: stats.total,    icon: Users,       color: "text-indigo-600",  bg: "bg-indigo-50"  },
            { label: "Active",         value: stats.active,   icon: UserCheck,   color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Inactive",       value: stats.inactive, icon: ShieldCheck, color: "text-red-600",    bg: "bg-red-50"    },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="flex items-center gap-4 py-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {showForm && (
          <Card className="bg-white border border-gray-200 shadow-sm" style={{animation:'formSlideIn 200ms ease'}}>
            <CardHeader className="border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-base font-semibold">{editId ? "Edit Trainer" : "Add Trainer"}</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">{editId ? "Update the details below and save." : "Fill in the details to register a new Trainer."}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Full Name</label>
                    <Input name="name" value={form.name} placeholder="Enter full name" onChange={handleChange}
                      className={`bg-white text-gray-900 placeholder:text-gray-400 ${errs.name ? "border-red-400" : "border-gray-200"}`} />
                    <FieldError msg={errs.name} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</label>
                    <Input name="email" type="email" value={form.email} placeholder="Enter email address" onChange={handleChange}
                      className={`bg-white text-gray-900 placeholder:text-gray-400 ${errs.email ? "border-red-400" : "border-gray-200"}`} />
                    <FieldError msg={errs.email} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone (optional)</label>
                    <Input name="phone" type="tel" value={form.phone} placeholder="10-digit number" onChange={handleChange}
                      className={`bg-white text-gray-900 placeholder:text-gray-400 ${errs.phone ? "border-red-400" : "border-gray-200"}`} />
                    <FieldError msg={errs.phone} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</label>
                    <select name="role" value={form.role} onChange={handleChange}
                      className={`h-8 w-full rounded-lg border bg-white px-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 ${errs.role ? "border-red-400" : "border-gray-200"}`}>
                      <option value="" className="bg-white text-gray-900">Select role</option>
                      {ROLES.map((r) => <option key={r} value={r} className="bg-white text-gray-900">{r}</option>)}
                    </select>
                    <FieldError msg={errs.role} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Department</label>
                    <select name="department" value={form.department} onChange={handleChange}
                      className={`h-8 w-full rounded-lg border bg-white px-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 ${errs.department ? "border-red-400" : "border-gray-200"}`}>
                      <option value="" className="bg-white text-gray-900">Select department</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d} className="bg-white text-gray-900">{d}</option>)}
                    </select>
                    <FieldError msg={errs.department} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
                    <select name="status" value={form.status} onChange={handleChange}
                      className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400">
                      <option value="Active" className="bg-white text-gray-900">Active</option>
                      <option value="Inactive" className="bg-white text-gray-900">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Joining Date</label>
                    <Input name="joined" type="date" value={form.joined} onChange={handleChange}
                      className={`bg-white text-gray-900 ${errs.joined ? "border-red-400" : "border-gray-200"}`} />
                    <FieldError msg={errs.joined} />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {editId ? <><Pencil className="h-4 w-4 mr-2" />Save Changes</> : <><UserPlus className="h-4 w-4 mr-2" />Add Trainer</>}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleCancel} className="text-gray-500 hover:text-gray-900">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-base font-semibold">All Trainers</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">{filtered.length} record{filtered.length !== 1 ? "s" : ""} found</p>
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input placeholder="Search name, role, dept..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-8 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Users className="h-10 w-10 text-gray-400" />
                <p className="text-gray-500 text-sm">{trainers.length === 0 ? "No Trainers added yet. Click \"Add Trainer\" to get started." : "No records match your search."}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    {["#","Name","Role","Email","Phone","Department","Joined","Status","Actions"].map((h) => (
                      <TableHead key={h} className="text-gray-500">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t, i) => (
                    <TableRow key={t.id} className={`border-gray-100 transition-colors ${
                      t.status === "Inactive" ? "opacity-50 bg-gray-50" : "hover:bg-gray-50"
                    }`}>
                      <TableCell className="text-gray-400">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                            {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-gray-900 font-medium">{t.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_STYLE[t.trainerRole ?? t.role] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>{t.trainerRole ?? t.role ?? "—"}</span></TableCell>
                      <TableCell className="text-gray-600">{t.email}</TableCell>
                      <TableCell className="text-gray-600">{t.phone || "—"}</TableCell>
                      <TableCell><span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs text-indigo-600 font-medium">{t.department}</span></TableCell>
                      <TableCell className="text-gray-600">{t.joined ?? t.joinedDate ?? "—"}</TableCell>
                      <TableCell><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[t.status] ?? STATUS_STYLE.Inactive}`}>{t.status}</span></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {t.status === "Active" ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(t)} className="h-7 w-7 p-0 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50" title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleResend(t.id)} className="h-7 w-7 p-0 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50" title="Resend Credentials"><RefreshCw className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteId(t.id)} className="h-7 w-7 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50" title="Deactivate"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => handleRestore(t.id)} className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-50 border border-emerald-200" title="Restore">
                              <RotateCcw className="h-3 w-3 mr-1" /> Restore
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 ">
            <Card className="w-full max-w-sm bg-white border border-gray-200 shadow-lg">
              <CardContent className="pt-6 pb-6 px-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"><Trash2 className="h-5 w-5 text-red-600" /></div>
                  <div>
                    <p className="text-gray-900 font-semibold">Deactivate Trainer</p>
                    <p className="text-xs text-gray-500 mt-0.5">The trainer will be marked Inactive and can be restored later.</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Deactivate <span className="font-semibold text-gray-900">{trainers.find((t) => t.id === deleteId)?.name}</span>? They will lose access but their data is preserved.</p>
                <div className="flex gap-3 pt-1">
                  <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-500 text-white">Yes, Deactivate</Button>
                  <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 text-gray-500 hover:text-gray-900 border border-gray-200">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default TrainersPage;




