# SprintFlow — Complete Changes Summary

## Date: 2025-01-XX
## Scope: TrainerDashboard rebuild + API gap fixes + Trainer conflict check

---

## Frontend Changes

### New Features

#### 1. **TrainerDashboard** (`src/features/trainer/pages/TrainerDashboard.jsx`) — complete rebuild
- **Removed**: Old dashboard with heatmap + stacked rows
- **Added**: 3 new sections:
  - **Section 1**: Cohort Attendance Bar Chart (Recharts vertical bars, color-coded green/amber/red, Daily/Weekly/Monthly filter)
  - **Section 2**: Today's Sprint Cards (block list layout with header row: Sprint | Progress | P L A Total)
  - **Section 3**: Per-Sprint Pie Charts (Present/Late/Absent slices, own Daily/Weekly/Monthly filter)
- **Data source**: `attendanceService.getAllBySprint()` for historical records + `AttendanceContext.ensureSession()` for today's live data
- **Auto-refresh**: Watches `sessions` state — when any session flips to `submitted: true`, all charts re-fetch from API

#### 2. **Trainer conflict check** — HR sprint creation
- **File**: `src/features/hr/pages/CreateSprint.jsx`
- **Feature**: When HR fills trainer + dates + times, a `useEffect` calls `sprintService.checkTrainerConflict()` to find overlapping sprints
- **UI**: Amber warning banner shows conflicting sprint details with an acknowledgement checkbox
- **Flow**: Submit button is disabled until HR ticks "I understand the conflict and want to proceed anyway"

#### 3. **Date picker restrictions** — no future attendance
- **File**: `src/features/sprint/pages/SprintAttendance.jsx`
- **Change**: `max={today}` on date picker + `clampDate(..., sprint.startDate, today)` so trainers cannot select tomorrow or future dates for attendance

#### 4. **Accordion default state** — all collapsed
- **File**: `src/features/trainer/pages/AttendanceList.jsx`
- **Change**: Removed `defaultOpen={index === 0}` — all sprint accordions start collapsed, only open on user click

### Bug Fixes

#### 5. **403 on `GET /api/users?role=TRAINER` for trainer role**
- **File**: `src/context/AppDataContext.jsx`
- **Root cause**: Trainer role was calling `userService.getTrainers()` to display trainer names on sprint cards. `/api/users` is MANAGER+HR only.
- **Fix**: Removed the trainer role branch. Trainer name now comes from `user.name` in `AuthContext` — no API call needed.

#### 6. **Dashboard empty on refresh** — all 3 sections
- **Root cause**: `AttendanceContext.getSession()` returned transient all-Absent data when `sessions` state was empty. `ensureSession` (the API fetch) was only called inside `SprintAttendance.jsx` when the trainer opened that page.
- **Fix**: `TodaySprintCards` now calls `ensureSession(sprint.id, today)` on mount for every sprint. `sessions` state is passed as a prop instead of calling `getSession()` during render.

#### 7. **Attendance records missing `sprintId`**
- **File**: `src/context/AppDataContext.jsx` + `src/context/AttendanceContext.jsx`
- **Root cause**: Records stored in `attendance` map had no `sprintId` field, so pie/bar chart filters by `r.sprintId === sprint.id` always returned zero results.
- **Fix**: Added `sprintId: s.id` to every record stored in both contexts.

#### 8. **HR SprintList runtime crash** — `handleSearch` undefined
- **File**: `src/features/hr/pages/SprintList.jsx`
- **Root cause**: Search input called `onChange={handleSearch}` but only `setSearch` existed.
- **Fix**: Added `handleSearch` function that calls `setSearch` and resets `page` to 1.

#### 9. **HR SprintList `updateAppSprint` undefined**
- **File**: `src/features/hr/pages/SprintList.jsx`
- **Root cause**: `handleSave` called `updateAppSprint(...)` but it was never destructured from `useAppData()`.
- **Fix**: Added `updateSprint: updateAppSprint` to the `useAppData()` destructure.

#### 10. **SprintPage `openViewEmployees` used wrong unwrap**
- **File**: `src/pages/SprintPage.jsx`
- **Root cause**: `const list = res?.data ?? res` — but `api.js` already unwraps `response.data`, so `res` is the `ApiResponseDTO` body. `res?.data` is the actual array but the fallback `res` would be the whole DTO object.
- **Fix**: Replaced with `unwrapList(res)` which handles all response shapes correctly.

#### 11. **`AppDataContext.addTrainer` spread order bug**
- **File**: `src/context/AppDataContext.jsx`
- **Root cause**: `{ ...rest, role: "TRAINER" }` — but `rest` contained `role: "Manager-Trainings"` from the form field, which came after `role: "TRAINER"` in the spread and overwrote it. Backend received `role: "Manager-Trainings"` causing a 400.
- **Fix**: Destructured `role` out of `data` as `trainerRoleFromForm` before spreading, then set `role: "TRAINER"` and `trainerRole: trainerRoleFromForm` explicitly. Same fix applied to `updateTrainer` and `addHrbp`.

#### 12. **`CreateSprint` used `form.watch()` inside `useEffect` dependency array**
- **File**: `src/features/hr/pages/CreateSprint.jsx`
- **Root cause**: Hooks cannot be called inside dependency arrays — React error.
- **Fix**: Moved `form.watch()` calls to top-level variables, then referenced those in the dependency array.

### API Service Updates

