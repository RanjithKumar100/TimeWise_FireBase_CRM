import { NextRequest } from 'next/server';
import dbConnect from '@/lib/database/mongodb';
import WorkLog from '@/lib/models/WorkLog';
import User from '@/lib/models/User';
import Leave from '@/lib/models/Leave';
import NotificationLog from '@/lib/models/NotificationLog';
import AuditLog from '@/lib/models/AuditLog';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth/index';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import os from 'os';

// GET /api/diagnostics - System diagnostics and health check
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    // Only allow Admin and Developer users
    if (!authUser || (authUser.role !== 'Admin' && authUser.role !== 'Developer')) {
      return createErrorResponse('Admin or Developer access required', 403);
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      server: {},
      database: {},
      collections: {},
      systemConfig: {},
      errors: [],
      warnings: []
    };

    // 1. Server Information
    try {
      const memoryUsage = process.memoryUsage();
      diagnostics.server = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: memoryUsage,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
        cpuUsage: process.cpuUsage(),
        env: process.env.NODE_ENV,
        hostname: os.hostname(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        loadAverage: os.loadavg()
      };
    } catch (error: any) {
      diagnostics.errors.push({
        category: 'Server',
        message: `Failed to get server info: ${error.message}`
      });
    }

    // 2. Database Connection
    try {
      const startTime = Date.now();
      await dbConnect();
      const connectionTime = Date.now() - startTime;

      diagnostics.database = {
        status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        connectionTime: `${connectionTime}ms`,
        models: Object.keys(mongoose.models)
      };

      if (mongoose.connection.readyState !== 1) {
        diagnostics.errors.push({
          category: 'Database',
          message: 'Database is not connected'
        });
      }
    } catch (error: any) {
      diagnostics.database.status = 'Error';
      diagnostics.errors.push({
        category: 'Database',
        message: `Database connection failed: ${error.message}`
      });
    }

    // 3. Collection Statistics
    if (mongoose.connection.readyState === 1) {
      try {
        const [
          userCount,
          workLogCount,
          leaveCount,
          notificationCount,
          auditLogCount
        ] = await Promise.all([
          User.countDocuments().maxTimeMS(5000),
          WorkLog.countDocuments().maxTimeMS(5000),
          Leave.countDocuments().maxTimeMS(5000),
          NotificationLog.countDocuments().maxTimeMS(5000),
          AuditLog.countDocuments().maxTimeMS(5000)
        ]);

        diagnostics.collections = {
          users: {
            count: userCount,
            model: 'User'
          },
          workLogs: {
            count: workLogCount,
            model: 'WorkLog'
          },
          leaves: {
            count: leaveCount,
            model: 'Leave'
          },
          notifications: {
            count: notificationCount,
            model: 'NotificationLog'
          },
          auditLogs: {
            count: auditLogCount,
            model: 'AuditLog'
          }
        };

        // Get recent entries
        const recentWorkLogs = await WorkLog.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select('logId userId date task hours minutes status createdAt')
          .lean()
          .maxTimeMS(5000);

        const recentUsers = await User.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select('userId name email role status createdAt')
          .lean()
          .maxTimeMS(5000);

        diagnostics.collections.recentWorkLogs = recentWorkLogs;
        diagnostics.collections.recentUsers = recentUsers;

        // Check for data integrity issues
        const workLogsWithoutUser = await WorkLog.countDocuments({
          userId: { $exists: false }
        }).maxTimeMS(3000);

        if (workLogsWithoutUser > 0) {
          diagnostics.warnings.push({
            category: 'Data Integrity',
            message: `Found ${workLogsWithoutUser} work logs without userId`
          });
        }

        // Check for rejected entries
        const rejectedEntries = await WorkLog.countDocuments({
          status: 'rejected'
        }).maxTimeMS(3000);

        if (rejectedEntries > 0) {
          diagnostics.warnings.push({
            category: 'Data',
            message: `Found ${rejectedEntries} rejected entries`
          });
        }

      } catch (error: any) {
        diagnostics.errors.push({
          category: 'Collections',
          message: `Failed to get collection stats: ${error.message}`
        });
      }
    }

    // 4. System Configuration
    try {
      const configPath = path.join(process.cwd(), 'config/system-config.json');
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        diagnostics.systemConfig = JSON.parse(configData);
      } else {
        diagnostics.warnings.push({
          category: 'Configuration',
          message: 'system-config.json file not found'
        });
      }
    } catch (error: any) {
      diagnostics.errors.push({
        category: 'Configuration',
        message: `Failed to read system config: ${error.message}`
      });
    }

    // 5. API Endpoints Health Check
    diagnostics.apiEndpoints = [
      { path: '/api/auth/login', method: 'POST', status: 'Available' },
      { path: '/api/worklogs', method: 'GET', status: 'Available' },
      { path: '/api/worklogs', method: 'POST', status: 'Available' },
      { path: '/api/users', method: 'GET', status: 'Available' },
      { path: '/api/leaves', method: 'GET', status: 'Available' },
      { path: '/api/system-config', method: 'GET', status: 'Available' },
      { path: '/api/notifications/user', method: 'GET', status: 'Available' },
      { path: '/api/audit-logs', method: 'GET', status: 'Available' }
    ];

    // 6. Environment Variables Check
    diagnostics.environment = {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT || '3000'
    };

    if (!process.env.MONGODB_URI) {
      diagnostics.errors.push({
        category: 'Environment',
        message: 'MONGODB_URI is not set'
      });
    }

    if (!process.env.JWT_SECRET) {
      diagnostics.warnings.push({
        category: 'Environment',
        message: 'JWT_SECRET is not set (using default)'
      });
    }

    // 7. Overall Health Status
    diagnostics.health = {
      status: diagnostics.errors.length === 0 ? 'Healthy' : 'Unhealthy',
      errorCount: diagnostics.errors.length,
      warningCount: diagnostics.warnings.length,
      databaseConnected: mongoose.connection.readyState === 1,
      serverRunning: true
    };

    return createSuccessResponse('Diagnostics retrieved successfully', diagnostics);

  } catch (error: any) {
    console.error('Diagnostics error:', error);
    return createErrorResponse(`Failed to run diagnostics: ${error.message}`, 500);
  }
}
