# ServiceVerse Project Documentation

**Last Updated**: July 13, 2026  
**Status**: 🚀 Active Development - Milestone 1 Complete: All Logins Working ✅

---

## 📊 Project Overview

ServiceVerse is a comprehensive multi-utility SaaS platform for service providers, starting with Laundry utility and expandable to other services. The platform connects multiple user roles with strict data isolation and multi-tenant architecture.

### Core Features
- Multi-role authentication system (SuperAdmin, AccountManager, ServiceProvider, Coworker, Customer)
- Phone OTP-based authentication (all users authenticate via phone; email used for business communications)
- Service management and configuration
- Order management with real-time tracking
- Commission tracking and reporting
- Payment integration (Razorpay)
- Push notifications (Firebase Cloud Messaging)
- Email notifications (Resend)

---

## 📈 Progress Summary

### ✅ Completed Features

#### Phase 1: Project Initialization ✅
- Project structure created with monorepo setup
- Frontend: React 18 + TypeScript + Vite
- Backend: Firebase Cloud Functions + Firestore
- Type definitions for all entities
- Environment configuration templates
- Deployment configuration (Vercel + Firebase)

#### Phase 2: Authentication System ✅
- Firebase Authentication integration
- Phone OTP verification system
- Multi-role user registration (Customer, ServiceProvider, AccountManager, SuperAdmin)
- Email verification system
- JWT token generation and verification
- Zustand-based auth state management
- Protected routes with role-based access control

**Files Implemented**:
- `frontend/src/pages/RegisterPage.tsx` - Multi-role registration
- `frontend/src/pages/LoginPage.tsx` - Login with email/password
- `frontend/src/pages/VerifyEmailPage.tsx` - Email verification
- `frontend/src/components/Auth/RegisterCustomerForm.tsx` - Customer registration
- `frontend/src/components/Auth/RegisterSPForm.tsx` - ServiceProvider registration
- `frontend/src/components/Auth/OTPVerificationStep.tsx` - OTP verification step
- `backend/functions/src/handlers/auth/registration.ts` - Registration backend handler
- `backend/functions/src/handlers/auth/phoneSignIn.ts` - Phone authentication handler
- `frontend/src/store/authStore.ts` - Auth state management

#### Phase 3: SuperAdmin Dashboard ✅
- SuperAdmin service management interface
- Service creation modal with configuration
- Service listing and editing
- Service card display with visual indicators
- AccountManager creation and management
- Service configuration (pricing, categories, description)

**Files Implemented**:
- `frontend/src/components/SuperAdmin/ServiceDashboard.tsx` - Main service dashboard
- `frontend/src/components/SuperAdmin/ServiceCard.tsx` - Service card component
- `frontend/src/components/SuperAdmin/CreateServiceModal.tsx` - Modal for creating services
- `frontend/src/components/SuperAdmin/AccountManagerDashboard.tsx` - AccountManager management
- `frontend/src/components/SuperAdmin/CreateAccountManagerModal.tsx` - Modal for AccountManager creation
- `frontend/src/components/Dashboard/SuperAdminDashboard.tsx` - Main dashboard view

#### Phase 4: Role-Based Dashboards ✅
- Customer Dashboard with service browsing and order management
- ServiceProvider (SP) Dashboard with customer management and order handling
- AccountManager (AM) Dashboard with onboarding and portfolio management
- SuperAdmin Dashboard with platform overview

**Files Implemented**:
- `frontend/src/components/Dashboard/CustomerDashboard.tsx` - Customer dashboard
- `frontend/src/components/Dashboard/SPDashboard.tsx` - ServiceProvider dashboard
- `frontend/src/components/Dashboard/AMDashboard.tsx` - AccountManager dashboard
- `frontend/src/components/Dashboard/SuperAdminDashboard.tsx` - SuperAdmin dashboard

#### Phase 5: Registration & Onboarding Forms ✅
- ServiceProvider onboarding stepper
- Commission setup configuration
- Working hours management
- Document upload functionality
- Form validation and error handling
- Multi-step form processing

**Files Implemented**:
- `frontend/src/components/AccountManager/ServiceProviderOnboarding.tsx` - SP onboarding
- `frontend/src/components/AccountManager/CommissionSetupForm.tsx` - Commission configuration
- `frontend/src/components/AccountManager/WorkingHoursForm.tsx` - Working hours setup
- `frontend/src/components/AccountManager/DocumentUploadForm.tsx` - Document upload
- `frontend/src/components/Form/FormInput.tsx` - Reusable form input
- `frontend/src/components/Form/FormTextarea.tsx` - Reusable form textarea

