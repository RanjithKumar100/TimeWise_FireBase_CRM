# TimeWise Firebase CRM - CI/CD Pipeline

## Overview

This document outlines the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the TimeWise Firebase CRM application. The pipeline ensures code quality, automated testing, and streamlined deployment processes.

---

## Pipeline Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT PIPELINE                              │
└───────────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│  Developer  │
│    Code     │
│   Changes   │
└──────┬──────┘
       │
       │ git commit & push
       │
┌──────▼──────────────────────────────────────────────────────────────────┐
│                        SOURCE CONTROL (Git)                             │
│                        Branch: main                                     │
│                        Repository: TimeWise_FireBase_CRM                │
└──────┬──────────────────────────────────────────────────────────────────┘
       │
       │ Webhook/Trigger
       │
┌──────▼──────────────────────────────────────────────────────────────────┐
│                     BUILD & TEST STAGE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1: Install Dependencies                                          │
│  ┌───────────────────────────────────────┐                             │
│  │  Command: npm install                 │                             │
│  │  Purpose: Install all project deps    │                             │
│  │  Duration: ~30-60 seconds             │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
│  Step 2: Type Checking                                                 │
│  ┌───────────────────────────────────────┐                             │
│  │  Command: npm run typecheck           │                             │
│  │  Script: tsc --noEmit                 │                             │
│  │  Purpose: Validate TypeScript types   │                             │
│  │  Duration: ~10-20 seconds             │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
│  Step 3: Linting                                                       │
│  ┌───────────────────────────────────────┐                             │
│  │  Command: npm run lint                │                             │
│  │  Script: next lint                    │                             │
│  │  Purpose: Check code style & quality  │                             │
│  │  Duration: ~5-10 seconds              │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
│  Step 4: Build Application                                             │
│  ┌───────────────────────────────────────┐                             │
│  │  Command: npm run build               │                             │
│  │  Script: next build                   │                             │
│  │  Purpose: Create production build     │                             │
│  │  Output: .next/ directory             │                             │
│  │  Duration: ~60-120 seconds            │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
│  ┌───────────────────────────────────────┐                             │
│  │  Build Status:                        │                             │
│  │  ✓ Success → Continue to Deployment  │                             │
│  │  ✗ Failure → Stop & Notify Developer │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
└──────┬──────────────────────────────────────────────────────────────────┘
       │
       │ Build Success ✓
       │
