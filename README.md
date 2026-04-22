# SprintFlow HRMS – Local Deployment & Setup Guide

This document covers the complete process of deploying the **SprintFlow HRMS** application on a Fedora Linux laptop, including:

- Installing Docker and Docker Compose
- Configuring the backend, frontend, and MySQL containers
- Fixing authentication issues (password encoding, database schema)
- Seeding the database with users, sprints, employees, and attendance records
- Exposing the application to other devices on the same Wi‑Fi network
- Pushing all changes to a new GitHub branch

---

## 1. Prerequisites

- **Fedora Workstation** (or any Linux distribution with Docker support)
- **Git** installed (`sudo dnf install git`)
- **Python 3** (for generating bcrypt hashes, optional)
- **Docker** and **Docker Compose** (installation steps below)

---

## 2. Install Docker on Fedora

We installed Docker using the official repository because `dnf config-manager --add-repo` was not available in newer Fedora versions.

```bash
# Remove old Docker packages if any
sudo dnf remove -y docker docker-client docker-client-latest docker-common \
    docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true

# Install dependencies
sudo dnf install -y dnf-plugins-core

# Manually add Docker CE repository (since --add-repo may fail)
sudo tee /etc/yum.repos.d/docker-ce.repo <<EOF
[docker-ce-stable]
name=Docker CE Stable
baseurl=https://download.docker.com/linux/fedora/\$releasever/\$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://download.docker.com/linux/fedora/gpg
EOF

# Install Docker Engine, CLI, and plugins
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
sudo systemctl enable docker
sudo systemctl start docker

# Add current user to docker group (to run without sudo)
sudo usermod -aG docker $USER
```

**Important:** Log out and log back in (or run `newgrp docker`) for the group change to take effect.

---

## 3. Clone the Repository and Prepare Environment

```bash
git clone https://github.com/KishanGollamudi/HRMS.git
cd HRMS
```

The original repository had issues with submodules and authentication. We made the following changes:

### 3.1 Fix `docker-compose.yml`

The original file used `expose` instead of `ports` for the backend, and the frontend build context pointed to non‑existent folders. We corrected it:

```yaml
backend:
  # ...
  ports:
    - "8080:8080"          # expose to host
  # remove "expose: 8080"

frontend:
  build:
    context: ./frontend    # was ../sprintflow-frontend
  # ...
```

### 3.2 Create `.env` file with secrets

The script `fedora.sh` generated a `.env` file containing database passwords, JWT secret, and frontend variables.  
We later modified it to allow network access (see Section 7).

Example `.env` after initial generation:

```ini
MYSQL_ROOT_PASSWORD=rsZs1JRBuSF8bhePx4jR
DB_USERNAME=sprintflow
DB_PASSWORD=kbvC74r5m8vvMn5wjJOb
APP_JWT_SECRET=3ed0d6cac57b38f67d4980c46d36a163f3c840faf33714ee846164d0e8448f5a
APP_MAIL_KEY=15797242c223669a8b8de604677c6db2
APP_CORS_ORIGINS=http://localhost
APP_FRONTEND_URL=http://localhost
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
SWAGGER_ENABLED=false
```

**Never commit `.env` to Git** – we added it to `.gitignore`.

### 3.3 Add database schema and seed scripts

We created the following SQL files inside the `backend/` directory:

- `schema.sql` – creates all tables (`users`, `employees`, `sprints`, `sprint_employees`, `attendance`, `chat_messages`, `messages`)
- `seed.sql` – inserts managers, HR, trainer, and Java employees/sprints/enrollments
- `seed_additional.sql` – adds .NET and Salesforce sprints with employees and attendance
- `seed_python_devops.sql` – adds Python and Devops employees with detailed attendance records

These were imported into the MySQL container (see Section 5).

### 3.4 Fix authentication (bcrypt password encoding)

The original `AuthController` had compilation errors. We fixed it by:

- Using the correct `ApiResponseDTO` constructor (with extra parameters)
- Calling `jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole())`
- Using `user.setActive(true)` (not `setIsActive`)
- Delegating authentication logic to `AuthService`

All these fixes are already present in the codebase you have.

---

## 4. Running the Application for the First Time

Start all containers:

```bash
docker compose up -d
```

Check status:

```bash
docker ps
```

You should see three containers: `sprintflow-mysql`, `sprintflow-backend`, `sprintflow-frontend`.

Verify backend health:

```bash
curl http://localhost:8080/api/health
```

Expected response:

```json
{"success":true,"message":"Service is healthy","data":{"status":"UP"}, ...}
```

Open the frontend in your browser: **http://localhost**  
(Login will fail until we seed users.)

---

## 5. Seeding the Database

### 5.1 Import schema and seed data

The MySQL container uses the root password from `.env`. We stored it as `MYSQL_ROOT_PASSWORD=rsZs1JRBuSF8bhePx4jR`.

```bash
# Import schema
docker exec -i sprintflow-mysql mysql -uroot -prsZs1JRBuSF8bhePx4jR < backend/schema.sql

# Import main seed (users, Java sprints, employees)
docker exec -i sprintflow-mysql mysql -uroot -prsZs1JRBuSF8bhePx4jR < backend/seed.sql

# Import additional sprints (.NET, Salesforce)
docker exec -i sprintflow-mysql mysql -uroot -prsZs1JRBuSF8bhePx4jR < backend/seed_additional.sql

# Import Python & Devops data
docker exec -i sprintflow-mysql mysql -uroot -prsZs1JRBuSF8bhePx4jR < backend/seed_python_devops.sql
```

After each import, you can verify counts:

