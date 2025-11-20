# TimeWise CRM - Time Management System

A comprehensive time tracking and management system built with Next.js, MongoDB, and modern web technologies.

## Features

- ⏱️ **Time Tracking** - Log work hours with detailed task descriptions
- 👥 **Multi-Role Support** - Admin, User, Inspection, and Developer roles
- 📊 **Analytics & Reports** - Visual dashboards and exportable reports
- 📧 **Email Notifications** - Automated reminders for missing timesheets
- 🔐 **Secure Authentication** - JWT-based auth with role-based access control
- 📅 **Leave Management** - Track and approve employee leave requests
- 🔍 **Audit Logging** - Complete audit trail of all system activities
- 🛠️ **Developer Tools** - Real-time system diagnostics and monitoring
- 🎨 **Modern UI** - Built with Radix UI and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15.3.3 (App Router)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken + bcryptjs)
- **UI Library**: Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Email**: Nodemailer
- **Scheduling**: node-cron
- **Forms**: React Hook Form + Zod validation

## Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TimeWise_FireBase_CRM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Strong random secret for JWT
   - `EMAIL_*` - Email server configuration
   - See `.env.example` for all options

4. **Configure system settings**
   ```bash
   cp config/system-config.example.json config/system-config.json
   ```

   Adjust settings as needed (maintenance mode, mail system, etc.)

5. **Create admin user** (First time only)
   ```bash
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

   Application will run on `http://localhost:9002`

## Production Deployment

1. **Build the application**
   ```bash
   npm run build:clean
   ```

2. **Start production server**
   ```bash
   npm run start:prod
   ```

3. **Or use PM2 for process management**
   ```bash
   npm run pm2:start
   npm run pm2:logs
   ```

See [docs/deployment/DEPLOYMENT_GUIDE.md](docs/deployment/DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## User Roles

### Admin
- Full system access
- Manage users and permissions
- View all timesheets and reports
- Configure system settings
- Approve/reject leave requests

### User
- Log personal work hours
- View personal timesheet history
- Submit leave requests
- Receive notifications

### Inspection
- Read-only access to all timesheets
- View compliance reports
- Cannot edit or delete data

### Developer
- Access system diagnostics
- Monitor server health
- View real-time metrics
- Control mail system
- View error logs

## Project Structure

```
TimeWise_FireBase_CRM/
├── config/                  # Configuration files
├── docs/                    # Documentation
│   ├── deployment/         # Deployment guides
│   ├── features/           # Feature documentation
│   └── fixes/              # Bug fix documentation
├── public/                 # Static assets
├── scripts/                # Utility scripts
│   ├── database/          # Database scripts
│   ├── deployment/        # Deployment scripts
│   ├── network/           # Network troubleshooting
│   └── pm2/               # PM2 configuration
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── api/          # API routes
│   │   └── dashboard/    # Dashboard pages
│   ├── components/        # React components
│   │   ├── admin/        # Admin components
│   │   ├── developer/    # Developer tools
│   │   ├── inspection/   # Inspection components
│   │   ├── settings/     # Settings components
│   │   ├── timesheet/    # Timesheet components
│   │   └── ui/           # UI components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Library code
│       ├── api/          # API utilities
│       ├── auth/         # Authentication
│       ├── constants/    # App constants
│       ├── database/     # Database utilities
│       ├── models/       # Mongoose models
│       ├── services/     # Business logic
│       │   ├── cron/    # Scheduled tasks
│       │   ├── email/   # Email service
│       │   └── notification/ # Notifications
│       └── utils/        # Utility functions
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:seed` - Create admin user
- `npm run pm2:start` - Start with PM2
- `npm run pm2:stop` - Stop PM2 processes
- `npm run pm2:restart` - Restart PM2 processes
- `npm run pm2:logs` - View PM2 logs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/Timewise` |
| `JWT_SECRET` | JWT signing secret | *Required* |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_USER` | Email username | *Required for email* |
| `EMAIL_PASS` | Email password/app password | *Required for email* |
| `ENABLE_CRON` | Enable cron jobs | `true` |
| `TIMEZONE` | Application timezone | `Asia/Kolkata` |
| `NEXT_PUBLIC_API_URL` | API base URL | Auto-detected |
| `NEXT_PUBLIC_APP_URL` | App base URL | Auto-detected |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users` - List all users (Admin/Inspection)
- `POST /api/users` - Create user (Admin)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Work Logs
- `GET /api/worklogs` - List work logs
- `POST /api/worklogs` - Create work log
- `GET /api/worklogs/:id` - Get work log details
- `PUT /api/worklogs/:id` - Update work log
- `DELETE /api/worklogs/:id` - Delete/reject work log

### Leaves
- `GET /api/leaves` - List leave requests
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id` - Update leave request

### System
- `GET /api/diagnostics` - System diagnostics (Admin/Developer)
- `GET /api/monitoring` - Live monitoring data (Developer)
- `GET /api/health/db` - Database health check
- `GET /api/system-config` - Get system configuration
- `POST /api/mail-system` - Control mail system (Developer)

See [API Documentation](docs/api.md) for complete API reference.

## License

Proprietary - Lab of Future (LOF)

## Support

For issues and questions, please contact the development team.

---

**Developed by Lab of Future**
