'use client';

import React from 'react';
import { AlertTriangle, Database, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDatabaseConnection, DatabaseStatus } from '@/hooks/use-database-connection';

interface DatabaseStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function DatabaseStatusIndicator({ 
  className = '', 
  showDetails = false 
}: DatabaseStatusIndicatorProps) {
  const { dbStatus, isChecking, refreshConnection, isConnected } = useDatabaseConnection();

  const getStatusColor = (status: DatabaseStatus['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: DatabaseStatus['status']) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    switch (dbStatus.status) {
      case 'connected': return <Database className="h-4 w-4 text-green-600" />;
      case 'connecting': return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  if (showDetails) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            {getStatusIcon()}
            Database Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-2">
            <Badge 
              variant={isConnected ? 'default' : 'destructive'}
              className={isConnected ? 'bg-green-600' : ''}
            >
              {getStatusText(dbStatus.status)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshConnection}
              disabled={isChecking}
              className="h-6 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {dbStatus.error && (
            <p className="text-xs text-red-600 mb-2">{dbStatus.error}</p>
          )}
          
          {dbStatus.details && isConnected && (
            <div className="text-xs text-muted-foreground">
              <p>Host: {dbStatus.details.host}:{dbStatus.details.port}</p>
              <p>Database: {dbStatus.details.name}</p>
            </div>
          )}
          
          {dbStatus.lastChecked && (
            <p className="text-xs text-muted-foreground mt-1">
              Last checked: {dbStatus.lastChecked.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Compact indicator for header
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!isConnected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshConnection}
          disabled={isChecking}
          className="h-6 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}

interface DatabaseErrorFallbackProps {
  error?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export function DatabaseErrorFallback({ 
  error = "Unable to connect to database", 
  onRetry,
  children 
}: DatabaseErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">
        <WifiOff className="h-12 w-12 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900">Database Connection Issue</h3>
      </div>
      
      <Alert className="max-w-md mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>

      {children}

      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

interface ConditionalDataLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoadingDuringCheck?: boolean;
}

export function ConditionalDataLoader({ 
  children, 
  fallback,
  showLoadingDuringCheck = true 
}: ConditionalDataLoaderProps) {
  const { dbStatus, isChecking, refreshConnection, isConnected } = useDatabaseConnection();

  if (!isConnected) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <DatabaseErrorFallback 
        error={dbStatus.error || "Database is not connected. Your timesheet data cannot be loaded."}
        onRetry={refreshConnection}
      >
        <p className="text-sm text-muted-foreground mb-2">
          This might be due to:
        </p>
        <ul className="text-sm text-muted-foreground text-left max-w-sm">
          <li>• Database server is offline</li>
          <li>• Network connectivity issues</li>
          <li>• Temporary maintenance</li>
        </ul>
      </DatabaseErrorFallback>
    );
  }

  if (isChecking && showLoadingDuringCheck && dbStatus.status === 'unknown') {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary mr-3" />
        <span className="text-muted-foreground">Checking database connection...</span>
      </div>
    );
  }

  return <>{children}</>;
}