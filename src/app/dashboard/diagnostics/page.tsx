'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  Server,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  HardDrive,
  Cpu,
  Clock,
  FileText,
  Users,
  Calendar,
  Settings,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticsData {
  timestamp: string;
  server: any;
  database: any;
  collections: any;
  systemConfig: any;
  apiEndpoints: any[];
  environment: any;
  health: any;
  errors: Array<{ category: string; message: string }>;
  warnings: Array<{ category: string; message: string }>;
}

export default function DiagnosticsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/diagnostics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setDiagnostics(result.data);
      } else {
        throw new Error('Failed to fetch diagnostics');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch diagnostics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchDiagnostics, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading && !diagnostics) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!diagnostics) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load diagnostics data</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">
            Developer testing and system health monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </Button>
          <Button onClick={fetchDiagnostics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            {diagnostics.health.status === 'Healthy' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {diagnostics.health.status}
            </div>
            <p className="text-xs text-muted-foreground">
              Last checked: {new Date(diagnostics.timestamp).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className={`h-4 w-4 ${diagnostics.database.status === 'Connected' ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostics.database.status}</div>
            <p className="text-xs text-muted-foreground">
              {diagnostics.database.connectionTime}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostics.health.errorCount}</div>
            <p className="text-xs text-muted-foreground">
              {diagnostics.health.warningCount} warnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Uptime</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUptime(diagnostics.server.uptime)}
            </div>
            <p className="text-xs text-muted-foreground">
              {diagnostics.server.platform} / {diagnostics.server.arch}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Errors and Warnings */}
      {(diagnostics.errors.length > 0 || diagnostics.warnings.length > 0) && (
        <div className="space-y-4">
          {diagnostics.errors.map((error, idx) => (
            <Alert key={`error-${idx}`} variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>{error.category}</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ))}
          {diagnostics.warnings.map((warning, idx) => (
            <Alert key={`warning-${idx}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{warning.category}</AlertTitle>
              <AlertDescription>{warning.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="server" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="server">Server</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="server" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Server Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Node Version</p>
                  <p className="text-sm text-muted-foreground">{diagnostics.server.nodeVersion}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Environment</p>
                  <p className="text-sm text-muted-foreground">{diagnostics.server.env}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Hostname</p>
                  <p className="text-sm text-muted-foreground">{diagnostics.server.hostname}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">CPUs</p>
                  <p className="text-sm text-muted-foreground">{diagnostics.server.cpus} cores</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Memory Usage
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Heap Used: {formatBytes(diagnostics.server.memoryUsage.heapUsed)}</div>
                  <div>Heap Total: {formatBytes(diagnostics.server.memoryUsage.heapTotal)}</div>
                  <div>RSS: {formatBytes(diagnostics.server.memoryUsage.rss)}</div>
                  <div>External: {formatBytes(diagnostics.server.memoryUsage.external)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  System Resources
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total Memory: {formatBytes(diagnostics.server.totalMemory)}</div>
                  <div>Free Memory: {formatBytes(diagnostics.server.freeMemory)}</div>
                  <div>Memory Used: {Math.round((1 - diagnostics.server.freeMemory / diagnostics.server.totalMemory) * 100)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={diagnostics.database.status === 'Connected' ? 'default' : 'destructive'}>
                    {diagnostics.database.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Ready State</p>
                  <p className="text-sm text-muted-foreground">{diagnostics.database.readyState}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Host</p>
                  <p className="text-sm text-muted-foreground">{diagnostics.database.host || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Database Name</p>
                  <p className="text-sm text-muted-foreground">{diagnostics.database.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Connection Time</p>
                  <p className="text-sm text-muted-foreground">{diagnostics.database.connectionTime}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Registered Models</p>
                <div className="flex flex-wrap gap-2">
                  {diagnostics.database.models?.map((model: string) => (
                    <Badge key={model} variant="outline">{model}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{diagnostics.collections.users?.count || 0}</div>
                <p className="text-xs text-muted-foreground">Total users in system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Work Logs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{diagnostics.collections.workLogs?.count || 0}</div>
                <p className="text-xs text-muted-foreground">Total time entries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leaves</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{diagnostics.collections.leaves?.count || 0}</div>
                <p className="text-xs text-muted-foreground">Leave records</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{diagnostics.collections.notifications?.count || 0}</div>
                <p className="text-xs text-muted-foreground">System notifications</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{diagnostics.collections.auditLogs?.count || 0}</div>
                <p className="text-xs text-muted-foreground">Audit trail entries</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Work Logs (Last 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diagnostics.collections.recentWorkLogs?.map((log: any) => (
                  <div key={log.logId} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{log.task}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.userId} • {new Date(log.date).toLocaleDateString()} • {log.hours}h {log.minutes}m
                      </p>
                    </div>
                    <Badge variant={log.status === 'approved' ? 'default' : 'destructive'}>
                      {log.status || 'approved'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Users (Last 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diagnostics.collections.recentUsers?.map((user: any) => (
                  <div key={user.userId} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{user.role}</Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                {JSON.stringify(diagnostics.systemConfig, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">MongoDB URI</p>
                  <Badge variant={diagnostics.environment.hasMongoUri ? 'default' : 'destructive'}>
                    {diagnostics.environment.hasMongoUri ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">JWT Secret</p>
                  <Badge variant={diagnostics.environment.hasJwtSecret ? 'default' : 'secondary'}>
                    {diagnostics.environment.hasJwtSecret ? 'Configured' : 'Using Default'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Node Environment</p>
                  <Badge variant="outline">{diagnostics.environment.nodeEnv}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Port</p>
                  <Badge variant="outline">{diagnostics.environment.port}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints Status</CardTitle>
              <CardDescription>Available REST API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diagnostics.apiEndpoints?.map((endpoint: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{endpoint.method}</Badge>
                      <code className="text-sm">{endpoint.path}</code>
                    </div>
                    <Badge variant="default">{endpoint.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
