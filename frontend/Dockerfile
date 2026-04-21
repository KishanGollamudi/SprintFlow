# ── Stage 1: Build React app ──────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (cached layer — only re-runs if package.json changes)
COPY package.json package-lock.json ./
RUN npm ci --silent

# Inject the backend URL at build time
# Passed via: docker-compose build --build-arg VITE_API_BASE_URL=...
ARG VITE_API_BASE_URL=http://localhost/api
ARG VITE_WS_URL=http://localhost
ARG VITE_USE_MOCK=false

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_USE_MOCK=$VITE_USE_MOCK

COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Remove default Nginx static files
RUN rm -rf ./*

# Copy built React app
COPY --from=build /app/dist .

# Copy Nginx config (handles SPA routing + API proxy + HTTP only)
COPY nginx-simple.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
