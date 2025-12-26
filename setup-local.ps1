# Local Development Setup Script
# This script sets up the local development environment

Write-Host "=== Setting up Local Development Environment ===" -ForegroundColor Cyan
Write-Host ""

# Check if backend .env exists
$backendEnv = "backend\.env"
if (-not (Test-Path $backendEnv)) {
    Write-Host "Creating backend/.env file..." -ForegroundColor Yellow
    @"
# Local Development Environment Variables
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Database Configuration (Local MongoDB)
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT Configuration (Local dev secret - change in production)
JWT_SECRET=local_development_jwt_secret_key_min_32_characters_long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cookie Configuration
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# Stripe Configuration (Use test keys or leave empty for local dev)
STRIPE_SECRET_KEY=sk_test_mock_key_for_local_development
STRIPE_WEBHOOK_SECRET=whsec_mock_secret_for_local_development

# Cloudinary Configuration (Leave empty for local dev - image uploads won't work)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Sentry (Optional - leave empty for local dev)
SENTRY_DSN=

# Logging
LOG_LEVEL=debug
ENABLE_FILE_LOGGING=false
"@ | Out-File -FilePath $backendEnv -Encoding utf8
    Write-Host "✓ Created backend/.env" -ForegroundColor Green
} else {
    Write-Host "✓ backend/.env already exists" -ForegroundColor Green
}

# Check if frontend .env.local exists
$frontendEnv = "frontend\.env.local"
if (-not (Test-Path $frontendEnv)) {
    Write-Host "Creating frontend/.env.local file..." -ForegroundColor Yellow
    @"
# Local Development Environment Variables
NODE_ENV=development

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_VERSION=v1

# Stripe Configuration (Use test publishable key or leave empty)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_mock_key_for_local_development

# Frontend URL
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Cloudinary (Leave empty for local dev)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

# Sentry (Optional - leave empty for local dev)
NEXT_PUBLIC_SENTRY_DSN=

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=false
NEXT_PUBLIC_DEBUG_MODE=true
"@ | Out-File -FilePath $frontendEnv -Encoding utf8
    Write-Host "✓ Created frontend/.env.local" -ForegroundColor Green
} else {
    Write-Host "✓ frontend/.env.local already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Checking Dependencies ===" -ForegroundColor Cyan

# Check backend dependencies
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Backend dependencies already installed" -ForegroundColor Green
}

# Check frontend dependencies
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure MongoDB is running on localhost:27017" -ForegroundColor White
Write-Host "   - If not installed, download from: https://www.mongodb.com/try/download/community" -ForegroundColor White
Write-Host "   - Or use MongoDB Atlas (free): https://www.mongodb.com/cloud/atlas" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Start the frontend server (in a new terminal):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Open your browser:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "   Backend API: http://localhost:5000/api/v1/health" -ForegroundColor Green
Write-Host ""
