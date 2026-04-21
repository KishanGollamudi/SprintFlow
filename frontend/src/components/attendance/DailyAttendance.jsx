import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, Users, Clock, XCircle, GraduationCap } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { t } from "@/lib/i18n";

const TECH_STYLE = {
  Java:       "bg-amber-100 text-amber-600 border border-amber-200",
  Python:     "bg-sky-100 text-sky-600 border border-sky-200",
  Devops:     "bg-violet-100 text-violet-600 border border-violet-200",
  DotNet:     "bg-indigo-100 text-indigo-600 border border-indigo-200",
  SalesForce: "bg-emerald-100 text-emerald-600 border border-emerald-200",
};

const STATUS_BTN = {
  Present: {
    active:   "bg-emerald-500 text-gray-900 border border-emerald-500 shadow-md shadow-emerald-500/20",
    inactive: "bg-gray-50 text-gray-500 border border-gray-200 hover:border-emerald-500/50 hover:text-emerald-600",
  },
  Late: {
    active:   "bg-amber-500 text-gray-900 border border-amber-500 shadow-md shadow-amber-500/20",
    inactive: "bg-gray-50 text-gray-500 border border-gray-200 hover:border-amber-500/50 hover:text-amber-600",
  },
  Absent: {
    active:   "bg-rose-500 text-gray-900 border border-rose-500 shadow-md shadow-rose-500/20",
    inactive: "bg-gray-50 text-gray-500 border border-gray-200 hover:border-rose-500/50 hover:text-red-600",
  },
};

const STATUS_BADGE = {
  Present: "bg-emerald-100 text-emerald-600 border border-emerald-200",
  Absent:  "bg-red-100 text-red-600 border border-red-200",
  Late:    "bg-amber-100 text-amber-600 border border-amber-200",
};

const todayKey = new Date().toISOString().slice(0, 10);

