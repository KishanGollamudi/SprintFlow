#!/bin/bash
# ─────────────────────────────────────────────────────────────
# SprintFlow — Redeploy Script
# Run this whenever you push new code and want to update the server.
#
# Usage:
#   chmod +x redeploy.sh
#   ./redeploy.sh
# ─────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}▶ $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }

info "Pulling latest code..."
git pull origin main 2>/dev/null || git pull origin develop 2>/dev/null || git pull

info "Pulling latest code for frontend subdir..."
# If frontend is a separate repo cloned inside the project
if [ -d "sprintflow-frontend" ]; then
    cd sprintflow-frontend && git pull && cd ..
fi

info "Rebuilding changed images..."
docker compose build

info "Restarting containers with zero-downtime..."
# Restart backend and frontend (MySQL data is preserved in volume)
docker compose up -d --no-deps backend
docker compose up -d --no-deps frontend

success "Redeploy complete!"
echo ""
docker compose ps
