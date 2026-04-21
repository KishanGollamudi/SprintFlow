# SprintFlow Deployment Guide

## Repository Structure

SprintFlow consists of two repositories that work together:

- **Backend**: `sprintflow-backend` (Spring Boot + MySQL)
- **Frontend**: `sprintflow-frontend` (React + Nginx)

## Quick Setup

### 1. Clone Both Repositories

```bash
# Clone backend
git clone https://github.com/chaitanya-asu/sprintflow-backend.git
cd sprintflow-backend

# Clone frontend (in parent directory)
cd ..
git clone https://github.com/chaitanya-asu/sprintflow-frontend.git
```

**Directory structure should be:**
```
project-folder/
├── sprintflow-backend/
└── sprintflow-frontend/
```

### 2. Configure Environment

```bash
cd sprintflow-backend
cp .env.example .env
nano .env  # Fill in all values
```

**Required environment variables:**
- `APP_JWT_SECRET` - 64 hex characters (generate: `openssl rand -hex 32`)
- `APP_MAIL_KEY` - 32 hex characters (generate: `openssl rand -hex 16`)
- `APP_CORS_ORIGINS` - Your server's public URL
- `FRONTEND_PATH` - Path to frontend repo (default: `../sprintflow-frontend`)

### 3. Deploy with Docker

```bash
# From sprintflow-backend directory
docker-compose up -d --build
```

## Repository Status

### Backend Repository ✅
- **Branch**: `feature/java21`
- **Status**: All deployment files committed and pushed
- **Key Files**:
  - `docker-compose.yml` - Multi-container orchestration
  - `Dockerfile` - Spring Boot container
  - `.env.example` - Environment template
  - `docker/init/` - Database initialization scripts
  - `deploy.bat` / `deploy.sh` - Deployment scripts

### Frontend Repository ✅
- **Branch**: `develop`
- **Status**: All fixes committed and pushed
- **Key Files**:
  - `Dockerfile` - React build + Nginx container
  - `nginx-simple.conf` - Nginx configuration
  - Enhanced notification system
  - Fixed TimePicker components

## Recent Updates

### Backend
- ✅ Soft delete functionality for Sprint entity
- ✅ Complete Docker deployment setup
- ✅ Database initialization with 5 sprints + students
- ✅ Flexible frontend path configuration

### Frontend
- ✅ Enhanced notification persistence fix
- ✅ TimePicker components in HR edit modal
- ✅ Dual confirmation system (WebSocket + HTTP API)
- ✅ Read timestamp tracking with 5-minute grace period

## Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MySQL 8.0     │    │  Spring Boot     │    │  React + Nginx  │
│   Port: 3306    │◄───┤  Port: 8080      │◄───┤  Port: 80       │
│   (internal)    │    │  (internal)      │    │  (public)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Verification

After deployment, verify:

1. **Application**: http://localhost
2. **API Health**: http://localhost/api/health
3. **Database**: MySQL running with sprintflow_db
4. **Containers**: All 3 containers running

## Troubleshooting

### Common Issues

1. **Port conflicts**: Run `check-ports.bat` before deployment
2. **SSL issues**: Use HTTP-only mode initially
3. **Frontend path**: Ensure `FRONTEND_PATH` points to correct directory
4. **Database**: Check MySQL container logs if backend fails to start

### Logs

```bash
# View all container logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
```

## Production Deployment

For production deployment:

1. Set proper domain in environment variables
2. Enable SSL certificates
3. Use production database credentials
4. Set `SWAGGER_ENABLED=false`
5. Configure proper CORS origins

## Support

Both repositories are now fully synchronized with all deployment files and recent bug fixes. The system includes:

- Enhanced notification system
- Fixed TimePicker components
- Soft delete functionality
- Complete Docker deployment setup
- Comprehensive documentation

All changes have been committed and pushed to their respective repositories.