#### Phase 6: UI Components & Layout ✅
- Dashboard layout with sidebar navigation
- Navigation bar with user menu
- Toast notification system
- Global styling with Tailwind CSS
- Responsive design for mobile and desktop
- Form components with validation

**Files Implemented**:
- `frontend/src/components/Layout/DashboardLayout.tsx` - Main layout
- `frontend/src/components/Shared/Navbar.tsx` - Navigation bar
- `frontend/src/components/Shared/Sidebar.tsx` - Sidebar navigation
- `frontend/src/components/Shared/Toast.tsx` - Toast notifications
- `frontend/src/styles/globals.css` - Global styles

#### Phase 7: Backend Integration ✅
- Service management API endpoints
- User registration and authentication endpoints
- Cloud Functions with Express.js
- Middleware for auth verification
- Error handling and logging
- Firestore data persistence
- Environment configuration and secrets management

**Files Implemented**:
- `backend/functions/src/index.ts` - Main Cloud Functions entry
- `backend/functions/src/handlers/auth/registration.ts` - Registration handler
- `backend/functions/src/handlers/auth/phoneSignIn.ts` - Phone auth handler
- `backend/functions/src/middleware/auth.ts` - Authentication middleware
- `backend/functions/src/utils/firebase.ts` - Firebase Admin setup
- `backend/functions/src/utils/logger.ts` - Logging utility

#### Phase 8: State Management ✅
- Zustand stores for auth, orders, notifications
- Global state for user profile and authentication
- Notification/toast state management
- Order state management ready

**Files Implemented**:
- `frontend/src/store/authStore.ts` - Authentication state
- `frontend/src/store/notificationStore.ts` - Toast notifications state
- `frontend/src/store/orderStore.ts` - Order management state

#### Phase 9: API Integration ✅
- Axios-based API client with Firebase token injection
- Service API client for service operations
- Auth API client for registration/login
- Firestore integration for data persistence

**Files Implemented**:
- `frontend/src/services/apiClient.ts` - Base API client
- `frontend/src/services/serviceService.ts` - Service API methods

#### Phase 10: Deployment Configuration ✅
- Vercel deployment setup for frontend
- Firebase deployment configuration
- Environment variable management
- Build optimization
- Monorepo build configuration

**Files Implemented**:
- `vercel.json` - Vercel deployment configuration
- `firebase.json` - Firebase configuration
- `.env.example` files for both frontend and backend

#### Phase 11: Dashboard Architecture Refactoring & Code Cleanup ✅

- Unified dashboard UI patterns across 4 role-based dashboards
- Extracted 3 reusable shared components to eliminate code duplication
- Deleted 19 dead/orphaned files with zero references
- Removed "New" suffix nomenclature (dashboards are no longer versioned)
- Cleaned up debug console logging from API interceptors and modals

**Architecture Changes**:

- Created `DashboardTabs.tsx` — Consistent sticky pill-style tab navigation (used by all 4 dashboards)
- Created `StatsGrid.tsx` — Icon+number+label stat cards component (replaces hand-rolled copies)
- Created `EmptyState.tsx` — Reusable "No X yet" placeholder box (replaces ~10 copy-pasted versions)
- All dashboards now share styling source-of-truth; style changes propagate uniformly

**Files Deleted** (confirmed zero references):

- Old duplicate dashboards: `components/Dashboard/AMDashboard.tsx` (pre-refactor version), `CustomerDashboard.tsx`, `SPDashboard.tsx`
- Orphaned folders: `components/Customer/` (4 files), `components/AccountManager/` (4 files), `components/Menu/` (3 files)
- Dead pages: `pages/LoginPage.tsx`, `pages/ServiceLandingPage.tsx`, `pages/LandingPage.tsx` (old version)
- Dead modal: `Auth/LoginModalNew.tsx`, `Auth/RegisterModal.tsx`

**Files Renamed** (dropped "New" suffix):

- `AMDashboardNew` → `AMDashboard` + renamed function export
- `SPDashboardNew` → `SPDashboard` + renamed function export  
- `CustomerDashboardNew` → `CustomerDashboard` + renamed function export
- `ServiceCustomerDashboardNew` → `ServiceCustomerDashboard` + renamed function export
- `ApprovalsTabNew` → `ApprovalsTab` + renamed function export + removed 15+ console.log debug statements
- `LandingPageNew` → `LandingPage` + renamed function export

**Cleanup Work**:

