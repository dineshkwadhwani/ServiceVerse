# Backend Setup Guide - ServiceVerse Cloud Functions

This guide covers setting up the ServiceVerse Node.js backend to connect directly to Firebase (no emulator).

---

## ✅ Setup Status

- ✅ Node.js project configured (v20+)
- ✅ TypeScript build system set up
- ✅ Firebase Admin SDK initialized
- ✅ Direct Firebase connection (no emulator)
- ✅ Service account credentials configured
- ✅ All tests passing

---

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js v20+** - Check with `node --version`
- **npm** - Usually comes with Node.js
- **Firebase Service Account JSON** - Located in project root as `firebase-service-account.json`
- **Firebase CLI** (optional) - For deployment - Install with `npm install -g firebase-tools`

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend/functions
npm install
```

### 2. Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `lib/` directory.

### 3. Test Firebase Connection

```bash
npm run test:firebase
```

Expected output:
```
🎉 All Firebase Connection Tests PASSED!

✨ Your project is ready to use Firebase directly!
   • No emulator needed
   • Direct connection to: serviceverse-dev-fa38e
   • Ready for development
```

---

## 📁 Project Structure

```
backend/functions/
├── src/
│   ├── index.ts              # Main Cloud Functions entry point
│   ├── handlers/             # API endpoint handlers
│   │   ├── auth/
│   │   ├── customers/
│   │   ├── serviceProviders/
│   │   ├── accountManagers/
│   │   ├── superAdmin/
│   │   ├── services/
│   │   ├── phase2/
│   │   ├── phase3/
│   │   └── admin/
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts          # JWT verification
│   │   └── errorHandler.ts  # Error handling
│   └── utils/               # Utilities
│       ├── firebase.ts      # Firebase initialization
│       └── logger.ts        # Logging
├── lib/                      # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json            # TypeScript configuration
├── .env                     # Environment variables
└── test-firebase-connection.js  # Firebase connection test
```

---

## 🔧 Configuration Files

### `.env` (Environment Variables)

Located at `backend/functions/.env`

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Resend Configuration
RESEND_API_KEY=your_resend_api_key

# App Configuration
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# SuperAdmin Seed
SEED_ADMIN_EMAIL=dinesh.k.wadhwani@gmail.com
SEED_ADMIN_PHONE=9767676738
SEED_ADMIN_SECRET=your-super-secret-seed-key
```

### `firebase-service-account.json` (Project Root)

This file contains your Firebase service account credentials. **NEVER commit this to git.**

It's already in `.gitignore` to prevent accidental commits.

### `tsconfig.json` (TypeScript Configuration)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./lib",      // Compiled output
    "rootDir": "./src",     // Source directory
    "strict": true,         // Strict type checking
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]      // Path aliases
    }
  }
}
```

---

## 📦 NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Watch mode - recompile on file changes |
| `npm run start` | Run the compiled functions locally |
| `npm run test:firebase` | Test Firebase connection |
| `npm run deploy` | Deploy to Firebase Cloud Functions |
| `npm run logs` | View Cloud Function logs |
| `npm run clean` | Remove compiled lib/ directory |

---

## 🔗 Firebase Integration

### How It Works

1. **Service Account Authentication**
   - Uses `firebase-service-account.json` from project root
   - Loaded automatically by Firebase Admin SDK
   - Grants full access to Firestore, Auth, Storage, etc.

2. **Direct Connection (No Emulator)**
   - Connects directly to `serviceverse-dev-fa38e` Firebase project
   - Real-time operations on live database
   - Perfect for development and testing

3. **Environment**
   - Node.js 20 runtime
   - CommonJS modules
   - Cloud Functions compatible

### Firebase Admin SDK

Initialized in `src/utils/firebase.ts`:

```typescript
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const messaging = admin.messaging();
```

---

## 🧪 Testing

### Firebase Connection Test

```bash
npm run test:firebase
```

Tests:
- ✅ Service account loads correctly
- ✅ Firebase Admin initializes
- ✅ Firestore connection works
- ✅ Collections are accessible
- ✅ Server timestamps available
- ✅ Auth capabilities ready

### Expected Output

```
✅ Service account JSON loaded successfully
✅ Firebase Admin initialized
✅ Firestore connected - Retrieved 1 documents
✅ Services collection accessible - 1 services found
✅ Server timestamp available
✅ Firebase Auth initialized and ready

