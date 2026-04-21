#!/bin/bash

# SprintFlow Production Deployment Script
# Run this on your production server

set -e  # Exit on any error

echo "========================================="
echo "SprintFlow Production Deployment"
echo "========================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "ERROR: Do not run this script as root for security reasons"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "ERROR: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please copy .env.production to .env and fill in your actual values:"
    echo "  cp .env.production .env"
    echo "  nano .env  # Edit with your actual secrets"
    exit 1
fi

# Validate required environment variables
echo "Validating environment configuration..."
source .env

required_vars=(
    "MYSQL_ROOT_PASSWORD"
    "DB_USERNAME" 
    "DB_PASSWORD"
    "APP_JWT_SECRET"
    "APP_MAIL_KEY"
    "APP_FRONTEND_URL"
    "APP_CORS_ORIGINS"
    "VITE_API_BASE_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"REPLACE_WITH"* ]]; then
        echo "ERROR: $var is not set or contains placeholder value"
        echo "Please update your .env file with actual values"
        exit 1
    fi
done

# Validate JWT secret length (should be 64 hex chars)
if [ ${#APP_JWT_SECRET} -ne 64 ]; then
    echo "ERROR: APP_JWT_SECRET must be exactly 64 characters (256 bits)"
    echo "Generate with: openssl rand -hex 32"
    exit 1
fi

# Validate mail key length (should be 32 hex chars)
if [ ${#APP_MAIL_KEY} -ne 32 ]; then
    echo "ERROR: APP_MAIL_KEY must be exactly 32 characters (128 bits)"
    echo "Generate with: openssl rand -hex 16"
    exit 1
fi

echo "✓ Environment validation passed"

# Create SSL directory if it doesn't exist
mkdir -p docker/ssl

# Check if SSL certificates exist
if [ ! -f docker/ssl/server.crt ] || [ ! -f docker/ssl/server.key ]; then
    echo "WARNING: SSL certificates not found in docker/ssl/"
    echo "Generating self-signed certificates for testing..."
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/ssl/server.key \
        -out docker/ssl/server.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    echo "✓ Self-signed certificates generated"
    echo "  For production, replace with proper SSL certificates"
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Pull latest images
echo "Pulling latest base images..."
docker-compose pull

# Build and start services
echo "Building and starting services..."
docker-compose up -d --build

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 30

# Check service health
echo "Checking service health..."
if docker-compose ps | grep -q "unhealthy\|Exit"; then
    echo "ERROR: Some services failed to start properly"
    docker-compose logs
    exit 1
fi

echo "========================================="
echo "✓ Deployment completed successfully!"
echo "========================================="
echo ""
echo "Services running:"
docker-compose ps

echo ""
echo "Access your application:"
echo "  HTTP:  http://$(hostname -I | awk '{print $1}')"
echo "  HTTPS: https://$(hostname -I | awk '{print $1}')"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"
echo ""
echo "IMPORTANT: Update your domain DNS to point to this server's IP"