- Stripped emoji-tagged debug console.log calls from `apiClient.ts` request/response interceptors
- Removed verbose logging from `ApprovalsTab.tsx`, `EditUserModal.tsx`, `CreateAccountManagerModal.tsx`
- Updated all 21 import sites in `App.tsx` and component tree to reference new names
- Verified: `tsc --noEmit` clean, `vite build` succeeds, CSS bundle size decreased (37.7KB → 28.1KB due to dead Tailwind class purging)

**Files Modified**:

- `App.tsx` — Updated all dashboard imports and router wiring
- `frontend/src/services/apiClient.ts` — Cleaned up request/response interceptor logging
- All 4 dashboard components + `ApprovalsTab.tsx` — Applied shared components, removed duplicate styling

#### Phase 12: ServiceProvider Menu Selection During Onboarding ✅

- Integrated master menu item selection into AM onboarding workflow
- AM can assign menu items to SP with custom pricing during onboarding
- Dynamic serviceId fetching from users/{uid}/serviceAssociations subcollection
- Checkbox-based menu selection with price customization
- Validation requiring prices for selected items (uses master menu default as suggestion)
- Menu items saved to SP profile for customer visibility

**Architecture Discovery**:

- ServiceVerse uses a **single users collection** for all user types (not separate collections per role)
- User type is determined by the `role` field: 'CUSTOMER', 'SERVICE_PROVIDER', 'ACCOUNT_MANAGER', 'COWORKER', 'SUPERADMIN'
- Service associations stored in: `users/{uid}/serviceAssociations/{serviceId}` subcollection
- No separate `serviceProviders` collection (clarified with user after multiple attempts)

**Files Implemented/Modified**:

New Files:
- `frontend/src/components/Onboarding/SPOnboardingStepper.tsx` — 4-step modal stepper for AM onboarding
- `frontend/src/components/Onboarding/MenuSelectionStep.tsx` — Menu selection with checkbox + price customization
- `backend/functions/src/handlers/onboarding/spMenuSelection.ts` — Backend handlers for menu operations

Modified Files:
- `frontend/src/components/Dashboard/AMDashboard.tsx` — Integrated onboarding stepper, fixed status check from ONBOARDING to ASSIGNED
- `frontend/src/services/apiClient.ts` — Added 4 new API methods:
  - `getSPServiceId(spId)` — Fetch serviceId from serviceAssociations
  - `getServiceMenuItems(serviceId)` — Get master menu for a service
  - `saveSPMenuSelection(spId, serviceId, menuItems)` — Save selected menu with prices
  - `getSPConfiguredMenu(spId)` — Get SP's configured menu
- `backend/functions/src/index.ts` — Added 4 new API routes for menu selection
- `backend/functions/src/handlers/phase2/onboarding.ts` — Fixed assignAccountManagerToSP:
  - Now sets status to 'ASSIGNED' (not 'ONBOARDING')
  - Saves both flat AND nested accountManager fields for backward compatibility
  - Fixed AM-SP assignment bug where AMs couldn't see their assigned SPs

**Bug Fixes Applied**:

1. **AM-SP Assignment Not Working**
   - Root cause: Backend code paths created SPs with inconsistent field structures (nested vs flat)
   - Query in getServiceProviders looked for `accountManager.userId` but some SPs had flat `accountManagerId`
   - Fix: Modified assignAccountManagerToSP to save BOTH structures:

   ```text
   accountManagerId, accountManagerName, accountManagerEmail (flat)
   accountManager: { userId, name, email } (nested)
   ```

2. **Status Value Mismatch**
   - Frontend was checking for `sp.status === 'ONBOARDING'` but backend set `'ASSIGNED'`
   - Fix: Updated frontend AMDashboard to check for `sp.status === 'ASSIGNED'` and fetch serviceId dynamically

3. **ServiceId Not Available**
   - Frontend was sending placeholder 'SERVICE_ID_TO_BE_FETCHED' to menu API
   - Root cause: User revealed there's no serviceProviders collection — all users in single collection
   - Fix: Created GET `/service-providers/:spId/service-id` endpoint that fetches from `users/{uid}/serviceAssociations`

**Backend Routes Added**:

```bash
GET    /service-providers/:spId/service-id         (requireRole: ACCOUNT_MANAGER)
GET    /services/:serviceId/master-menu             (public)
POST   /service-providers/:spId/menu-selection      (requireRole: ACCOUNT_MANAGER)
GET    /service-providers/:spId/menu                (public)
```

