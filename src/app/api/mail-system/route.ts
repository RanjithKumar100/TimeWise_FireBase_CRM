import { NextRequest } from 'next/server';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth/index';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'config/system-config.json');

// Helper function to read system config
const readSystemConfig = () => {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading system config:', error);
  }

  // Return default config
  return {
    editTimeLimit: 3,
    mailSystemEnabled: true,
  };
};

// Helper function to write system config
const writeSystemConfig = (config: any) => {
  try {
    console.log(`📂 Writing to file: ${CONFIG_FILE_PATH}`);
    console.log(`📄 Content to write:`, JSON.stringify(config, null, 2).substring(0, 200) + '...');

    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');

    console.log(`✅ File written successfully!`);

    // Verify the write
    const verification = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    const verifyConfig = JSON.parse(verification);
    console.log(`🔍 Verification - mailSystemEnabled in file: ${verifyConfig.mailSystemEnabled}`);

    return true;
  } catch (error) {
    console.error('❌ Error writing system config:', error);
    return false;
  }
};

// GET /api/mail-system - Get mail system status
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    // Only Developer and Admin can view mail system status
    if (authUser.role !== 'Developer' && authUser.role !== 'Admin') {
      return createErrorResponse('Developer or Admin access required', 403);
    }

    const config = readSystemConfig();

    return createSuccessResponse('Mail system status retrieved successfully', {
      mailSystemEnabled: config.mailSystemEnabled ?? true,
      emailConfigured: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS,
      emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
      emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***@${process.env.EMAIL_USER.split('@')[1]}` : 'not set',
    });

  } catch (error) {
    console.error('Get mail system status error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// POST /api/mail-system - Toggle mail system or perform actions
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    // Only Developer can modify mail system
    if (authUser.role !== 'Developer') {
      return createErrorResponse('Developer access required', 403);
    }

    const { action, enabled } = await request.json();

    const config = readSystemConfig();

    switch (action) {
      case 'toggle':
        if (typeof enabled !== 'boolean') {
          return createErrorResponse('enabled must be a boolean value', 400);
        }

        console.log(`🔧 Attempting to ${enabled ? 'ENABLE' : 'DISABLE'} mail system...`);
        console.log(`📝 Current config:`, config);

        config.mailSystemEnabled = enabled;
        console.log(`📝 Updated config:`, config);

        const saved = writeSystemConfig(config);
        console.log(`💾 File write result:`, saved);

        if (!saved) {
          console.error('❌ FAILED to write system-config.json file!');
          return createErrorResponse('Failed to save mail system configuration', 500);
        }

        console.log(`✅ Mail system ${enabled ? 'ENABLED' : 'DISABLED'} by ${authUser.name} (${authUser.userId})`);
        console.log(`📧 New status saved to file: mailSystemEnabled = ${enabled}`);

        return createSuccessResponse(
          `Mail system ${enabled ? 'enabled' : 'disabled'} successfully`,
          {
            mailSystemEnabled: config.mailSystemEnabled,
            updatedBy: authUser.name,
            updatedAt: new Date().toISOString(),
          }
        );

      default:
        return createErrorResponse('Invalid action. Valid action: toggle', 400);
    }

  } catch (error: any) {
    console.error('Mail system management error:', error);
    return createErrorResponse(error.message || 'Internal server error', 500);
  }
}
