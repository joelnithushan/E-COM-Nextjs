#!/bin/bash

# ============================================
# Development Shutdown Script
# ============================================

echo "🛑 Stopping E-Commerce Development Environment..."

# Use docker compose (newer) or docker-compose (older)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD down

echo ""
echo "✅ All services stopped"
echo ""
echo "💡 To remove volumes (clean database):"
echo "   docker-compose down -v"
echo ""



