import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const defaultSystemConfig = {
  // System Information
  systemName: 'TimeWise CRM',
  systemDescription: 'Comprehensive time tracking and management portal',
  maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. Please check back later.',
  
  // Work Log Settings
  maxHoursPerDay: 24,
  maxHoursPerWeek: 60,
  editTimeLimit: 2,
  allowPastDateEntry: true,
  allowFutureDate: false,
  
  // User Management
  defaultUserRole: 'User',
  requireEmailVerification: false,
  passwordMinLength: 6,
  passwordComplexity: false,
  
  // Business Rules
  workingDaysPerWeek: 5,
  standardWorkingHours: 8,
  overtimeThreshold: 40,
  
  // Available Options
  availableVerticles: ['CMIS', 'TRI', 'LOF', 'TRG'],
  availableCountries: ['USA', 'UK', 'Canada', 'Australia', 'Japan'],
  availableTasks: [
    'Video Editing',
    'Content Creation',
    'Meeting',
    'Documentation',
    'Development',
    'Design',
    'Research',
    'Testing',
    'Training',
    'Client Communication',
    'Graphic Design',
    'Sound Mixing',
    'Animation',
    'Project Management',
    'Quality Assurance',
    'Code Review'
  ]
};

const configFilePath = path.join(process.cwd(), 'config/system-config.json');

const readConfig = () => {
  try {
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading config file:', error);
  }
  return defaultSystemConfig;
};

const writeConfig = (config: any) => {
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing config file:', error);
    return false;
  }
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    
    try {
      jwt.verify(token, jwtSecret);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Read current config from file
    const currentConfig = readConfig();
    return NextResponse.json({
      success: true,
      data: currentConfig
    });

  } catch (error) {
    console.error('Error fetching system config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, jwtSecret) as any;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    if (decodedToken.role !== 'Admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    
    // Get current config to preserve existing values
    const currentConfig = readConfig();
    
    // Merge the new config with existing config
    const updatedConfig = {
      ...currentConfig,
      ...body
    };
    
    // Validate required arrays if they exist in the update
    if (body.availableVerticles && !Array.isArray(body.availableVerticles)) {
      return NextResponse.json({ error: 'availableVerticles must be an array' }, { status: 400 });
    }
    if (body.availableCountries && !Array.isArray(body.availableCountries)) {
      return NextResponse.json({ error: 'availableCountries must be an array' }, { status: 400 });
    }
    if (body.availableTasks && !Array.isArray(body.availableTasks)) {
      return NextResponse.json({ error: 'availableTasks must be an array' }, { status: 400 });
    }

    // Save complete config to file
    const savedSuccessfully = writeConfig(updatedConfig);

    if (!savedSuccessfully) {
      throw new Error('Failed to save config to file');
    }
    
    return NextResponse.json({
      success: true,
      message: 'System configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating system config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}