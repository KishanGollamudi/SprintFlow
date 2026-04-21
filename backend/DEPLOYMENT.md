# SprintFlow — Single Server Docker Deployment Guide

**Target:** Ubuntu 22.04 | 2GB RAM / 1 vCPU | Static IP | HTTPS with self-signed cert

---

## Architecture

```
Internet (HTTPS port 443)
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  Ubuntu Server (Docker Host)                        │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Nginx Container (frontend)                  │  │
│  │  - Serves React SPA on port 443 (HTTPS)      │  │
│  │  - Proxies /api → backend:8080                │  │
│  │  - Proxies /ws  → backend:8080 (WebSocket)    │  │
│  └──────────────────────────────────────────────┘  │
│                      │                               │
│                      ▼                               │
│  ┌──────────────────────────────────────────────┐  │
│  │  Spring Boot Container (backend)             │  │
│  │  - Java 21 + Spring Boot 3.2                  │  │
│  │  - Port 8080 (internal only)                  │  │
│  └──────────────────────────────────────────────┘  │
│                      │                               │
│                      ▼                               │
│  ┌──────────────────────────────────────────────┐  │
│  │  MySQL 8 Container (database)                │  │
│  │  - Port 3306 (internal only)                  │  │
│  │  - Data persisted in Docker volume            │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Prerequisites

- Ubuntu 22.04 server with static IP
- Root or sudo access
- Ports 80 and 443 open in firewall
- Git installed: `sudo apt install git -y`

---

## Step 1 — Clone Repositories on Server

SSH into your server and run:

```bash
cd ~

# Clone backend (contains docker-compose.yml)
git clone https://github.com/chaitanya-asu/sprintflow-backend.git sprintflow
cd sprintflow

# Switch to the correct branch
git checkout feature/java21

# Clone frontend inside the backend project
git clone https://github.com/chaitanya-asu/sprintflow-frontend.git sprintflow-frontend
cd sprintflow-frontend
git checkout develop
cd ..

# Verify structure
ls -la
# You should see:
#   docker-compose.yml
#   Dockerfile (backend)
#   sprintflow-frontend/Dockerfile (frontend)
#   sprintflow-frontend/nginx.conf
#   docker/init/01-schema.sql
#   docker/init/02-seed.sql
#   setup.sh
```

---

## Step 2 — Run Setup Script

This single script installs Docker, generates SSL cert, creates `.env`, and starts everything:

```bash
chmod +x setup.sh
./setup.sh
```

**What happens:**
- Installs Docker + Docker Compose plugin (~2 minutes)
- Generates self-signed SSL certificate for your server IP
- Creates `.env` with auto-generated secrets (JWT secret, DB password, mail key)
- Builds 3 Docker images: MySQL, Spring Boot, Nginx (~5 minutes on first run)
- Starts all containers
- MySQL auto-loads schema from `docker/init/01-schema.sql`

**Output:**
```
✅ App URL:    https://YOUR_SERVER_IP
✅ API URL:    https://YOUR_SERVER_IP/api/health
```

---

## Step 3 — First Login

1. Open `https://YOUR_SERVER_IP` in your browser
2. Browser shows **"Your connection is not private"** warning (expected — self-signed cert)
3. Click **Advanced** → **Proceed to YOUR_SERVER_IP**
4. Login page appears
5. Use default credentials:
   - Email: `admin@sprintflow.local`
   - Password: `Admin@123`
6. **Immediately change the password** via Profile page

---

## Verify Everything Works

| Test | URL | Expected |
|---|---|---|
| Frontend loads | `https://YOUR_IP` | Login page appears |
| API health check | `https://YOUR_IP/api/health` | `{"success":true,"data":{"status":"UP"}}` |
| Login as manager | Email: `admin@sprintflow.local` | Redirects to `/manager` dashboard |
| Create employee | Manager → Employees → Add | Saved, appears in list |
| Create sprint | HR → Create Sprint | Saved, appears in list |
| Mark attendance | Trainer → Sprints → Attendance | Submitted, locked |
| Chat | Click bell icon → search user → send message | Message appears in real time |
| Page refresh | Any page | Session restored, no redirect to login |