┌──────▼──────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT STAGE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1: Server Setup                                                  │
│  ┌───────────────────────────────────────┐                             │
│  │  Command: npm run server:setup        │                             │
│  │  Purpose: Configure server environment│                             │
│  │                                        │                             │
│  │  Tasks:                                │                             │
│  │  • Configure network settings          │                             │
│  │  • Setup firewall rules (port 9002)   │                             │
│  │  • Check Windows network adapter      │                             │
│  │  • Verify MongoDB connection          │                             │
│  │  • Create necessary directories       │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
│  Step 2: Environment Configuration                                     │
│  ┌───────────────────────────────────────┐                             │
│  │  Load & Validate .env.local           │                             │
│  │                                        │                             │
│  │  Required Variables:                   │                             │
│  │  • MONGODB_URI                        │                             │
│  │  • JWT_SECRET                         │                             │
│  │  • EMAIL_HOST                         │                             │
│  │  • EMAIL_PORT                         │                             │
│  │  • EMAIL_USER                         │                             │
│  │  • EMAIL_PASS                         │                             │
│  │  • GOOGLE_AI_API_KEY                  │                             │
│  │  • NODE_ENV=production                │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
│  Step 3: Database Verification                                         │
│  ┌───────────────────────────────────────┐                             │
│  │  Command: npm run server:check        │                             │
│  │  Purpose: Verify database connection  │                             │
│  │                                        │                             │
│  │  Checks:                               │                             │
│  │  • MongoDB connection status          │                             │
│  │  • Test query execution               │                             │
│  │  • Connection pool health             │                             │
│  │  • Network latency                    │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
│  Step 4: Database Migration/Seed (Optional)                            │
│  ┌───────────────────────────────────────┐                             │
│  │  Endpoint: POST /api/seed             │                             │
│  │  Purpose: Initialize database         │                             │
│  │                                        │                             │
│  │  Tasks:                                │                             │
│  │  • Create default admin user          │                             │
│  │  • Setup initial data                 │                             │
│  │  • Create indexes                     │                             │
│  │  • Verify collections                 │                             │
│  │                                        │                             │
│  │  Note: Only run on first deployment  │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
│  Step 5: Clean Previous Build                                          │
│  ┌───────────────────────────────────────┐                             │
│  │  Command: npm run clean               │                             │
│  │  Purpose: Remove old build artifacts  │                             │
│  │                                        │                             │
│  │  Removes:                              │                             │
│  │  • .next/ directory                   │                             │
│  │  • node_modules/.cache                │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
│  Step 6: Start Production Server                                       │
│  ┌───────────────────────────────────────┐                             │
│  │  Command: npm run start:prod          │                             │
│  │  Script: next start -p 9002 -H 0.0.0.0│                             │
│  │                                        │                             │
│  │  Configuration:                        │                             │
│  │  • Port: 9002                         │                             │
│  │  • Host: 0.0.0.0 (all interfaces)    │                             │
│  │  • Mode: Production                   │                             │
│  │  • Process: Node.js                   │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
│  Step 7: Health Check                                                  │
│  ┌───────────────────────────────────────┐                             │
│  │  Endpoint: GET /api/health/db         │                             │
│  │  Purpose: Verify deployment success   │                             │
│  │                                        │                             │
│  │  Checks:                               │                             │
│  │  • Server is responding               │                             │
│  │  • Database is connected              │                             │
│  │  • Application is ready               │                             │
│  └───────────────────────────────────────┘                             │
│                                                                         │
└──────┬──────────────────────────────────────────────────────────────────┘
       │
       │ Deployment Success ✓
       │
┌──────▼──────────────────────────────────────────────────────────────────┐
│                     MONITORING & MAINTENANCE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │  Health Checks   │  │   Cron Jobs      │  │  Audit Logging   │     │
│  │  /api/health/db  │  │  Notifications   │  │  Track Changes   │     │
│  │  /api/maintenance│  │  Auto-reminders  │  │  User Actions    │     │
│  │                  │  │  Daily/Hourly    │  │  System Events   │     │
│  │  Frequency: 5min │  │                  │  │  Real-time       │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │   Diagnostics    │  │  Error Tracking  │  │  Performance     │     │
│  │  /api/diagnostics│  │  Console Logs    │  │  Monitoring      │     │
│  │  System Info     │  │  Error Logs      │  │  Response Times  │     │
│  │  Connection Stats│  │  Stack Traces    │  │  Database Perf   │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐                            │
│  │  Backup Strategy │  │  Rollback Plan   │                            │
│  │  Database Backup │  │  Previous Build  │                            │
│  │  Daily/Weekly    │  │  Git Revert      │                            │
│  └──────────────────┘  └──────────────────┘                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Options

### Option 1: Local Network Deployment (Current)