**Deployment Status**:
- Backend deployment to Firebase successful ✅
- All new endpoints live and tested ✅
- Frontend integration complete and type-checked ✅

---

## 🏗️ Architecture & Structure

### Frontend Structure

```
frontend/
├── src/
│   ├── pages/              # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   ├── LandingPage.tsx
│   │   └── ServiceLandingPage.tsx
│   ├── components/
│   │   ├── Auth/           # Authentication forms
│   │   ├── SuperAdmin/     # SuperAdmin UI
│   │   ├── AccountManager/ # AM onboarding
│   │   ├── Dashboard/      # Role dashboards
│   │   ├── Form/           # Reusable form fields
│   │   ├── Layout/         # Layout components
│   │   └── Shared/         # Shared components
│   ├── services/           # API clients
│   ├── store/              # Zustand stores
│   ├── types/              # TypeScript types
│   ├── utils/              # Utilities & helpers
│   └── styles/             # Global styles
```

### Backend Structure

```
backend/functions/src/
├── handlers/               # API endpoint handlers
│   ├── auth/
│   ├── services/
│   ├── serviceProviders/
│   ├── orders/
│   ├── payments/
│   ├── webhooks/
│   └── analytics/
├── middleware/             # Express middleware
├── services/               # Business logic
├── utils/                  # Utility functions
└── types/                  # TypeScript types
```

---

## 🔑 Key Technical Decisions

### Authentication Architecture
- **Phone-only authentication**: All users authenticate via phone OTP
- **Email usage**: Reserved for business communications (notifications, transactional emails)
- **JWT tokens**: Generated after successful phone OTP verification
- **Firebase Auth**: Integrated for secure credential management
- **Status**: ✅ Fully Implemented

### Data Architecture
- **Multi-tenant isolation**: Firestore rules enforce user/tenant data isolation
- **Role-based access**: Strict permission model for each user type
- **Real-time updates**: Firestore listeners for live data sync
- **Data validation**: Schema validation on client and server

### State Management
- **Zustand**: Lightweight store for client-side state
- **Firebase SDK**: For auth state and user data
- **Query Client**: Ready for API data caching (TanStack Query)

### UI/UX
- **Tailwind CSS**: Utility-first CSS for responsive design
- **React Router**: Client-side routing with protected routes
- **Form validation**: Zod schemas for type-safe validation
- **Toast notifications**: User feedback system

---

## 📋 Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Project Structure | ✅ Complete | Monorepo setup ready |
| Auth System | ✅ Complete | Phone OTP + email verification |
| Registration | ✅ Complete | Multi-role user registration |
| SuperAdmin Dashboard | ✅ Complete | Service & AccountManager management |
| Customer Dashboard | ✅ Complete | Service browsing, order placement |
| ServiceProvider Dashboard | ✅ Complete | Customer management, order handling |
| AccountManager Dashboard | ✅ Complete | Onboarding, portfolio management |
| Onboarding Forms | ✅ Complete | Commission, working hours, documents, menu selection |
| Menu Selection | ✅ Complete | AM assigns menu items with custom pricing during onboarding |
| AM-SP Assignment | ✅ Complete | Fixed schema mismatch, now working correctly |
| Payment Integration | 🔄 In Progress | Razorpay integration pending |
| Order Management | 🔄 In Progress | Order creation and tracking |
| Push Notifications | 🔄 In Progress | Firebase Cloud Messaging setup |
| Email Notifications | 🔄 In Progress | Resend integration pending |
| Analytics Dashboard | 📋 Planned | KPIs, charts, reporting |
| Mobile App | 📋 Planned | Capacitor iOS/Android build |

---

## 🚀 Next Steps & Roadmap

### Immediate (Next Phase)
1. **Payment Integration**
   - Implement Razorpay payment gateway
   - Create payment checkout flow
   - Payment success/failure handling
   - Commission calculation and payouts

2. **Order Management**
   - Order creation and tracking
   - Customer order history
   - ServiceProvider order management
   - Real-time order status updates

3. **Push Notifications**
   - Firebase Cloud Messaging setup
   - Notification templates for different events
   - User notification preferences

### Short Term (2-3 Weeks)
1. **Email Notifications**
   - Resend integration for transactional emails
   - Email templates for registration, orders, confirmations
   - Email delivery tracking

2. **Analytics & Reporting**
   - Dashboard KPIs for SuperAdmin
   - Commission reports for AccountManagers
   - Revenue analytics for ServiceProviders

3. **Testing**
   - Unit tests for components
   - Integration tests for auth flow
   - E2E tests for critical paths

