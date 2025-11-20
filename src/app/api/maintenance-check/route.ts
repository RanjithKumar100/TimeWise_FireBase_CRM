import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  return { maintenanceMode: false, maintenanceMessage: '' };
};

export async function GET(request: NextRequest) {
  try {
    const config = readConfig();
    
    return NextResponse.json({
      success: true,
      maintenanceMode: config.maintenanceMode || false,
      maintenanceMessage: config.maintenanceMessage || 'System is under maintenance. Please check back later.',
      systemName: config.systemName || 'TimeWise CRM'
    });

  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}