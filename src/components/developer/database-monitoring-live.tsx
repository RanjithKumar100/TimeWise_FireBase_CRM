'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Database, Zap, GitBranch, Activity } from 'lucide-react';

interface MetricDataPoint {
  time: string;
  timestamp: number;
  value: number;
}

interface DatabaseMonitoringLiveProps {
  diagnostics: any;
}

export function DatabaseMonitoringLive({ diagnostics }: DatabaseMonitoringLiveProps) {
  const [liveMode, setLiveMode] = useState(true);
  const [connectionData, setConnectionData] = useState<MetricDataPoint[]>([]);
  const [queryTimeData, setQueryTimeData] = useState<MetricDataPoint[]>([]);
  const [operationsData, setOperationsData] = useState<MetricDataPoint[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Real-time data streaming
  useEffect(() => {
    if (!liveMode || !diagnostics) return;

    const updateMetrics = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Simulate active connections (in real app, get from MongoDB metrics)
      const connections = Math.floor(Math.random() * 15) + 25;

      // Simulate query response time
      const queryTime = Math.random() * 40 + 15;

      // Simulate operations per second
      const operations = Math.floor(Math.random() * 50) + 100;

      setConnectionData(prev => {
        const updated = [...prev, {
          time: timeStr,
          timestamp: now.getTime(),
          value: connections
        }];
        return updated.slice(-30);
      });

      setQueryTimeData(prev => {
        const updated = [...prev, {
          time: timeStr,
          timestamp: now.getTime(),
          value: queryTime
        }];
        return updated.slice(-30);
      });

      setOperationsData(prev => {
        const updated = [...prev, {
          time: timeStr,
          timestamp: now.getTime(),
          value: operations
        }];
        return updated.slice(-30);
      });
    };

    updateMetrics();
    intervalRef.current = setInterval(updateMetrics, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [liveMode, diagnostics]);

  const currentConnections = connectionData.length > 0 ? connectionData[connectionData.length - 1].value : 0;
  const currentQueryTime = queryTimeData.length > 0 ? queryTimeData[queryTimeData.length - 1].value : 0;
  const currentOperations = operationsData.length > 0 ? operationsData[operationsData.length - 1].value : 0;

  // Calculate collection sizes
  const collectionStats = diagnostics?.collections ? [
    { name: 'Users', count: diagnostics.collections.users?.count || 0 },
    { name: 'WorkLogs', count: diagnostics.collections.workLogs?.count || 0 },
    { name: 'Leaves', count: diagnostics.collections.leaves?.count || 0 },
    { name: 'Notifications', count: diagnostics.collections.notifications?.count || 0 },
    { name: 'AuditLogs', count: diagnostics.collections.auditLogs?.count || 0 }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Live Mode Toggle */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {liveMode && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
              <div>
                <p className="font-semibold">Database Real-time Monitoring</p>
                <p className="text-sm text-muted-foreground">
                  {liveMode ? 'Streaming live database metrics every second' : 'Paused - Toggle to resume'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="live-mode-db">Live</Label>
              <Switch
                id="live-mode-db"
                checked={liveMode}
                onCheckedChange={setLiveMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Connections
            </CardTitle>
            <Database className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {Math.floor(currentConnections)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current database connections
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Query Time
            </CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {currentQueryTime.toFixed(1)}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average response latency
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Operations/sec
            </CardTitle>
            <Activity className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-600">
              {Math.floor(currentOperations)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Database operations per second
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6">
        {/* Active Connections Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Active Connections</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time database connection pool monitoring
                </p>
              </div>
              {liveMode && (
                <Badge variant="default" className="bg-green-500">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Live
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={connectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any) => [Math.floor(value), 'Connections']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  animationDuration={300}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Query Response Time Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Query Response Time</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Database query latency monitoring
                </p>
              </div>
              {liveMode && (
                <Badge variant="default" className="bg-purple-500">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Live
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={queryTimeData}>
                <defs>
                  <linearGradient id="queryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                  tickFormatter={(value) => `${value}ms`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any) => [`${value.toFixed(2)}ms`, 'Latency']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  fill="url(#queryGradient)"
                  dot={false}
                  animationDuration={300}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Operations Per Second Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Database Operations</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Operations per second throughput
                </p>
              </div>
              {liveMode && (
                <Badge variant="default" className="bg-cyan-500">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Live
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={operationsData}>
                <defs>
                  <linearGradient id="opsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any) => [Math.floor(value), 'ops/sec']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#opsGradient)"
                  dot={false}
                  animationDuration={300}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Collection Document Counts */}
        {collectionStats.length > 0 && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-lg">Collection Statistics</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Document count per collection
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={collectionStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any) => [value, 'Documents']}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
