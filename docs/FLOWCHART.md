# TimeWise Firebase CRM - Flowchart Diagrams

## 1. User Authentication Flow

```
                        ┌─────────────┐
                        │   START     │
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │  User Visits│
                        │   Website   │
                        └──────┬──────┘
                               │
                        ┌──────▼──────────┐
                        │ Is Authenticated?│
                        └────┬───────┬─────┘
                          No │       │ Yes
                   ┌─────────┘       └──────────┐
                   │                             │
            ┌──────▼──────┐               ┌─────▼─────┐
            │ Redirect to │               │  Load     │
            │ Login Page  │               │Dashboard  │
            └──────┬──────┘               └─────┬─────┘
                   │                             │
            ┌──────▼──────────┐                 │
            │ Enter Credentials│                │
            └──────┬──────────┘                 │
                   │                             │
            ┌──────▼──────────┐                 │
            │  POST /api/auth │                 │
            │     /login      │                 │
            └──────┬──────────┘                 │
                   │                             │
            ┌──────▼──────────┐                 │
            │  Validate User  │                 │
            │  (MongoDB Query)│                 │
            └────┬───────┬────┘                 │
              No │       │ Yes                  │
       ┌─────────┘       └──────┐               │
       │                        │               │
┌──────▼──────┐         ┌───────▼────────┐     │
│Show Error   │         │  Generate JWT  │     │
│Message      │         │     Token      │     │
└─────────────┘         └───────┬────────┘     │
                                │               │
                        ┌───────▼────────┐     │
                        │ Set Auth Cookie│     │
                        └───────┬────────┘     │
                                │               │
                                └───────────────┘
                                        │
                                ┌───────▼────────┐
                                │ Check User Role│
                                └───┬────┬───┬───┘
                                    │    │   │
                        ┌───────────┘    │   └──────────┐
                        │                │              │
                   ┌────▼────┐    ┌─────▼─────┐  ┌────▼────┐
                   │  Admin  │    │   User    │  │Inspection│
                   │Dashboard│    │ Dashboard │  │Dashboard│
                   └────┬────┘    └─────┬─────┘  └────┬────┘
                        │               │              │
                        └───────────────┼──────────────┘
                                        │
                                ┌───────▼───────┐
                                │     END       │
                                └───────────────┘
```

## 2. Timesheet Management Flow

```
                        ┌─────────────┐
                        │   START     │
                        └──────┬──────┘
                               │
                        ┌──────▼──────────────┐
                        │  User Authenticated │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │   Load Dashboard    │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Navigate to        │
                        │  Timesheet Section  │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  GET /api/worklogs  │
                        │  Fetch User Entries │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Display Timesheet  │
                        │  Table/Calendar View│
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  User Action?       │
                        └─┬──────┬──────┬────┬┘
                          │      │      │    │
              ┌───────────┘      │      │    └───────────┐
              │                  │      │                │
        ┌─────▼─────┐    ┌───────▼─┐  ┌▼────────┐  ┌───▼─────┐
        │   Add     │    │  Edit   │  │  Delete │  │  View   │
        │   Entry   │    │  Entry  │  │  Entry  │  │ Details │
        └─────┬─────┘    └───────┬─┘  └┬────────┘  └───┬─────┘
              │                  │     │               │
              └──────────┬───────┴─────┘               │
                         │                             │
                  ┌──────▼──────────────┐              │
                  │  Open Timesheet     │              │
                  │  Form Dialog        │              │
                  └──────┬──────────────┘              │
                         │                             │
                  ┌──────▼──────────────┐              │
                  │  Fill Form Fields:  │              │
                  │  - Date             │              │
                  │  - Verticle         │              │
                  │  - Country          │              │
                  │  - Task             │              │
                  │  - Description      │              │
                  │  - Hours            │              │
                  └──────┬──────────────┘              │
                         │                             │
                  ┌──────▼──────────────┐              │
                  │  Client-side        │              │
                  │  Validation (Zod)   │              │
                  └──────┬──────────────┘              │
                         │                             │
                  ┌──────▼──────────────┐              │
                  │  Valid?             │              │
                  └────┬────────┬───────┘              │
                    No │        │ Yes                  │
           ┌───────────┘        └──────┐               │
           │                           │               │
    ┌──────▼──────┐           ┌────────▼────────┐     │
    │ Show Error  │           │  POST/PUT       │     │
    │  Messages   │           │ /api/worklogs   │     │
    └─────────────┘           └────────┬────────┘     │
                                       │               │
                              ┌────────▼────────┐      │
                              │  Check User     │      │
                              │  Permissions    │      │
                              └────────┬────────┘      │
                                       │               │
                              ┌────────▼────────┐      │
                              │  Validate Data  │      │
                              │  on Server      │      │
                              └────────┬────────┘      │
                                       │               │
                              ┌────────▼────────┐      │
                              │  Save to MongoDB│      │
                              └────────┬────────┘      │
                                       │               │
                              ┌────────▼────────┐      │
                              │  Create Audit   │      │
                              │  Log Entry      │      │
                              └────────┬────────┘      │
                                       │               │
                              ┌────────▼────────┐      │
                              │  Return Success │      │
                              │  Response       │      │
                              └────────┬────────┘      │
                                       │               │
                                       └───────┬───────┘
                                               │
                                       ┌───────▼───────┐
                                       │  Refresh UI   │
                                       │  Show Success │
                                       │  Toast        │
                                       └───────┬───────┘
                                               │
                                       ┌───────▼───────┐
                                       │  Continue or  │
                                       │  Exit?        │
                                       └───┬───────┬───┘
                                           │       │
                                   ┌───────┘       └───────┐
                                   │                       │
                            ┌──────▼──────┐         ┌─────▼─────┐
                            │  Return to  │         │    END    │
                            │  Dashboard  │         └───────────┘
                            └─────────────┘
```