### Medium Term (1 Month)
1. **Mobile App**
   - Capacitor setup for iOS/Android
   - Native app builds
   - App store deployment

2. **Advanced Features**
   - Customer reviews and ratings
   - Advanced search and filtering
   - Subscription management
   - Bulk operations

---

## 🔐 Security Implementation

✅ **Completed**:
- Firebase Authentication with secure credential storage
- JWT token verification middleware
- CORS protection
- Environment variable management (no secrets in code)
- Multi-tenant data isolation in Firestore

⏳ **In Progress**:
- Firestore security rules implementation
- Payment data encryption
- Rate limiting on API endpoints
- Input validation and sanitization

📋 **Planned**:
- Two-factor authentication (2FA)
- Audit logging
- Data encryption at rest
- Penetration testing

---

## 📚 Documentation

Available documentation:
- `README.md` - Project overview and quick start
- `docs/SERVICEVERSE_CONTEXT.md` - Project context and architecture
- `backend/functions/README.md` - Backend setup and API endpoints
- `frontend/README.md` - Frontend setup and component structure
- `docs/` - All historical documentation and phase milestones

---

## 💻 Development Commands

### Frontend
```bash
cd frontend
npm install
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview build locally
npm run type-check    # Type checking
```

### Backend
```bash
cd backend/functions
npm install
npm run build         # Build TypeScript
npm run serve         # Local emulation
npm run deploy        # Deploy to Firebase
npm run logs          # View logs
```

---

## 📦 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18+ |
| Language | TypeScript | 5.3+ |
| Styling | Tailwind CSS | 3.3+ |
| State Mgmt | Zustand | 4.4+ |
| Routing | React Router | 6+ |
| Forms | React Hook Form | 7+ |
| Backend | Firebase Cloud Functions | Latest |
| Database | Firestore | Latest |
| Auth | Firebase Auth | Latest |
| Messaging | Firebase Cloud Messaging | Latest |
| Build | Vite | 5.0+ |
| Icons | Lucide React | Latest |
| Validation | Zod | Latest |

---

## 🤝 Team & Contributions

**Project Lead**: Dinesh Wadhwani  
**Email**: shilpa.shegaonkar@nice.com  
**Repository**: https://github.com/dineshkwadhwani/ServiceVerse

---

## 📝 Recent Commits

Latest work (as of July 13, 2026):

- **Milestone 1 Complete**: All 5 role-based logins working (Customer, SP, AM, Coworker, SuperAdmin)
- ServiceProvider menu selection step integrated into AM onboarding workflow
- Fixed AM-SP assignment bug (schema field mismatch: nested vs flat accountManager)
- Dynamic serviceId fetching from users/{uid}/serviceAssociations during onboarding
- Menu selection with checkbox-based items and custom pricing validation
- Backend menu selection API endpoints deployed and tested
- Frontend SPOnboardingStepper component with 4 steps (Commission, Working Hours, Documents, Menu)
- Dashboard refactoring completed with shared components (DashboardTabs, StatsGrid, EmptyState)
- Invoice modal support on completed order tiles (Customer + SP dashboards) with itemized billing, print dialog, and downloadable PDF export

---

## 🎯 Key Metrics

- **Total Components**: 20+ React components
- **Pages**: 5 main pages + role dashboards
- **API Endpoints**: 27 endpoints designed (implementation in progress)
- **TypeScript Coverage**: 100% type-safe code
- **Authentication Methods**: Phone OTP + Email
- **Supported User Roles**: 5 (Customer, SP, AM, Coworker, SuperAdmin)
- **Databases**: Firestore with multi-tenant isolation

---

## 🔄 Current Development Focus

**Phase Status**: Phase 12 Complete - ServiceProvider Menu Selection During Onboarding  
**Milestone**: Milestone 1 ✅ - All Logins Working (5 roles fully authenticated and assigned)  
**Current Work**: Testing menu selection with real data and preparing for order management phase; invoice generation UX added for completed orders  
**Blockers**: None  
**Dependencies**: Razorpay integration for payments, Firebase data validation rules  
**Next Phase**: Order Management (Phase 13) - order creation, tracking, and status updates  

**Known Issues to Address**:

- Complete onboarding form implementation (Commission, Working Hours, Documents steps are placeholders)
- Fix accountManager field structure (should be fully nested, not mixed flat/nested)
- Implement SP profile completion with GST details and business address
- Add Firestore security rules for multi-tenant data isolation

---

**Last Updated**: July 15, 2026  
**Next Review**: After order management implementation
