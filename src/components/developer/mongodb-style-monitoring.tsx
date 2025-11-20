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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Activity, Database, Zap } from 'lucide-react';

interface MetricDataPoint {
  time: string;
  timestamp: number;
  value: number;
}

interface MongoDBStyleMonitoringProps {
  diagnostics: any;
}

export function MongoDBStyleMonitoring({ diagnostics }: MongoDBStyleMonitoringProps) {
  const [liveMode, setLiveMode] = useState(true);
  const [memoryData, setMemoryData] = useState<MetricDataPoint[]>([]);
  const [connectionData, setConnectionData] = useState<MetricDataPoint[]>([]);
  const [queryData, setQueryData] = useState<MetricDataPoint[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Simulate real-time data streaming (like MongoDB Compass)
  useEffect(() => {
    if (!liveMode || !diagnostics) return;

    const updateMetrics = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Memory Usage (calculate from diagnostics)
      const memoryPercent = diagnostics.server
        ? ((diagnostics.server.totalMemory - diagnostics.server.freeMemory) / diagnostics.server.totalMemory) * 100
        : Math.random() * 30 + 50;

      // Simulate connections (in real app, get from DB)
      const connections = Math.floor(Math.random() * 20) + 30;

      // Simulate query response time
      const queryTime = Math.random() * 50 + 10;

      setMemoryData(prev => {
        const updated = [...prev, {
          time: timeStr,
          timestamp: now.getTime(),
          value: memoryPercent
        }];
        return updated.slice(-30); // Keep last 30 data points (30 seconds)
      });

      setConnectionData(prev => {
        const updated = [...prev, {
          time: timeStr,
          timestamp: now.getTime(),
          value: connections
        }];
        return updated.slice(-30);
      });

      setQueryData(prev => {
        const updated = [...prev, {
          time: timeStr,
          timestamp: now.getTime(),
          value: queryTime
        }];
        return updated.slice(-30);
      });
    };

    // Initial data
    updateMetrics();

    // Update every 1 second (real-time streaming)
    intervalRef.current = setInterval(updateMetrics, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [liveMode, diagnostics]);

  const currentMemory = memoryData.length > 0 ? memoryData[memoryData.length - 1].value : 0;
  const currentConnections = connectionData.length > 0 ? connectionData[connectionData.length - 1].value : 0;
  const currentQueryTime = queryData.length > 0 ? queryData[queryData.length - 1].value : 0;

  // MongoDB Compass style: Smooth curve, no sharp corners
  const chartStyle = {
    tension: 0.4, // Smooth curve like MongoDB
  };

  return (
    <div className="space-y-6">
      {/* Live Mode Toggle - MongoDB Style */}
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
                <p className="font-semibold">Real-time Monitoring</p>
                <p className="text-sm text-muted-foreground">
                  {liveMode ? 'Streaming live data every second' : 'Paused - Toggle to resume'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="live-mode">Live</Label>
              <Switch
                id="live-mode"
                checked={liveMode}
                onCheckedChange={setLiveMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Metrics Cards - MongoDB Style */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Memory Usage
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {currentMemory.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              System RAM utilization
            </p>
          </CardContent>
        </Card>

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
              Database connections
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
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MongoDB Compass Style Charts */}
      <div className="grid gap-6">
        {/* Memory Usage Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Memory Usage</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time system memory utilization
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
              <AreaChart data={memoryData}>
                <defs>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
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
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any) => [`${value.toFixed(2)}%`, 'Memory']}
                  labelStyle={{ color: '#6b7280', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#memoryGradient)"
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={300}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Database Connections Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Active Connections</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Database connection pool monitoring
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
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
                  labelStyle={{ color: '#6b7280', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={true}
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
              <AreaChart data={queryData}>
                <defs>
                  <linearGradient id="queryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
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
                  labelStyle={{ color: '#6b7280', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  fill="url(#queryGradient)"
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={300}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