```bash
docker exec -it sprintflow-mysql mysql -uroot -prsZs1JRBuSF8bhePx4jR -e "USE sprintflow_db; SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM employees; SELECT COUNT(*) FROM sprints; SELECT COUNT(*) FROM attendance;"
```

### 5.2 Fixing passwords for seeded users

The original `seed.sql` used an incorrect bcrypt hash (`$2a$10$N9qo8u...`). We regenerated a correct hash for the password `Admin@123` using a temporary Python container:

```bash
docker run --rm python:3-slim bash -c "pip install -q bcrypt && python -c 'import bcrypt; print(bcrypt.hashpw(b\"Admin@123\", bcrypt.gensalt(10)).decode())'"
```

Output: `$2b$10$ECv7m.OJlM1saJphfQ50mO78lLVlcLUTMYd0gfCpKSrXUVpLMgd2q`

Then we updated all seeded users:

```bash
docker exec -it sprintflow-mysql mysql -uroot -prsZs1JRBuSF8bhePx4jR -e "
USE sprintflow_db;
UPDATE users SET password='\$2b\$10\$ECv7m.OJlM1saJphfQ50mO78lLVlcLUTMYd0gfCpKSrXUVpLMgd2q'
WHERE email IN ('surya@sprintflow.com','a.pasam@ajacs.in','s.lakkampally@ajacs.in','nikitha@ajacs.in','s.posanapally@ajacs.in');
"
```

Now all seeded users have the password **`Admin@123`**.  
(Also, `trainer@example.com` created earlier has password `password123`.)

---

## 6. Logging In

Open **http://localhost** and use any of these credentials:

| Email                          | Password   | Role      |
|--------------------------------|------------|-----------|
| surya@sprintflow.com           | Admin@123  | MANAGER   |
| a.pasam@ajacs.in               | Admin@123  | MANAGER   |
| s.lakkampally@ajacs.in         | Admin@123  | HR        |
| nikitha@ajacs.in               | Admin@123  | HR        |
| s.posanapally@ajacs.in         | Admin@123  | TRAINER   |
| trainer@example.com            | password123| TRAINER   |

---

## 7. Exposing the Application to Other Devices on the Same Wi‑Fi

To let colleagues access the app from their browsers, we changed the `.env` file to use the laptop’s local IP address.

### 7.1 Find your laptop’s IP

```bash
hostname -I | awk '{print $1}'
```

Example: `10.10.11.172`

### 7.2 Update `.env`

```ini
APP_CORS_ORIGINS=http://10.10.11.172
APP_FRONTEND_URL=http://10.10.11.172
VITE_API_BASE_URL=http://10.10.11.172:8080/api
VITE_WS_URL=ws://10.10.11.172:8080/ws
```

### 7.3 Rebuild the frontend (bakes the new URL into the static files)

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

### 7.4 Open firewall ports (Fedora)

```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### 7.5 Share the URL

Others on the same Wi‑Fi can now open **http://10.10.11.172** and log in with the same credentials.

---

## 8. Stopping the Application and Closing Ports

### 8.1 Stop all containers

```bash
docker compose down
```

### 8.2 Close the firewall ports (if you no longer need external access)

```bash
sudo firewall-cmd --permanent --remove-port=80/tcp
sudo firewall-cmd --permanent --remove-port=8080/tcp
sudo firewall-cmd --reload
```

To keep the application running but only accessible from your own laptop, revert `.env` back to `localhost` and rebuild the frontend.

---

## 9. Git Workflow – Pushing Changes to a New Branch

We created a new branch `feature/local-setup` to keep the main branch clean.

```bash
git checkout -b feature/local-setup
git add backend/schema.sql backend/seed*.sql backend/Dockerfile
git add docker-compose.yml fedora.sh .gitignore
git add frontend/
git commit -m "Add full schema, seed data, Docker fixes, and Fedora setup script"
git push -u origin feature/local-setup
```

**Never push `.env` or `docker/ssl/` to GitHub.**

---

## 10. Troubleshooting Common Issues

| Problem | Solution |
|---------|----------|
| `curl: (7) Failed to connect to localhost port 8080` | Ensure backend container has `ports: - "8080:8080"` in docker-compose.yml. |
| Login returns `Invalid credentials` | Check that the password hash matches the encoder strength (10). Regenerate hash with `bcrypt.gensalt(10)`. |
| Frontend loads but API calls fail (network error) | Rebuild frontend after updating `VITE_API_BASE_URL` in `.env`. |
| `docker: permission denied` | Add user to docker group and log out/in, or run with `sudo`. |
| MySQL `Access denied` for root | Retrieve root password from `.env` (`MYSQL_ROOT_PASSWORD`). |
| Firewall still blocking | Temporarily disable with `sudo systemctl stop firewalld` to test, then re-enable. |

---

## 11. Summary of Key Commands

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# Rebuild frontend after .env change
docker compose build --no-cache frontend && docker compose up -d frontend

# View logs
docker compose logs -f

# Enter MySQL container
docker exec -it sprintflow-mysql mysql -uroot -p<password>

# Insert a new user (example)
docker exec -it sprintflow-mysql mysql -uroot -p<password> -e "
USE sprintflow_db;
INSERT INTO users (name, email, password, role, status) VALUES ('John Doe','john@example.com','\$2b\$10\$...','MANAGER','Active');
"
```

---

## 12. Final Notes

- The application is now fully functional on your Fedora laptop with realistic demo data.
- All database schema and seed scripts are version‑controlled.
- You can share the application with your team by following Section 7.
- For any further changes (e.g., modifying the frontend or backend), rebuild the respective container with `docker compose up -d --build`.

**Enjoy using SprintFlow HRMS!**