```
┌─────────────────────────────────────────────────────────────┐
│        LOCAL NETWORK DEPLOYMENT (Windows Server)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Run Full Deployment:                                    │
│     npm run server:deploy                                   │
│                                                             │
│  2. Access Points:                                          │
│     • Local: http://localhost:9002                         │
│     • Network: http://<local-ip>:9002                      │
│                                                             │
│  3. Requirements:                                           │
│     ✓ Windows Firewall configured (port 9002)             │
│     ✓ MongoDB running (local or cloud)                    │
│     ✓ Node.js installed                                   │
│     ✓ .env.local configured                               │
│                                                             │
│  4. Monitoring:                                             │
│     • Check logs: Console output                           │
│     • Health: /api/health/db                               │
│     • Diagnostics: /api/diagnostics                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Option 2: Cloud Deployment (Vercel)

```
┌─────────────────────────────────────────────────────────────┐
│             CLOUD DEPLOYMENT (Vercel Platform)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Push to Git Repository:                                 │
│     git push origin main                                    │
│                                                             │
│  2. Vercel Auto-Deploy:                                     │
│     • Automatic build trigger                              │
│     • Environment variables from dashboard                 │
│     • Production URL assigned                              │
│                                                             │
│  3. Configuration:                                          │
│     • Framework: Next.js 15                                │
│     • Build Command: npm run build                         │
│     • Output Directory: .next                              │
│     • Install Command: npm install                         │
│                                                             │
│  4. Environment Variables (Vercel Dashboard):               │
│     • MONGODB_URI                                          │
│     • JWT_SECRET                                           │
│     • EMAIL_* variables                                    │
│     • GOOGLE_AI_API_KEY                                    │
│                                                             │
│  5. Database:                                               │
│     • MongoDB Atlas (Cloud)                                │
│     • IP Whitelist: 0.0.0.0/0 (Vercel)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Option 3: Firebase Hosting + Cloud Functions

```
┌─────────────────────────────────────────────────────────────┐
│          FIREBASE DEPLOYMENT (Full Stack)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Initialize Firebase:                                    │
│     firebase init hosting                                   │
│     firebase init functions                                 │
│                                                             │
│  2. Build & Deploy:                                         │
│     npm run build                                          │
│     firebase deploy                                        │
│                                                             │
│  3. Configuration:                                          │
│     • Hosting: Static assets (.next/static)                │
│     • Functions: API routes (serverless)                   │
│     • Firestore: Optional NoSQL database                   │
│                                                             │
│  4. Environment Config:                                     │
│     firebase functions:config:set key="value"              │
│                                                             │
│  5. Benefits:                                               │
│     • CDN for static assets                                │
│     • Auto-scaling                                         │
│     • Built-in SSL                                         │
│     • Genkit integration ready                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Option 4: Docker Containerization (Future)

```
┌─────────────────────────────────────────────────────────────┐
│           DOCKER DEPLOYMENT (Containerized)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Create Dockerfile (not yet implemented):                │
│     FROM node:20-alpine                                    │
│     WORKDIR /app                                           │
│     COPY package*.json ./                                  │
│     RUN npm install --production                           │
│     COPY . .                                               │
│     RUN npm run build                                      │
│     EXPOSE 9002                                            │
│     CMD ["npm", "run", "start:prod"]                       │
│                                                             │
│  2. Build Image:                                            │
│     docker build -t timewise-crm .                         │
│                                                             │
│  3. Run Container:                                          │
│     docker run -p 9002:9002 \                              │
│       --env-file .env.local \                              │
│       timewise-crm                                         │
│                                                             │
│  4. Docker Compose (Multi-service):                         │
│     • Next.js app                                          │
│     • MongoDB container                                    │
│     • Nginx reverse proxy                                  │
│                                                             │
│  5. Orchestration:                                          │
│     • Kubernetes (K8s)                                     │
│     • Docker Swarm                                         │
│     • AWS ECS                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## NPM Scripts Reference

### Development Scripts
```bash
npm run dev              # Start development server (port 9002)
npm run genkit:dev       # Start Genkit AI development
npm run genkit:watch     # Start Genkit with watch mode
```

### Build Scripts
```bash
npm run build            # Production build
npm run clean            # Clean build artifacts
npm run build:clean      # Clean + build
```

### Production Scripts
```bash
npm run start            # Start production server
npm run start:prod       # Start with NODE_ENV=production
```