## 3. Leave Request Flow

```
                        ┌─────────────┐
                        │   START     │
                        └──────┬──────┘
                               │
                        ┌──────▼──────────────┐
                        │  User Clicks        │
                        │  Request Leave      │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Open Leave Form    │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Fill Form:         │
                        │  - Start Date       │
                        │  - End Date         │
                        │  - Leave Type       │
                        │  - Reason           │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  POST /api/leaves   │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Validate Request   │
                        │  Check Balance      │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Save to Database   │
                        │  Status: Pending    │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Send Notification  │
                        │  to Admin           │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Admin Reviews      │
                        │  Leave Request      │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Admin Action?      │
                        └─────┬────────┬──────┘
                              │        │
                    ┌─────────┘        └─────────┐
                    │                            │
            ┌───────▼────────┐         ┌─────────▼────────┐
            │   Approve      │         │    Reject        │
            └───────┬────────┘         └─────────┬────────┘
                    │                            │
            ┌───────▼────────┐         ┌─────────▼────────┐
            │  Update Status │         │  Update Status   │
            │  to Approved   │         │  to Rejected     │
            └───────┬────────┘         └─────────┬────────┘
                    │                            │
                    └────────────┬───────────────┘
                                 │
                        ┌────────▼────────┐
                        │  Send Email     │
                        │  Notification   │
                        │  to User        │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  Update Leave   │
                        │  Balance        │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │     END         │
                        └─────────────────┘
```

## 4. Password Reset Flow

```
                        ┌─────────────┐
                        │   START     │
                        └──────┬──────┘
                               │
                        ┌──────▼──────────────┐
                        │  User Clicks        │
                        │  Forgot Password    │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Enter Email        │
                        │  Address            │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  POST /api/auth/    │
                        │  forgot-password    │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Find User by Email │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  User Exists?       │
                        └────┬────────┬───────┘
                          No │        │ Yes
                 ┌───────────┘        └──────┐
                 │                           │
          ┌──────▼──────┐           ┌────────▼────────┐
          │ Show Generic│           │  Generate Token │
          │  Success    │           │  (Expires 1hr)  │
          │  Message    │           └────────┬────────┘
          └─────────────┘                    │
                 │                  ┌────────▼────────┐
                 │                  │  Save Token to  │
                 │                  │  Database       │
                 │                  └────────┬────────┘
                 │                           │
                 │                  ┌────────▼────────┐
                 │                  │  Send Email with│
                 │                  │  Reset Link     │
                 │                  └────────┬────────┘
                 │                           │
                 └────────────┬──────────────┘
                              │
                     ┌────────▼────────┐
                     │  User Clicks    │
                     │  Reset Link     │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  Open Reset     │
                     │  Password Page  │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  Enter New      │
                     │  Password       │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  POST /api/auth/│
                     │  reset-password │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  Validate Token │
                     └────┬───────┬────┘
                       No │       │ Yes
              ┌───────────┘       └──────┐
              │                          │
       ┌──────▼──────┐          ┌────────▼────────┐
       │ Show Error  │          │  Hash Password  │
       │  Invalid/   │          │  with bcryptjs  │
       │  Expired    │          └────────┬────────┘
       └─────────────┘                   │
              │                  ┌────────▼────────┐
              │                  │  Update User    │
              │                  │  Password       │
              │                  └────────┬────────┘
              │                           │
              │                  ┌────────▼────────┐
              │                  │  Delete Token   │
              │                  │  from Database  │
              │                  └────────┬────────┘
              │                           │
              │                  ┌────────▼────────┐
              │                  │  Show Success   │
              │                  │  Redirect Login │
              │                  └────────┬────────┘
              │                           │
              └────────────┬──────────────┘
                           │
                  ┌────────▼────────┐
                  │     END         │
                  └─────────────────┘
```

