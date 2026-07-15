# ServiceVerse Context (Unified)

Last updated: 2026-07-14
Status basis: repository docs + current frontend/backend entry points

## 1) What We Are Building

ServiceVerse is a multi-utility service platform with strict role-based workflows and tenant-aware data boundaries.

Primary product intent:
- Build one shared platform where multiple local utility services can run (Laundry first, then additional verticals).
- Give each role a purpose-built workflow:
  - SuperAdmin: platform and service configuration
  - AccountManager (AM): provider onboarding and operations
  - ServiceProvider (SP): service delivery and customer handling
  - Coworker: execution support for SP workflows
  - Customer: discover services and place/manage orders

Laundry is the first utility and the reference template for future utilities.

## 2) Laundry-First Strategy

Laundry is the initial production path used to validate:
- Service creation and branding
- Provider onboarding lifecycle
- Menu/item configuration per provider
- Customer order creation flow
- Payment and commission lifecycle

Once stable for Laundry, the same platform primitives are reused for future services.

## 3) Platform Shape (Current)

Frontend:
- React + TypeScript + Vite
- Role-based dashboards and shared dashboard components
- Service marketplace landing + service detail journey
- Zustand stores for auth/notifications/orders

Backend:
- Firebase Cloud Functions (Express API)
- Firestore data model
- Firebase Auth with role checks in middleware
- Route groups for auth, services, onboarding, menu, orders, dashboards

Deployment:
- Frontend on Vercel
- Backend on Firebase Functions

## 4) Current User Journey (High-Level)

Public journey:
1. User lands on main page and sees active services.
2. User opens a service detail page.
3. User signs in/registers and is routed to role-specific dashboard.

Operational journey:
1. SuperAdmin creates/configures services.
2. SuperAdmin/AM creates and manages account structure.
3. AM onboards SPs (including menu selection/custom pricing).
4. SP runs customer/order operations.
5. Customer places and tracks orders.

## 5) Data Model Direction (Critical)

Current canonical direction from latest docs/work:
- Unified `users` collection for all roles.
- Role is stored on user profile (`CUSTOMER`, `SERVICE_PROVIDER`, `ACCOUNT_MANAGER`, `COWORKER`, `SUPERADMIN`).
- SP service linkage is represented through user service associations.
- Menu selection for SPs during onboarding is already integrated through dedicated endpoints.

Note: Some older docs mention separate role collections; treat those as historical unless code explicitly depends on them.

## 6) What Is Solid vs In Progress

Solid (implemented and used):
- Multi-role auth and role-gated dashboards
- Service management
- AM/SP onboarding pipeline improvements
- SP menu-selection flow during onboarding
- API structure and deployment pipeline

In progress / stabilization areas:
- Order lifecycle consistency across all role flows
- Payment production hardening (Razorpay flow completeness + reconciliation)
- Notifications (FCM/Resend)
- Firestore security hardening and validation completeness
- Unified field structure cleanup (remaining nested vs flat legacy compatibility)

## 7) Source-of-Truth Priority

When docs conflict, use this order:
1. Runtime code entry points (frontend routes + backend API routes)
2. Latest project status docs (CLAUDE.md and recent implementation notes)
3. Older phase completion docs

Reason: older phase docs include historical "complete" claims that do not fully match current milestone status.

## 8) Near-Term Product Goal

Current goal is not "new platform creation" from scratch; it is milestone progression:
- Move Laundry implementation from login/onboarding maturity to robust order + payment + operations maturity.
- Keep architecture generic so adding next services is mostly configuration and workflow reuse.

## 9) Execution Principles for Next Work

- Keep Laundry as golden workflow first.
- Prefer reusable service-agnostic components and handlers over Laundry-only hardcoding.
- Maintain strict role-based authorization for all routes.
- Keep docs updated whenever flow or schema changes.
- Validate and deploy Firebase artifacts when rules/configs change.

---

This file is intended to be the concise context handoff for future implementation threads.