#### 13. **`sprintService.js`** — added `checkTrainerConflict()`
Calls `GET /api/sprints/check-trainer-conflict` with `{ trainerId, startDate, endDate, sprintStart, sprintEnd, excludeSprintId }`.

#### 14. **`userService.js`** — added `getAllTrainers()` and `getAllHRBPs()`
Both pass `includeInactive: true` param. Used by manager pages to show/restore inactive users. Default `getTrainers()`/`getHRBPs()` return Active only (for dropdowns).

---

## Backend Changes

### New Endpoints

#### 1. **`GET /api/sprints/check-trainer-conflict`**
- **Controller**: `SprintController.checkTrainerConflict()`
- **Service**: `SprintService.checkTrainerConflict()`
- **Repository**: `SprintRepository.findTrainerOverlappingSprints()`
- **Logic**: Finds sprints for a trainer whose date range overlaps the proposed range, then filters by time-slot overlap (parses `"HH:MM AM/PM"` to minutes-since-midnight, checks `startA < endB AND endA > startB`)
- **Returns**: `List<SprintDTO>` — empty = no conflict

#### 2. **`GET /api/sprints` pagination support**
- **Params**: `page` (1-based), `pageSize` (default 10)
- **Response**: When `page` is provided returns `{ items: [...], total: N, page: 1, pageSize: 10 }`. Otherwise returns plain array (backward compatible).
- **Also added**: `q` keyword search param (filters title + trainer name in-memory)

#### 3. **`GET /api/employees` Active-only default**
- **Params**: `status` (optional) — omit for Active only, pass `status=Inactive` to include all
- **Service**: Added `EmployeeService.getActiveEmployees()` using `findByStatus("Active")`
- **Fix**: Soft-deleted employees no longer appear in lists/dropdowns by default

#### 4. **`GET /api/users` Active-only default + `includeInactive` param**
- **Params**: `role` (TRAINER/HR), `includeInactive` (boolean, default false)
- **Service**: Split `getUsersByRole()` into:
  - `getUsersByRole(role)` → Active only (for dropdowns)
  - `getAllUsersByRole(role)` → all statuses (for manager restore pages)
- **Fix**: HR sprint creation dropdown no longer shows deactivated trainers

### Repository Queries Added

#### 5. **`SprintRepository.findTrainerOverlappingSprints()`**
JPQL query:
```sql
SELECT s FROM Sprint s 
WHERE s.trainer.id = :trainerId 
  AND s.status != 'Completed' 
  AND s.startDate <= :endDate 
  AND s.endDate >= :startDate 
  AND (:excludeId IS NULL OR s.id != :excludeId)
```

### Service Methods Added

#### 6. **`SprintService.checkTrainerConflict()`**
Finds date-overlapping sprints, parses time strings to minutes, filters by time overlap.

#### 7. **`SprintService.parseTimeToMinutes()`**
Parses `"09:00 AM"` → `540` (minutes since midnight). Handles 12-hour format with AM/PM.

#### 8. **`EmployeeService.getActiveEmployees()`**
Returns only Active employees using `findByStatus("Active")`.

#### 9. **`UserService.getAllUsersByRole()`**
Returns all users by role including Inactive (for manager restore pages).

---

## Removed Files

- `src/features/sprint/pages/Overview.jsx` — deleted (never existed in codebase, already absent)
- `/overview` route — removed from `AppRoutes.jsx` (never existed, already clean)
- Overview sidebar entry — removed from `Sidebar.jsx` (never existed, already clean)
- Overview breadcrumb entry — removed from `AppBreadcrumb.jsx` ✅

---

## Configuration Changes

### SecurityConfig
- Clarified comment: HR can read `GET /api/users` (rule was already correct)

---

## Testing Checklist

### Frontend
- [ ] TrainerDashboard loads with real data on refresh (no 403 errors)
- [ ] Today's Sprint Cards show correct Present/Late/Absent counts from DB
- [ ] Bar chart and pie charts update after attendance submission
- [ ] HR CreateSprint shows conflict warning when trainer has overlapping sprint
- [ ] HR cannot submit sprint with unacknowledged conflict
- [ ] SprintAttendance date picker blocks future dates
- [ ] AttendanceList accordions start collapsed
- [ ] HR SprintList search works without crashing
- [ ] Manager Trainers/HRBPs pages show inactive users with restore button
- [ ] HR sprint creation dropdown shows only Active trainers

### Backend
- [ ] `GET /api/sprints/check-trainer-conflict` returns conflicts correctly
- [ ] `GET /api/sprints?page=1&pageSize=8` returns paginated response
- [ ] `GET /api/sprints?q=Java` filters by keyword
- [ ] `GET /api/employees` returns Active only by default
- [ ] `GET /api/employees?status=Inactive` returns all employees
- [ ] `GET /api/users?role=TRAINER` returns Active trainers only
- [ ] `GET /api/users?role=TRAINER&includeInactive=true` returns all trainers
- [ ] Soft-deleted employees don't appear in sprint enrollment lists
- [ ] Trainer creation with role="Manager-Trainings" saves correctly (not rejected as invalid enum)

---

## Known Limitations

1. **Room capacity check** — not implemented (was requested but deprioritized)
2. **Pagination** — backend does in-memory slice (fine for <1000 sprints, would need Spring Data Page for larger datasets)
3. **Time conflict check** — only checks trainer conflicts, not room conflicts

---

## Migration Notes

- No database schema changes required
- No environment variable changes required
- Existing attendance data is preserved and displayed correctly
- All existing API contracts remain backward compatible