🎉 All Firebase Connection Tests PASSED!
```

---

## 🚀 Development Workflow

### 1. Development Mode

For active development, use watch mode:

```bash
npm run dev
```

This runs `tsc --watch` which recompiles on file changes.

### 2. Build & Run Locally

```bash
# Build
npm run build

# Run locally (Node.js only, not Cloud Functions)
npm run start
```

**Note:** This runs the compiled code as a Node.js process, not as Cloud Functions. For full Cloud Functions testing, use Firebase emulator or deploy.

### 3. Deploy to Firebase

```bash
npm run deploy
```

Deploys functions to Firebase Cloud Functions at:
```
https://us-central1-serviceverse-dev-fa38e.cloudfunctions.net/api
```

### 4. View Logs

```bash
npm run logs
```

Streams real-time logs from deployed Cloud Functions.

---

## 🔐 Environment & Credentials

### Sensitive Files (Already in .gitignore)

- ❌ `.env` - Never commit
- ❌ `firebase-service-account.json` - Never commit
- ❌ `lib/` - Generated files
- ❌ `node_modules/` - Dependencies

### Safe to Commit

- ✅ `.env.example` - Template
- ✅ `tsconfig.json` - Configuration
- ✅ `src/` - Source code
- ✅ `package.json` - Dependencies list

---

## 📊 Available Collections in Firestore

Your Firebase project has the following collections:

| Collection | Purpose |
|-----------|---------|
| `users` | All user accounts (SuperAdmin, AM, SP, Customer, Coworker) |
| `services` | Service definitions (Laundry, etc.) |
| `orders` | Customer orders |
| `payments` | Payment records |
| `commissions` | Commission tracking |
| `notifications` | Notification history |

---

## 🛠️ Troubleshooting

### Issue: Build Fails

```bash
# Clear and rebuild
npm run clean
npm run build
```

### Issue: Firebase Connection Test Fails

Check:
1. Service account file exists: `firebase-service-account.json`
2. File is in project root, not in `backend/functions/`
3. Credentials are valid
4. Internet connection is stable

```bash
# Verify path
ls -la firebase-service-account.json
```

### Issue: TypeScript Errors

```bash
# Check TypeScript version
npm list typescript

# Update if needed
npm install --save-dev typescript@latest
```

### Issue: Cannot Find Module Errors

```bash
# Rebuild with aliases
npm run build
```

The build process uses `tsc-alias` to resolve path aliases like `@/`.

---

## 📚 API Documentation

### Implemented Endpoints

**Authentication**
- `POST /auth/send-email-otp` - Send email OTP
- `POST /auth/verify-email-otp` - Verify email OTP
- `POST /auth/send-phone-otp` - Send phone OTP
- `POST /auth/verify-phone-otp` - Verify phone OTP
- `POST /auth/register-customer` - Register customer
- `POST /auth/register-sp` - Register service provider

**Services**
- `GET /services` - Get all services
- `GET /services/:serviceId` - Get service details
- `POST /services` - Create service (admin)
- `PUT /services/:serviceId` - Update service
- `PATCH /services/:serviceId/status` - Toggle service status

**Dashboards**
- `GET /customers/services` - Customer services
- `GET /service-providers/customers` - SP customers
- `GET /account-managers/unorphan-requests` - AM requests
- `GET /superadmin/stats` - SuperAdmin stats

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] All tests passing: `npm run test:firebase`
- [ ] Build successful: `npm run build`
- [ ] No TypeScript errors: `npm run build` (strict mode)
- [ ] Environment variables configured
- [ ] `.env` file not committed to git
- [ ] Service account credentials are secure
- [ ] CORS_ORIGIN set to production domain
- [ ] NODE_ENV set to `production`

### Deploy Command

```bash
npm run deploy
```

---

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review `src/utils/logger.ts` for logging setup
3. Check Firebase Cloud Functions logs: `npm run logs`
4. Refer to main project CLAUDE.md for architecture details

---

## 🎯 Next Steps

1. ✅ Backend is fully set up and connected to Firebase
2. **Next**: Implement order management endpoints
3. **Then**: Set up payment integration (Razorpay)
4. **Then**: Add push notifications (Firebase Cloud Messaging)

---

**Last Updated**: July 12, 2026  
**Project**: ServiceVerse  
**Status**: Ready for Development ✅