const DailyAttendance = () => {
  const { employees, sprints, trainers, getAttendanceForDate, setAttendanceForDate } = useAppData();
  const { user } = useAuth();

  const [date, setDate]           = useState(todayKey);
  const [trainerId, setTrainerId] = useState("");
  const [cohort, setCohort]       = useState("");

  // Auto-select the logged-in trainer when the trainers list loads
  useEffect(() => {
    if (trainerId || !user || user.role?.toLowerCase() !== "trainer") return;
    const match = trainers.find(
      (t) => t.email?.toLowerCase() === user.email?.toLowerCase()
    );
    if (match) setTrainerId(String(match.id));
  }, [trainers, user, trainerId]);

  // If the logged-in user is a trainer but /api/users returned empty (403),
  // synthesise a minimal trainer entry from the auth user so the page works.
  const effectiveTrainers = useMemo(() => {
    if (trainers.length > 0) return trainers;
    if (user?.role?.toLowerCase() === "trainer") {
      return [{
        id: user.id,
        name: user.name ?? user.email,
        email: user.email,
        department: user.department ?? "",
      }];
    }
    return [];
  }, [trainers, user]);

  // Selected trainer object
  const selectedTrainer = useMemo(
    () => effectiveTrainers.find((t) => String(t.id) === trainerId) ?? null,
    [effectiveTrainers, trainerId]
  );

  // Sprint assigned to this trainer — match by trainerId (DB id)
  const assignedSprint = useMemo(() => {
    if (!selectedTrainer) return null;
    return sprints.find((s) => String(s.trainerId) === String(selectedTrainer.id)) ?? null;
  }, [selectedTrainer, sprints]);

  const records = getAttendanceForDate(date);

  // Employees belonging to this sprint — use cohort pairs for accurate matching
  const sprintEmployees = useMemo(() => {
    if (!assignedSprint) return [];
    const pairs = assignedSprint.cohorts?.length
      ? assignedSprint.cohorts
      : [{ technology: assignedSprint.technology || "", cohort: assignedSprint.cohort || "" }];
    return employees.filter((emp) =>
      pairs.some(
        (pair) =>
          String(pair.technology || "").toLowerCase() === String(emp.technology || "").toLowerCase() &&
          String(pair.cohort || "").toLowerCase() === String(emp.cohort || "").toLowerCase()
      )
    );
  }, [employees, assignedSprint]);

  // Cohorts within those employees
  const availableCohorts = useMemo(() =>
    [...new Set(sprintEmployees.map((e) => e.cohort))].sort()
  , [sprintEmployees]);

  // Final list — filtered by cohort if chosen
  const visibleEmployees = useMemo(() => {
    if (!cohort) return sprintEmployees;
    return sprintEmployees.filter((e) => e.cohort === cohort);
  }, [sprintEmployees, cohort]);

  const getRecord = (empId) => records.find((r) => r.empId === empId);

  const mark = (emp, status) => {
    const existing = records.find((r) => r.empId === emp.empId);
    const time = status === "Absent" ? null
      : new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const sprint = assignedSprint?.title ?? "";
    const next = existing
      ? records.map((r) => r.empId === emp.empId ? { ...r, status, time, sprint } : r)
      : [...records, { empId: emp.empId, name: emp.name, cohort: emp.cohort, technology: emp.technology, status, time, sprint }];
    setAttendanceForDate(date, next);
  };

  const statuses = visibleEmployees.map((e) => getRecord(e.empId)?.status);
  const summary = {
    present:  statuses.filter((s) => s === "Present").length,
    late:     statuses.filter((s) => s === "Late").length,
    absent:   statuses.filter((s) => s === "Absent").length,
    unmarked: statuses.filter((s) => !s).length,
  };

  const handleTrainerChange = (val) => { setTrainerId(val); setCohort(""); };

  const ready = !!selectedTrainer && !!assignedSprint;

  return (
    <div className="bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

        {/* Header */}
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500">Select your name to load your sprint and mark attendance.</p>
        </header>

        {/* Selection Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('label.dateField')}</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900" />
              </div>

              {/* Trainer */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" /> {t('label.selectTrainerField')}
                  </span>
                </label>
                <select value={trainerId} onChange={(e) => handleTrainerChange(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400">
                  <option value="" className="bg-white text-gray-900">Select your name</option>
                  {effectiveTrainers.map((t) => (
                    <option key={t.id} value={String(t.id)} className="bg-white text-gray-900">
                      {t.name} — {t.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cohort */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t('label.cohortOptionalField')} <span className="normal-case text-gray-400 font-normal">(optional)</span>
                </label>
                <select value={cohort} onChange={(e) => setCohort(e.target.value)}
                  disabled={!ready || availableCohorts.length === 0}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed">
                  <option value="" className="bg-white text-gray-900">All Cohorts</option>
                  {availableCohorts.map((c) => (
                    <option key={c} value={c} className="bg-white text-gray-900">{c}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Trainer info strip */}
            {selectedTrainer && (
              <div className={`mt-4 flex items-center gap-3 rounded-xl border px-4 py-3 ${
                assignedSprint
                  ? "bg-indigo-50 border-indigo-200"
                  : "bg-amber-50 border-amber-500/20"
              }`}>
                <GraduationCap className={`h-4 w-4 shrink-0 ${assignedSprint ? "text-indigo-600" : "text-amber-600"}`} />
                {assignedSprint ? (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{selectedTrainer.name}</span>
                    {" "}is assigned to the{" "}
                    <span className="font-semibold text-indigo-600">{assignedSprint.title}</span>
                    {" "}sprint · {sprintEmployees.length} employee{sprintEmployees.length !== 1 ? "s" : ""} enrolled
                  </p>
                ) : (
                  <p className="text-sm text-amber-600">
                    <span className="font-semibold text-gray-900">{selectedTrainer.name}</span>
                    {" "}has no sprint assigned. Add a sprint matching their department "{selectedTrainer.department}".
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {ready && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Present",  value: summary.present,  icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Late",     value: summary.late,     icon: Clock,     color: "text-amber-600",   bg: "bg-amber-50"  },
                { label: "Absent",   value: summary.absent,   icon: XCircle,   color: "text-red-600",    bg: "bg-red-50"   },
                { label: "Unmarked", value: summary.unmarked, icon: Users,     color: "text-gray-500",   bg: "bg-gray-100"  },
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

            {/* Attendance Table */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 text-base font-semibold">Mark Attendance</CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {visibleEmployees.length} employee{visibleEmployees.length !== 1 ? "s" : ""} · {date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TECH_STYLE[assignedSprint.title] ?? "bg-indigo-100 text-indigo-600 border border-indigo-200"}`}>
                      {assignedSprint.title}
                    </span>
                    {cohort && (
                      <span className="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs text-gray-600 font-medium">
                        {cohort}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {visibleEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <Users className="h-10 w-10 text-gray-400" />
                    <p className="text-gray-500 text-sm text-center">
                      No employees found for the <span className="text-gray-900 font-medium">{assignedSprint.title}</span> sprint.
                      <br />
                      <span className="text-gray-400 text-xs">Add employees with technology "{assignedSprint.title}" in the Employees page.</span>
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-500">#</TableHead>
                        <TableHead className="text-gray-500">Employee</TableHead>
                        <TableHead className="text-gray-500">Emp ID</TableHead>
                        <TableHead className="text-gray-500">Cohort</TableHead>
                        <TableHead className="text-gray-500">Technology</TableHead>
                        <TableHead className="text-gray-500">Status</TableHead>
                        <TableHead className="text-gray-500">Mark Attendance</TableHead>
                        <TableHead className="text-gray-500">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleEmployees.map((emp, i) => {
                        const rec = getRecord(emp.empId);
                        const currentStatus = rec?.status ?? null;
                        return (
                          <TableRow key={emp.id} className="border-gray-100 hover:bg-gray-50 transition-colors">
                            <TableCell className="text-gray-400">{i + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                                  {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-gray-900 font-medium">{emp.name}</span>
                              </div>
                            </TableCell>
                            <TableCell><span className="font-mono text-sm text-gray-600">{emp.empId}</span></TableCell>
                            <TableCell>
                              <span className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600 font-medium">{emp.cohort}</span>
                            </TableCell>
                            <TableCell>
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TECH_STYLE[emp.technology] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                                {emp.technology}
                              </span>
                            </TableCell>
                            <TableCell>
                              {currentStatus
                                ? <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[currentStatus]}`}>{currentStatus}</span>
                                : <span className="text-xs text-gray-400 italic">Not marked</span>}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {["Present", "Late", "Absent"].map((s) => (
                                  <button key={s} onClick={() => mark(emp, s)}
                                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-150 ${currentStatus === s ? STATUS_BTN[s].active : STATUS_BTN[s].inactive}`}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm">{rec?.time ?? "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!ready && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-gray-200">
              <GraduationCap className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">
              {!trainerId ? "Select your name above to get started." : "No sprint assigned to this trainer yet."}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default DailyAttendance;