### Server Scripts
```bash
npm run server:setup     # Configure server environment
npm run server:check     # Verify server configuration
npm run server:troubleshoot  # Diagnose server issues
npm run server:deploy    # Full deployment (setup + build + start)
```

### Quality Assurance Scripts
```bash
npm run lint             # ESLint checks
npm run typecheck        # TypeScript type checking
```

---

## Environment Variables

### Required Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/timewise_crm

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# AI Integration
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Application
NODE_ENV=production
```

---

## CI/CD Best Practices

### 1. Pre-Commit Hooks (Recommended)
Install Husky for git hooks:
```bash
npm install --save-dev husky
npx husky init
```

Add pre-commit hook:
```bash
#!/bin/sh
npm run lint
npm run typecheck
```

### 2. Automated Testing (Future Enhancement)
```bash
npm test              # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run test:coverage # Generate coverage report
```

### 3. Version Control Strategy
- **main** branch: Production-ready code
- **develop** branch: Integration branch
- **feature/** branches: New features
- **hotfix/** branches: Critical fixes

### 4. Release Process
```bash
# 1. Update version
npm version patch|minor|major

# 2. Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"

# 3. Push with tags
git push origin main --tags
```

### 5. Monitoring Checklist
- [ ] Server is running on port 9002
- [ ] Database connection is healthy
- [ ] All API endpoints respond correctly
- [ ] Cron jobs are scheduled
- [ ] Email notifications are sent
- [ ] Audit logs are being created
- [ ] No console errors

---

## Troubleshooting

### Build Failures
```bash
# Clean node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
npm run clean
npm run build
```

### Database Connection Issues
```bash
# Run diagnostics
npm run server:troubleshoot

# Check MongoDB status
# MongoDB Atlas: Check whitelist IP
# Local MongoDB: Ensure service is running
```

### Port Conflicts
```bash
# Check what's using port 9002
netstat -ano | findstr :9002

# Kill process if needed (Windows)
taskkill /PID <process-id> /F
```

### Deployment Verification
```bash
# Test API endpoints
curl http://localhost:9002/api/health/db
curl http://localhost:9002/api/diagnostics

# Check logs
# Console output shows connection status
```

---

## Performance Optimization

### Build Optimization
- Code splitting enabled by Next.js
- Tree shaking for unused code
- Image optimization with next/image
- Static page generation where possible

### Runtime Optimization
- MongoDB connection pooling (10-50 connections)
- API request timeout (60 seconds)
- Compression enabled (zlib)
- Caching strategies for static assets

### Database Optimization
- Indexed fields for fast queries
- Connection reuse across requests
- Query optimization with lean()
- Aggregation pipelines for complex queries

---

## Security Measures

### Build Security
- Dependencies audit: `npm audit`
- Update packages: `npm update`
- Check vulnerabilities: `npm audit fix`

### Runtime Security
- JWT token expiration
- Password hashing (bcryptjs)
- CORS configuration
- Environment variables (never commit .env)
- SQL injection prevention (Mongoose)
- XSS protection (React)

---

## Rollback Strategy

### Quick Rollback
```bash
# 1. Stop current server
# Ctrl+C or kill process

# 2. Revert to previous commit
git revert HEAD

# 3. Rebuild
npm run build:clean

# 4. Restart
npm run start:prod
```

### Database Rollback
```bash
# Use MongoDB backups
mongorestore --host localhost --port 27017 --db timewise_crm /path/to/backup
```

---

## Continuous Improvement

### Metrics to Track
- Build time
- Deployment time
- Server response times
- Database query performance
- Error rates
- User activity

### Future Enhancements
- [ ] Add automated testing (Jest, Playwright)
- [ ] Implement GitHub Actions CI/CD
- [ ] Add Docker support
- [ ] Setup staging environment
- [ ] Add performance monitoring (Sentry, LogRocket)
- [ ] Implement blue-green deployment
- [ ] Add load balancing for multi-instance
- [ ] Setup automated backups
