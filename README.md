# ServiceVerse Platform

A comprehensive multi-utility SaaS platform for service providers. Starting with Laundry utility, expandable to Cobbler, Raddi Wala, and more.

## 📋 Project Overview

ServiceVerse is a sophisticated platform connecting:
- **SuperAdmins**: Platform management and configuration
- **AccountManagers**: ServiceProvider onboarding and portfolio management
- **ServiceProviders**: Service delivery and customer management
- **Coworkers**: Order fulfillment and service execution
- **Customers**: Service discovery and order placement

### Key Features
- Multi-tenant architecture with strict data isolation
- Dual payment modes (Payment Gateway + Direct QR)
- Real-time order management and tracking
- Commission tracking and reporting
- Analytics and insights dashboard
- Push notifications and email integration
- Progressive Web App (PWA) support
- Mobile app ready (iOS/Android via Capacitor)

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 18 + TypeScript
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- Firebase SDK for backend integration
- Capacitor for mobile support

**Backend**
- Firebase Cloud Functions (Node.js)
- Firestore for data storage
- Firebase Authentication
- Firebase Cloud Messaging for push notifications

**Infrastructure**
- Firebase for backend services
- Vercel for frontend hosting
- Razorpay for payments
- Resend for email notifications

## 📂 Project Structure

```
serviceverse/
├── frontend/              # React SPA + PWA
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Cloud Functions
│   ├── functions/src/
│   ├── firestore-rules/
│   └── package.json
├── mobile/               # Capacitor config
├── docs/                 # Documentation
├── SERVICEVERSE_ARCHITECTURE.md
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### 1. Clone & Setup

```bash
# Navigate to frontend
cd frontend
npm install

# Navigate to backend
cd ../backend/functions
npm install
```

### 2. Configure Firebase

```bash
# Login to Firebase
firebase login

# Create .env.local in frontend/
cp .env.example .env.local

# Add your Firebase credentials
# Also configure backend/.env
```

### 3. Start Development

This project connects directly to Cloud Firebase — no local emulators are used.

```bash
# Deploy backend functions to Firebase Cloud (from backend/functions/)
npm run deploy

# Start frontend (from frontend/)
npm run dev

# Frontend: http://localhost:5173
# Backend: https://us-central1-<project-id>.cloudfunctions.net/api
```

## 📚 Documentation

- [Architecture Document](./SERVICEVERSE_ARCHITECTURE.md) - Complete system design
- [Frontend README](./frontend/README.md) - Frontend setup & development
- [Backend Guide](./backend/functions/README.md) - Cloud Functions guide
- [API Reference](./docs/API_REFERENCE.md) - API endpoint documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment

## 🔐 Security

- Firebase Security Rules enforce multi-tenant isolation
- Role-based access control (RBAC)
- Encrypted sensitive data
- CORS protection
- Rate limiting on API endpoints

## 💳 Payment Integration

Supports two payment modes:

1. **Payment Gateway (Razorpay)**
   - Used when GST is applicable
   - Commission automatically deducted
   - Settlement to ServiceProvider's bank account

2. **Direct QR (UPI)**
   - Used for cash transactions without GST
   - Manual confirmation of payment
   - Commission tracked as "DUE"

## 📊 Analytics & Reporting

- Real-time order metrics
- Revenue tracking by ServiceProvider
- Commission reconciliation
- Customer retention rates
- Peak order time analysis

## 🔔 Notifications

- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Email Notifications**: Resend
- Configurable notification templates
- Theme-aware branding

## 📱 Mobile App

Built with Capacitor for cross-platform support:

```bash
# From frontend/
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel deploy
```

### Backend (Firebase)
```bash
cd backend/functions
npm run build
firebase deploy --only functions
```

## 🧪 Testing

```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend/functions
npm run test
```

## 📈 Development Phases

### Phase 1 ✅
- SuperAdmin: Services, Menu items, Commission setup
- Database schema & security rules

### Phase 2 (In Progress)
- AccountManager: ServiceProvider onboarding
- ServiceProvider: Profile & menu management

### Phase 3 (Next)
- Customer: Order creation and management
- Payment integration
- Notifications

### Phase 4 (Future)
- Analytics dashboard
- Reporting engine
- Mobile app optimization

## 🤝 Contributing

1. Feature branches from `main`
2. Follow TypeScript best practices
3. Write tests for new features
4. Update documentation
5. Submit pull request

## 📞 Support

For issues, questions, or feature requests, contact the development team.

## 📄 License

This project is private and confidential. Unauthorized copying or distribution is prohibited.

---

**Last Updated**: January 2025  
**Status**: Active Development  
**Version**: 1.0.0-beta
