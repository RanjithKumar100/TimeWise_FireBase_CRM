# TimeWise Firebase CRM - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Browser)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Login/     │  │  Dashboard   │  │   Admin      │  │  Inspection │ │
│  │  Auth Pages  │  │    Pages     │  │   Panel      │  │   Panel     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│         │                 │                 │                 │          │
│         └─────────────────┴─────────────────┴─────────────────┘          │
│                                  │                                        │
└──────────────────────────────────┼────────────────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    React Components         │
                    │  - Timesheet Components     │
                    │  - Settings Components      │
                    │  - Admin Components         │
                    │  - UI Components (shadcn)   │
                    └──────────────┬──────────────┘
                                   │
┌──────────────────────────────────▼────────────────────────────────────────┐
│                       MIDDLEWARE LAYER                                    │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │  Next.js Middleware (CORS, Timeouts, Route Protection)         │      │
│  └────────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────▲────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼────────────────────────────────────────┐
│                          API LAYER (Next.js 15)                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Auth API    │  │ WorkLogs API │  │  Leaves API  │  │  Users API  │ │
│  │  /api/auth/* │  │/api/worklogs │  │ /api/leaves  │  │ /api/users  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │Notifications │  │  Audit Logs  │  │System Config │  │Diagnostics  │ │
│  │/api/notif... │  │/api/audit... │  │/api/system.. │  │/api/diagn.. │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                                           │
└───────────────────────────────────┬───────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                               │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Auth        │  │ Permissions  │  │ Notification │  │  Email      │ │
│  │  Service     │  │  Service     │  │   Service    │  │  Service    │ │
│  │ (JWT, hash)  │  │ (RBAC)       │  │ (Cron jobs)  │  │(Nodemailer) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  Time Utils  │  │  Date Utils  │  │  AI Service  │                   │
│  │              │  │              │  │  (Genkit)    │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                           │
└───────────────────────────────────┬───────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────────────────┐
│                          DATA ACCESS LAYER                                │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │          MongoDB Connection Manager (Mongoose)                 │      │
│  │  - Connection Pooling (10-50 connections)                      │      │
│  │  - Auto-reconnect & Retry Logic                                │      │
│  │  - Health Checks                                               │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  User Model  │  │ WorkLog Model│  │  Leave Model │  │AuditLog     │ │
│  │              │  │              │  │              │  │  Model      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐                                      │
│  │Notification  │  │PasswordReset │                                      │
│  │ Log Model    │  │ Token Model  │                                      │
│  └──────────────┘  └──────────────┘                                      │
│                                                                           │
└───────────────────────────────────┬───────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────────────────┐
│                         DATABASE LAYER                                    │
├───────────────────────────────────────────────────────────────────────────┤
│                        MongoDB Database                                   │
│  Collections: users, worklogs, leaves, auditlogs,                        │
│               notificationlogs, passwordresettokens                       │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                    │
├───────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   Firebase   │  │  Google AI   │  │     SMTP     │                   │
│  │   (Genkit)   │  │   (Genkit)   │  │  Mail Server │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└───────────────────────────────────────────────────────────────────────────┘
```

## Architecture Layers

### 1. Client Layer
The presentation layer consisting of:
- **Authentication Pages**: Login, forgot password, reset password
- **Dashboard Pages**: Role-based dashboards (Admin, User, Inspection)
- **React Components**: Reusable UI components built with shadcn/ui
- **Timesheet Components**: Table and calendar views for time tracking
- **Settings Components**: User preferences and system configuration
- **Admin Components**: User management, leave management, notifications

### 2. Middleware Layer
Built with Next.js middleware to handle:
- **CORS Configuration**: Cross-origin resource sharing headers
- **Request Timeouts**: 60-second timeout for API routes
- **Route Protection**: Authentication and authorization checks
- **Request/Response Interceptors**: Logging and monitoring

### 3. API Layer
RESTful API routes built with Next.js 15 App Router:
- **Authentication API** (`/api/auth/*`): Login, register, password reset
- **WorkLogs API** (`/api/worklogs`): CRUD operations for timesheets
- **Leaves API** (`/api/leaves`): Leave request management
- **Users API** (`/api/users`): User management operations
- **Notifications API** (`/api/notifications`): Notification management
- **Audit Logs API** (`/api/audit-logs`): Activity tracking
- **System Config API** (`/api/system-config`): System settings
- **Diagnostics API** (`/api/diagnostics`): System health checks

### 4. Business Logic Layer
Core services and utilities:
- **Auth Service** ([auth.ts](../src/lib/auth.ts)): JWT token management, password hashing
- **Permissions Service** ([permissions.ts](../src/lib/permissions.ts)): Role-based access control (RBAC)
- **Notification Service** ([notification-service.ts](../src/lib/notification-service.ts)): Email notifications with cron jobs
- **Email Service** ([email.ts](../src/lib/email.ts)): SMTP email delivery via Nodemailer
- **Time Utils** ([time-utils.ts](../src/lib/time-utils.ts)): Time calculation helpers
- **Date Utils** ([date-utils.ts](../src/lib/date-utils.ts)): Date formatting and manipulation
- **AI Service** ([genkit.ts](../src/ai/genkit.ts)): Google Genkit integration for AI features

### 5. Data Access Layer
Database models and connection management:
- **MongoDB Connection Manager** ([mongodb.ts](../src/lib/mongodb.ts)):
  - Connection pooling (10-50 concurrent connections)
  - Automatic reconnection with retry logic
  - Health check monitoring
  - Connection state management

- **Mongoose Models**:
  - **User Model** ([User.ts](../src/lib/models/User.ts)): User accounts and profiles
  - **WorkLog Model** ([WorkLog.ts](../src/lib/models/WorkLog.ts)): Timesheet entries
  - **Leave Model** ([Leave.ts](../src/lib/models/Leave.ts)): Leave requests
  - **AuditLog Model** ([AuditLog.ts](../src/lib/models/AuditLog.ts)): Activity logs
  - **NotificationLog Model** ([NotificationLog.ts](../src/lib/models/NotificationLog.ts)): Notification history
  - **PasswordResetToken Model** ([PasswordResetToken.ts](../src/lib/models/PasswordResetToken.ts)): Password reset tokens

### 6. Database Layer
MongoDB database with the following collections:
- `users`: User accounts and authentication data
- `worklogs`: Timesheet entries
- `leaves`: Leave requests and approvals
- `auditlogs`: System activity logs
- `notificationlogs`: Notification history
- `passwordresettokens`: Password reset tokens

### 7. External Services
Third-party integrations:
- **Firebase (Genkit)**: AI model deployment and management
- **Google AI (Genkit)**: AI-powered timesheet suggestions
- **SMTP Mail Server**: Email delivery via Nodemailer

## Key Design Patterns

### 1. Layered Architecture
Clear separation of concerns with distinct layers for presentation, business logic, and data access.

### 2. Repository Pattern
Mongoose models act as repositories, abstracting database operations.

### 3. Service Layer Pattern
Business logic encapsulated in service modules (auth, notifications, email).

### 4. Dependency Injection
Services and utilities are imported as needed, promoting modularity.

### 5. Middleware Pattern
Next.js middleware for cross-cutting concerns (CORS, authentication, logging).

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with React 18
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js 15 API Routes
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod

### Database
- **Database**: MongoDB
- **ODM**: Mongoose
- **Connection Pooling**: 10-50 connections

### External Services
- **AI**: Google Genkit (Firebase + Google AI)
- **Email**: Nodemailer
- **Scheduling**: node-cron
- **File Export**: xlsx, file-saver

### Development Tools
- **Linting**: ESLint (next lint)
- **Type Checking**: TypeScript Compiler
- **Package Management**: npm

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcryptjs for secure password storage
3. **Role-Based Access Control (RBAC)**: Four user roles (Admin, User, Inspection, Developer)
4. **CORS Protection**: Configurable CORS headers
5. **Request Timeouts**: Prevent long-running requests
6. **Audit Logging**: Track all user actions
7. **Password Reset Tokens**: Secure password recovery flow

## Scalability Features

1. **Connection Pooling**: Support for 10-50 concurrent MongoDB connections
2. **Automatic Reconnection**: Resilient database connection management
3. **Retry Logic**: Automatic retry for failed database operations
4. **Cron Jobs**: Scheduled tasks for notifications and maintenance
5. **API Rate Limiting**: Request timeout configuration
6. **Modular Architecture**: Easy to scale individual services

## Deployment Architecture

The application runs on port 9002 and listens on `0.0.0.0` for network accessibility:
- **Development**: `npm run dev` (port 9002)
- **Production**: `npm run start:prod` (port 9002)
- **Network Access**: Configured for local network deployment

## Monitoring & Diagnostics

- **Health Checks**: `/api/health/db` for database status
- **Diagnostics**: `/api/diagnostics` for system information
- **Maintenance Mode**: `/api/maintenance-check` for maintenance status
- **Audit Logs**: Track all user actions and system events
- **Connection Stats**: Real-time MongoDB connection monitoring