---

## Useful Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql

# Restart a single service
docker compose restart backend

# Stop everything
docker compose down

# Stop and remove volumes (DELETES ALL DATA)
docker compose down -v

# Rebuild after code changes
git pull
docker compose up -d --build

# Check resource usage
docker stats

# Access MySQL CLI
docker compose exec mysql mysql -u sprintflow -p sprintflow_db
```

---

## Redeploy After Code Changes

```bash
chmod +x redeploy.sh
./redeploy.sh
```

This pulls latest code, rebuilds changed images, and restarts containers with zero downtime.

---

## Troubleshooting

### Backend won't start — "WeakKeyException"
**Cause:** `APP_JWT_SECRET` is missing or too short.
**Fix:** Check `.env` file — `APP_JWT_SECRET` must be exactly 64 hex characters.
```bash
cat .env | grep APP_JWT_SECRET
# Should be 64 chars long
```

### Frontend shows blank page
**Cause:** `VITE_API_BASE_URL` was wrong at build time.
**Fix:** Edit `.env`, update `VITE_API_BASE_URL=https://YOUR_IP/api`, then rebuild:
```bash
docker compose up -d --build frontend
```

### API calls return CORS error
**Cause:** `APP_CORS_ORIGINS` doesn't match the URL in the browser.
**Fix:** Edit `.env`, set `APP_CORS_ORIGINS=https://YOUR_IP`, restart backend:
```bash
docker compose restart backend
```

### Chat doesn't work (WebSocket fails)
**Cause:** Nginx WebSocket proxy not configured correctly.
**Fix:** Check `sprintflow-frontend/nginx.conf` has the `/ws` location block with `Upgrade` headers. Already included in the provided config.

### MySQL won't start — "Can't connect to MySQL server"
**Cause:** Port 3306 already in use by another MySQL instance on the host.
**Fix:** Stop the host MySQL: `sudo systemctl stop mysql`, then restart containers.

### Out of memory errors
**Cause:** 2GB RAM is tight for 3 containers.
**Fix:** Reduce memory limits in `docker-compose.yml`:
```yaml
mysql:   512M → 384M
backend: 768M → 512M
```

---

## Security Notes

1. **Self-signed certificate** — browser shows a warning once per device. For production with a domain, replace with Let's Encrypt (free).

2. **Default admin password** — `Admin@123` is set in `docker/init/02-seed.sql`. Change it immediately after first login.

3. **`.env` file** — contains all secrets. Never commit to git. Already in `.gitignore`.

4. **Firewall** — only ports 80 and 443 should be open. MySQL port 3306 stays internal to Docker network.

5. **Swagger UI** — disabled in production via `SWAGGER_ENABLED=false`. To enable for testing, set to `true` in `.env` and restart backend.

---

## Backup & Restore

### Backup database
```bash
docker compose exec mysql mysqldump -u sprintflow -p sprintflow_db > backup.sql
```

### Restore database
```bash
docker compose exec -T mysql mysql -u sprintflow -p sprintflow_db < backup.sql
```

### Backup Docker volume
```bash
docker run --rm -v sprintflow_mysql_data:/data -v $(pwd):/backup \
    ubuntu tar czf /backup/mysql-backup.tar.gz /data
```

---

## Cost Estimate

| Item | Monthly Cost |
|---|---|
| Ubuntu VPS (2GB RAM, 1 vCPU) | ~$5–$12 (DigitalOcean, Linode, Vultr) |
| Static IP | Included |
| SSL certificate | Free (self-signed) |
| **Total** | **~$5–$12/month** |

---

## Next Steps

- [ ] Change default admin password
- [ ] Create HR and Trainer users via Manager → Trainers / HRBPs
- [ ] Add employees via Manager → Employees
- [ ] Create sprints via HR → Create Sprint
- [ ] Configure SMTP via Manager → Profile → Mail Settings (for credential emails)
- [ ] Set up automated backups (cron job running `mysqldump` daily)
- [ ] Optional: Get a domain name and replace self-signed cert with Let's Encrypt
