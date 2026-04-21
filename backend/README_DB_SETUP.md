# SprintFlow — DB & Backend Setup for Teammates

## Prerequisites
- MySQL 8.x installed and running
- Java 17+ installed
- Node.js 18+ installed

---

## Step 1 — Clone the repos
```bash
git clone <frontend-repo-url>
git clone <backend-repo-url>
```

---

## Step 2 — Create the database
```bash
mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS sprintflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## Step 3 — Start the Spring Boot backend
Open the project in Eclipse/STS and run `SprintFlowApplication.java`
OR from terminal:
```bash
cd sprintflow
./mvnw spring-boot:run
```
Wait until you see: `Started SprintFlowApplication`
This auto-creates all tables via `ddl-auto=update`.

---

## Step 4 — Seed the database
Run this ONCE after the backend has started (tables must exist first):
```bash
mysql -u root -proot sprintflow_db < seed.sql
```

---

## Step 5 — Start the frontend
```bash
cd sprintflow-frontend
npm install
npm run dev
```

---

## Login credentials (all roles)
| Role    | Email                      | Password   |
|---------|----------------------------|------------|
| Manager | surya@sprintflow.com       | Admin@123  |
| HR      | meena@sprintflow.com       | Admin@123  |
| HR      | suresh@sprintflow.com      | Admin@123  |
| Trainer | vikram@sprintflow.com      | Admin@123  |
| Trainer | anita@sprintflow.com       | Admin@123  |
| Trainer | ravi@sprintflow.com        | Admin@123  |
| Trainer | nisha@sprintflow.com       | Admin@123  |

---

## Switch between Mock and Real API
In `sprintflow-frontend/.env`:
```
VITE_USE_MOCK=false   # real backend
VITE_USE_MOCK=true    # dummy data (no backend needed)
```

---

## DB credentials (default)
```
Host:     localhost:3306
Database: sprintflow_db
Username: root
Password: root
```
To change: update `src/main/resources/application.properties`
