# E-Commerce Platform

A production-ready single-vendor e-commerce platform built with Next.js, Express, MongoDB, and Stripe.

## 🚀 Quick Deploy

See [QUICK_START.md](./QUICK_START.md) for a 5-minute deployment guide.

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment checklist
- [SECURITY.md](./SECURITY.md) - Security best practices
- [CLOUDINARY_INTEGRATION.md](./CLOUDINARY_INTEGRATION.md) - Image upload integration
- [QUICK_START.md](./QUICK_START.md) - Quick start guide

## 🏗️ Architecture

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Authentication:** JWT (access + refresh tokens)
- **Payments:** Stripe
- **Image Storage:** Cloudinary
- **Hosting:** Vercel (frontend), Render (backend)

## ✨ Features

- User authentication (register, login, JWT)
- Product catalog with categories
- Shopping cart
- Checkout with Stripe payments
- Order management
- Admin dashboard
- Image uploads (Cloudinary)
- Responsive design
- SEO-friendly

## 🔧 Development

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Stripe account
- Cloudinary account

### Setup

1. Clone repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Configure environment variables:
   - Backend: Copy `backend/env.example` to `backend/.env`
   - Frontend: Copy `frontend/env.example` to `frontend/.env.local`

4. Start development servers:
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend
   cd frontend && npm run dev
   ```

## 📦 Production Deployment

### Backend (Render)

1. Connect GitHub repository
2. Set root directory to `backend`
3. Configure environment variables (see `backend/env.example`)
4. Deploy

### Frontend (Vercel)

1. Import GitHub repository
2. Set root directory to `frontend`
3. Configure environment variables (see `frontend/env.example`)
4. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🔒 Security

- JWT-based authentication
- Secure password hashing (bcrypt)
- Rate limiting
- CORS protection
- Security headers (Helmet)
- Input validation
- Secure cookie configuration

See [SECURITY.md](./SECURITY.md) for complete security documentation.

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues and questions, please open an issue on GitHub.

Single-vendor e-commerce platform built with Next.js and Express.js.

## Tech Stack

- Frontend: Next.js 14+ (App Router), React, Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB (Mongoose)
- Payments: Stripe
- Images: Cloudinary

## Getting Started

Coming soon...
