#!/bin/bash

# ============================================
# Development Startup Script
# One command to start everything
# ============================================

set -e

echo "🚀 Starting E-Commerce Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose is not installed."
    exit 1
fi

# Use docker compose (newer) or docker-compose (older)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "📦 Building images (if needed)..."
$COMPOSE_CMD build

echo ""
echo "🔧 Starting services..."
$COMPOSE_CMD up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Wait for MongoDB
echo "  - Waiting for MongoDB..."
until $COMPOSE_CMD exec -T mongodb mongosh --quiet --eval "db.runCommand('ping')" > /dev/null 2>&1; do
    sleep 2
done
echo "  ✅ MongoDB is ready"

# Wait for Redis
echo "  - Waiting for Redis..."
until $COMPOSE_CMD exec -T redis redis-cli ping > /dev/null 2>&1; do
    sleep 2
done
echo "  ✅ Redis is ready"

# Wait for Backend
echo "  - Waiting for Backend..."
until curl -s http://localhost:5000/api/v1/health > /dev/null 2>&1; do
    sleep 2
done
echo "  ✅ Backend is ready"

# Wait for Frontend
echo "  - Waiting for Frontend..."
until curl -s http://localhost:3000 > /dev/null 2>&1; do
    sleep 2
done
echo "  ✅ Frontend is ready"

echo ""
echo "✨ All services are running!"
echo ""
echo "📍 Access your application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo "   MongoDB:   localhost:27017"
echo "   Redis:     localhost:6379"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""



