# ============================================
# Makefile for Docker Operations
# Simplifies common Docker commands
# ============================================

.PHONY: help build up down logs restart clean

# Default target
help:
	@echo "Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev        - Start development environment (hot reload)"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make logs       - View logs"
	@echo "  make restart    - Restart all services"
	@echo "  make clean      - Remove all containers and volumes"
	@echo ""
	@echo "Building:"
	@echo "  make build      - Build all Docker images"
	@echo "  make build-backend  - Build backend image"
	@echo "  make build-frontend - Build frontend image"
	@echo ""
	@echo "Production:"
	@echo "  make prod-build - Build production images"
	@echo "  make prod-up    - Start production stack"
	@echo "  make prod-down  - Stop production stack"
	@echo ""
	@echo "Utilities:"
	@echo "  make shell-backend  - Access backend container shell"
	@echo "  make shell-frontend - Access frontend container shell"
	@echo "  make mongo-shell   - Access MongoDB shell"
	@echo "  make redis-cli     - Access Redis CLI"

# Development commands
dev:
	docker-compose up

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	docker-compose down -v
	docker system prune -f

# Container access
shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

mongo-shell:
	docker-compose exec mongodb mongosh -u admin -p password123

redis-cli:
	docker-compose exec redis redis-cli

# Production commands
prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Individual service commands
backend-logs:
	docker-compose logs -f backend

frontend-logs:
	docker-compose logs -f frontend

# Build individual services
build-backend:
	docker build -t ecommerce-backend:latest ./backend

build-frontend:
	docker build -t ecommerce-frontend:latest ./frontend

# Development with hot reload
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

