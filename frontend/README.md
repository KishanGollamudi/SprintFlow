# SprintFlow Frontend

Attendance & sprint management frontend built with **React 19 + Vite**, Tailwind CSS, shadcn/ui, and Framer Motion.

---

## Tech Stack

| Layer | Library |
|-------|---------|
| UI Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v3 + shadcn/ui (Radix UI) |
| Animations | Framer Motion |
| Routing | React Router v7 |
| Forms | react-hook-form + zod |
| HTTP | Axios (JWT Bearer, auto-refresh on 401) |
| Real-time | STOMP over SockJS |
| Charts | Recharts |
| 3D | Three.js + @react-three/fiber |
| Testing | Vitest (unit) + Playwright (e2e) + MSW (mocks) |

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **SprintFlow Backend** running on `http://localhost:8080` (or set `VITE_API_BASE_URL`)

---

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd sprintflow-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

`.env` options:

```env
# Set to true to run with local dummy data — no backend needed
VITE_USE_MOCK=false

# Your Spring Boot backend base URL
VITE_API_BASE_URL=http://localhost:8080/api

# WebSocket URL (optional — defaults to same host as API)
# VITE_WS_URL=http://localhost:8080
```

> **Quick start without backend:** Set `VITE_USE_MOCK=true` — the app runs fully with mock data using MSW.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Watch mode unit tests |
| `npm run e2e` | Run Playwright e2e tests |

---

## Roles & Login

Three roles are supported:

| Role | Default redirect | Description |
|------|-----------------|-------------|
| `trainer` | `/` | Manage sprints, mark attendance |
| `hr` | `/hr` | Create sprints, manage cohorts & employees |
| `manager` | `/manager` | Full oversight — employees, HRBPs, trainers, sprints |

**Mock mode credentials** (when `VITE_USE_MOCK=true`):

| Role | Name |
|------|------|
| trainer | Vikram Singh |
| hr | Meena Iyer |
| manager | Surya Prakash |

---

## Project Structure

```
src/
├── components/          # Shared UI components (Header, Sidebar, etc.)
│   └── ui/              # Reusable primitives (StatCard, Pagination, Toast, etc.)
├── constants/           # Cohort config, labels
├── context/             # React contexts (Auth, AppData, Sprint, Attendance, Toast, etc.)
├── features/
│   ├── hr/              # HR module pages
│   ├── sprint/          # Trainer sprint pages
│   └── trainer/         # Trainer dashboard & attendance
├── hooks/               # Custom hooks (useMessenger)
├── layouts/             # MainLayout
├── lib/                 # Utilities (cohortUtils)
├── mocks/               # MSW handlers & server (mock mode)
├── pages/               # Shared pages (Login, Chat, Profile, Manager pages)
├── routes/              # AppRoutes with role-based protection
├── services/            # Axios API services
├── theme/               # Role-specific theme tokens (trainer, hr, manager)
└── utils/               # Helpers (dateUtils, apiResponse, sprintEmployees)
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USE_MOCK` | `false` | `true` = MSW mock mode, no backend needed |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Backend API base URL |
| `VITE_WS_URL` | *(derived from API URL)* | WebSocket server URL for chat |

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch — all features merge here |
| `feature/*` | Individual feature branches |
| `fix/*` | Bug fix branches |

---

## Notes for New Developers

- All API calls go through `src/services/api.js` — JWT is attached automatically.
- Token refresh on 401 is handled transparently in the Axios interceptor.
- The global toast system is in `src/context/ToastContext.jsx` — use `useToast()` anywhere.
- Date utilities are in `src/utils/dateUtils.js` — always use `todayLocal()` instead of `new Date().toISOString()` to avoid timezone bugs.
- Reusable `StatCard` component is in `src/components/ui/StatCard.jsx`.
