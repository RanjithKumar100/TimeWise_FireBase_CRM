import { useState, useEffect, useCallback } from 'react';

export interface DatabaseStatus {
  status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'unknown';
  isHealthy: boolean;
  lastChecked: Date | null;
  error?: string;
  details?: {
    host?: string;
    port?: number;
    name?: string;
    readyState?: number;
  };
}

export function useDatabaseConnection(checkInterval: number = 30000) {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    status: 'unknown',
    isHealthy: false,
    lastChecked: null
  });
  
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    if (isChecking) return; // Prevent concurrent checks
    
    setIsChecking(true);
    
    try {
      const response = await fetch('/api/health/db', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setDbStatus({
          status: 'connected',
          isHealthy: true,
          lastChecked: new Date(),
          details: data.data
        });
      } else {
        const errorData = data.error || data.data || {};
        setDbStatus({
          status: errorData.status || 'error',
          isHealthy: false,
          lastChecked: new Date(),
          error: errorData.error || data.message || 'Connection check failed',
          details: errorData
        });
      }
    } catch (error: any) {
      setDbStatus({
        status: 'disconnected',
        isHealthy: false,
        lastChecked: new Date(),
        error: error.message || 'Network error during health check'
      });
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  // Initial check on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Periodic health checks
  useEffect(() => {
    if (checkInterval <= 0) return; // Disable periodic checks if interval is 0 or negative
    
    const interval = setInterval(() => {
      checkConnection();
    }, checkInterval);

    return () => clearInterval(interval);
  }, [checkConnection, checkInterval]);

  // Manual refresh function
  const refreshConnection = useCallback(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    dbStatus,
    isChecking,
    refreshConnection,
    isConnected: dbStatus.isHealthy,
    connectionStatus: dbStatus.status
  };
}