## 5. Admin User Management Flow

```
                        ┌─────────────┐
                        │   START     │
                        └──────┬──────┘
                               │
                        ┌──────▼──────────────┐
                        │  Admin Logs In      │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Navigate to        │
                        │  User Management    │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  GET /api/users     │
                        │  Fetch All Users    │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Display User List  │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Admin Action?      │
                        └──┬──────┬──────┬───┘
                           │      │      │
              ┌────────────┘      │      └──────────┐
              │                   │                 │
        ┌─────▼─────┐      ┌──────▼──────┐   ┌─────▼─────┐
        │  Create   │      │   Edit      │   │  Delete   │
        │  User     │      │   User      │   │   User    │
        └─────┬─────┘      └──────┬──────┘   └─────┬─────┘
              │                   │                 │
        ┌─────▼─────────┐   ┌─────▼─────────┐      │
        │  Open Form    │   │  Load User    │      │
        │  Fill Details:│   │  Edit Form    │      │
        │  - Name       │   │  Modify Data  │      │
        │  - Email      │   └─────┬─────────┘      │
        │  - Role       │         │                │
        │  - Password   │         │                │
        └─────┬─────────┘         │                │
              │                   │                │
        ┌─────▼─────────┐   ┌─────▼─────────┐      │
        │  POST         │   │  PUT          │      │
        │  /api/users   │   │  /api/users/:id│     │
        └─────┬─────────┘   └─────┬─────────┘      │
              │                   │                │
              └───────────┬───────┴────────────────┘
                          │
                  ┌───────▼────────┐
                  │  Validate Data │
                  │  Check Perms   │
                  └───────┬────────┘
                          │
                  ┌───────▼────────┐
                  │  Hash Password │
                  │  (if new/edit) │
                  └───────┬────────┘
                          │
                  ┌───────▼────────┐
                  │  Save to DB    │
                  └───────┬────────┘
                          │
                  ┌───────▼────────┐
                  │  Create Audit  │
                  │  Log Entry     │
                  └───────┬────────┘
                          │
                  ┌───────▼────────┐
                  │  Send Email    │
                  │  (if new user) │
                  └───────┬────────┘
                          │
                  ┌───────▼────────┐
                  │  Refresh List  │
                  │  Show Success  │
                  └───────┬────────┘
                          │
                  ┌───────▼────────┐
                  │     END        │
                  └────────────────┘
```

## 6. Notification Cron Job Flow

```
                        ┌─────────────┐
                        │   START     │
                        │  (Cron Job) │
                        └──────┬──────┘
                               │
                        ┌──────▼──────────────┐
                        │  Scheduled Trigger  │
                        │  (Daily/Hourly)     │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  GET /api/          │
                        │  notifications/cron │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Check System       │
                        │  Settings           │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Find Users with    │
                        │  Missing Timesheets │
                        └──────┬──────────────┘
                               │
                        ┌──────▼──────────────┐
                        │  Any Users Found?   │
                        └────┬────────┬───────┘
                          No │        │ Yes
                 ┌───────────┘        └──────┐
                 │                           │
          ┌──────▼──────┐           ┌────────▼────────┐
          │  Log: No    │           │  For Each User  │
          │  Action     │           └────────┬────────┘
          │  Needed     │                    │
          └──────┬──────┘           ┌────────▼────────┐
                 │                  │  Send Reminder  │
                 │                  │  Email          │
                 │                  └────────┬────────┘
                 │                           │
                 │                  ┌────────▼────────┐
                 │                  │  Log Notification│
                 │                  │  in Database    │
                 │                  └────────┬────────┘
                 │                           │
                 └────────────┬──────────────┘
                              │
                     ┌────────▼────────┐
                     │  Update System  │
                     │  Stats          │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │     END         │
                     └─────────────────┘
```

## Flow Implementation Files

- **Authentication**: [login/page.tsx](../src/app/login/page.tsx), [auth/login/route.ts](../src/app/api/auth/login/route.ts)
- **Timesheet**: [timesheet-form.tsx](../src/components/timesheet/timesheet-form.tsx), [worklogs/route.ts](../src/app/api/worklogs/route.ts)
- **Leave Management**: [leave-management.tsx](../src/components/admin/leave-management.tsx), [leaves/route.ts](../src/app/api/leaves/route.ts)
- **Password Reset**: [forgot-password/page.tsx](../src/app/forgot-password/page.tsx), [reset-password/page.tsx](../src/app/reset-password/page.tsx)
- **User Management**: [manage-users.tsx](../src/components/admin/manage-users.tsx), [users/route.ts](../src/app/api/users/route.ts)
- **Notifications**: [notification-service.ts](../src/lib/notification-service.ts), [notifications/cron/route.ts](../src/app/api/notifications/cron/route.ts)
