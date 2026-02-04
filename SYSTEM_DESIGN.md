# 🏗️ System Design

## Summary
A robust, enterprise-grade User Management System translating traditional Java/Spring concepts into a modern Next.js architecture. Features comprehensive Role-Based Access Control (RBAC), JWT authentication, secure API endpoints with validation, and a high-performance dashboard for managing users and subscriptions.

## 🔐 Authentication Decision
- **Needs Auth:** Yes ✅
- **Reasoning:** This is explicitly a 'User Management System'. It requires distinct 'Admin' (manager) and 'User' (consumer) roles to demonstrate the requested Role-Based Authorization. Security is the core product feature.

## 🎲 Design DNA
- **Seed:** secure-usermgmt-v1
- **Layout:** Split-screen Dashboard: Left sidebar navigation for logged-in areas, Scroll Narrative for public landing page.
- **Color Mood:** High-contrast Security: Clean white backgrounds with sharp gray borders and high-energy Pink (#F2185D) accents for alerts and primary actions.
- **Primary Color:** #F2185D
- **Color Palette:** #1FAC7F, #1DC791, #EF9618, #EAF11C, #8CF21F
- **Animation:** Micro-interactions: Smooth table row transitions, modal scaling, and button press effects.

## Key Features
- JWT-based Authentication & Session Management
- Role-Based Access Control (RBAC: Admin vs User)
- Server-side Pagination & Filtering for User Lists
- Zod Schema Validation (DTO equivalent)
- Global Error Handling & Toast Notifications
- Mock Payment & SMS Gateway Integration UI
- Audit Logging for Security Events

## Models
📦 **User** → `src/models/User.ts`
   Fields: name: String, email: String (unique), password: String (hashed), role: String (enum: 'admin', 'user'), status: String (enum: 'active', 'suspended'), phoneNumber: String, subscriptionStatus: String, lastLogin: Date
📦 **AuditLog** → `src/models/AuditLog.ts`
   Fields: action: String, performedBy: ObjectId (ref: User), targetResource: String, details: String, timestamp: Date

## API Routes
🔗 **POST** `/api/auth/register` → `src/app/api/auth/register/route.ts`
   Registers new user with Zod validation and password hashing
🔗 **POST** `/api/auth/login` → `src/app/api/auth/login/route.ts`
   Validates credentials and issues JWT
🔗 **GET** `/api/users` → `src/app/api/users/route.ts`
   Paginated list of users with filtering (Admin only)
🔗 **PUT** `/api/users/[id]` → `src/app/api/users/[id]/route.ts`
   Update user details or status (Admin/Self)
🔗 **DELETE** `/api/users/[id]` → `src/app/api/users/[id]/route.ts`
   Soft delete or ban user (Admin only)
🔗 **GET** `/api/stats` → `src/app/api/stats/route.ts`
   Dashboard statistics (total users, active subscriptions)

## Pages
📄 `/` → `src/app/page.tsx` 🌐 Public
   Public landing page explaining the security features of the system
📄 `/login` → `src/app/(auth)/login/page.tsx` 🌐 Public
   Secure login form with validation
   🔗 **MUST FETCH FROM**: /api/auth/login
📄 `/register` → `src/app/(auth)/register/page.tsx` 🌐 Public
   Registration form with Zod validation
   🔗 **MUST FETCH FROM**: /api/auth/register
   ⚡ **MUST IMPLEMENT CRUD**: CREATE (forms, modals, buttons)
📄 `/dashboard` → `src/app/(dashboard)/dashboard/page.tsx` 🔒 **PROTECTED** (user only)
   Overview of account status and recent activity
   ⚠️ **MUST WRAP WITH AUTH CHECK**: Redirect to /login if not authenticated
   🔗 **MUST FETCH FROM**: /api/stats, /api/auth/me
   ⚡ **MUST IMPLEMENT CRUD**: READ (forms, modals, buttons)
📄 `/users` → `src/app/(dashboard)/users/page.tsx` 🔒 **PROTECTED** (admin only)
   ADMIN ONLY: Full CRUD table for managing users (pagination, search, delete)
   ⚠️ **MUST WRAP WITH AUTH CHECK**: Redirect to /login if not authenticated
   🔗 **MUST FETCH FROM**: /api/users
   ⚡ **MUST IMPLEMENT CRUD**: CREATE, READ, UPDATE, DELETE (forms, modals, buttons)
📄 `/settings` → `src/app/(dashboard)/settings/page.tsx` 🔒 **PROTECTED** (user only)
   User profile settings, SMS preferences, and subscription status
   ⚠️ **MUST WRAP WITH AUTH CHECK**: Redirect to /login if not authenticated
   🔗 **MUST FETCH FROM**: /api/users/[id]
   ⚡ **MUST IMPLEMENT CRUD**: READ, UPDATE (forms, modals, buttons)

## 🔐 Authentication System (AI-Decided)
- **AuthProvider:** `src/contexts/AuthContext.tsx`
- **useAuth Hook:** `src/hooks/useAuth.ts`
- **Protected Wrapper:** `src/components/ProtectedRoute.tsx`
- **Middleware:** `src/middleware.ts`

⚠️ **IMPORTANT**: All protected pages (marked with 🔒) MUST:
1. Import useAuth hook and check authentication state
2. Redirect to /login if user is not authenticated
3. Show loading state while checking auth
4. Check user role if requiredRole is specified

## Components
🧩 **UserTable** → `src/components/UserTable.tsx`
   Complex data table with pagination controls, sorting, and row actions
   🔗 **MUST FETCH FROM**: /api/users
🧩 **RoleBadge** → `src/components/RoleBadge.tsx`
   Visual indicator for Admin vs User roles with distinct colors
🧩 **StatusToggle** → `src/components/StatusToggle.tsx`
   Switch component to activate/suspend users instantly
   🔗 **MUST FETCH FROM**: /api/users/[id]
🧩 **PaymentModal** → `src/components/PaymentModal.tsx`
   Mock payment gateway integration UI (Sandbox mode)

## 🎨 Layout Approach
Split-screen Dashboard: Left sidebar navigation for logged-in areas, Scroll Narrative for public landing page.

## 🎯 UI Building Prompt
Create a professional, security-focused UI. Cards must use 'border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300'. Primary buttons should be 'bg-[#F2185D] text-white shadow-sm shadow-[#F2185D]/25 hover:shadow-md hover:brightness-110 rounded-lg px-6 py-2.5'. Input fields require 'border border-gray-300 rounded-lg px-4 py-2 focus:border-[#F2185D] focus:ring-2 focus:ring-[#F2185D]/20 outline-none transition-all'. Tables must be 'border border-gray-200 rounded-xl overflow-hidden' with 'divide-y divide-gray-100' and 'hover:bg-gray-50' on rows. Use 'border-l-4 border-[#F2185D]' for alert cards or active navigation states. All interactive elements must have hover states.

## 🏠 Landing Page Content Areas (5 areas)
1. **Hero Section**
   Headline: 'Enterprise-Grade User Management'. Subhead: 'Secure, Scalable, and Ready for Deployment.' CTA: 'Access Dashboard'
2. **Security Features**
   Grid cards detailing JWT Implementation, RBAC Architecture, and Encrypted Data Storage.
3. **Tech Stack**
   Showcase the modern migration: Next.js 15, Tailwind, and MongoDB (replacing legacy Java stack).
4. **Integration Capabilities**
   Visuals showing SMS Notification and Payment Gateway support.
5. **System Stats**
   Counter animation showing '99.9% Uptime', 'Zero Breaches', 'Fast API Response'.


## 🎨 COLOR CLASSES TO USE (from project color scheme):

### Primary Actions (buttons, links, CTAs):
```
bg-rose-600 text-white
hover:bg-rose-600/90
```

### Secondary Elements:
```
bg-emerald-500 text-gray-900
bg-emerald-500/10 text-emerald-500  // subtle badges
```

### Accent (highlights, hover states):
```
bg-amber-500 text-white
border-amber-500
ring-amber-500
```

### Backgrounds:
```
bg-white      // main background
bg-white            // cards, modals
bg-gray-100           // muted sections
bg-gray-100/50        // very subtle
```

### Text:
```
text-gray-900        // main text
text-gray-500   // secondary text, labels
```

### Borders:
```
border-gray-200
divide-gray-200
```

### Destructive (delete, danger):
```
bg-red-500 text-white
```

### Gradients:
```
bg-gradient-to-br from-rose-600/10 to-amber-500/10
```
