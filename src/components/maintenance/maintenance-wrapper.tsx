'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AlertTriangle, Wrench } from 'lucide-react';

interface MaintenanceWrapperProps {
  children: React.ReactNode;
}

export default function MaintenanceWrapper({ children }: MaintenanceWrapperProps) {
  const { user } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [systemName, setSystemName] = useState('TimeWise CRM');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/maintenance-check');
        if (response.ok) {
          const result = await response.json();
          setMaintenanceMode(result.maintenanceMode);
          setMaintenanceMessage(result.maintenanceMessage);
          setSystemName(result.systemName);
        }
      } catch (error) {
        console.error('Failed to check maintenance mode:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();

    // Listen for system config updates
    const handleConfigUpdate = () => {
      checkMaintenanceMode();
    };

    window.addEventListener('systemConfigUpdated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('systemConfigUpdated', handleConfigUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Show maintenance page for non-admin users when maintenance mode is enabled
  if (maintenanceMode && (!user || user.role !== 'Admin')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <Wrench className="w-8 h-8 text-amber-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {systemName}
            </h1>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-700">
                System Maintenance
              </h2>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {maintenanceMessage}
            </p>
            
            <div className="bg-amber-50 rounded-md p-4">
              <p className="text-sm text-amber-800">
                We apologize for any inconvenience. Please try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For admin users or when maintenance mode is off, show the normal content
  return <>{children}</>;
}