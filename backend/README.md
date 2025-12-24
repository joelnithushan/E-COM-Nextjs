# E-Commerce Backend API

Backend API for single-vendor e-commerce platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- MongoDB connection string
- JWT secret (use a strong random string)
- Frontend URL for CORS

4. Start development server:
```bash
npm run dev
```

5. Start production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user (protected)

## Environment Variables

See `.env.example` for required variables.

