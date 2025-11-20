'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Cpu, HardDrive, Activity, Clock } from 'lucide-react';

interface ServerMetrics {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  heapUsed: number;
  uptime: number;
}

interface ServerMonitoringProps {
  serverData: any;
}

export function ServerMonitoring({ serverData }: ServerMonitoringProps) {
  const [metricsHistory, setMetricsHistory] = useState<ServerMetrics[]>([]);

  useEffect(() => {
    if (!serverData) return;

    const newMetric: ServerMetrics = {
      timestamp: new Date().toLocaleTimeString(),
      cpuUsage: Math.random() * 100, // In real app, get from server
      memoryUsage: ((serverData.totalMemory - serverData.freeMemory) / serverData.totalMemory) * 100,
      heapUsed: (serverData.memoryUsage.heapUsed / serverData.memoryUsage.heapTotal) * 100,
      uptime: serverData.uptime,
    };

    setMetricsHistory(prev => {
      const updated = [...prev, newMetric];
      return updated.slice(-20); // Keep last 20 data points
    });
  }, [serverData]);

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

  if (!serverData) return null;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Node Version</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serverData.nodeVersion}</div>
            <p className="text-xs text-muted-foreground">
              {serverData.platform} / {serverData.arch}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(serverData.uptime)}</div>
            <p className="text-xs text-muted-foreground">
              Since last restart
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Cores</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serverData.cpus}</div>
            <p className="text-xs text-muted-foreground">
              {serverData.hostname}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((1 - serverData.freeMemory / serverData.totalMemory) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(serverData.totalMemory - serverData.freeMemory)} / {formatBytes(serverData.totalMemory)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Memory Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Memory Usage Over Time</CardTitle>
            <CardDescription>System RAM utilization (live)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={metricsHistory}>
                <defs>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: any) => `${value.toFixed(1)}%`}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="memoryUsage"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#memoryGradient)"
                  name="Memory %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Heap Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Node.js Heap Usage</CardTitle>
            <CardDescription>JavaScript heap memory (live)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: any) => `${value.toFixed(1)}%`}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="heapUsed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 3 }}
                  name="Heap %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Memory Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Memory Breakdown</CardTitle>
          <CardDescription>Detailed memory allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Heap Used</p>
              <p className="text-xl font-bold mt-1">{formatBytes(serverData.memoryUsage.heapUsed)}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Heap Total</p>
              <p className="text-xl font-bold mt-1">{formatBytes(serverData.memoryUsage.heapTotal)}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">RSS</p>
              <p className="text-xl font-bold mt-1">{formatBytes(serverData.memoryUsage.rss)}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">External</p>
              <p className="text-xl font-bold mt-1">{formatBytes(serverData.memoryUsage.external)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Average (Unix/Linux) */}
      {serverData.loadAverage && serverData.loadAverage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Load Average</CardTitle>
            <CardDescription>1 min, 5 min, 15 min averages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">1 minute</p>
                <p className="text-2xl font-bold mt-2">{serverData.loadAverage[0].toFixed(2)}</p>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">5 minutes</p>
                <p className="text-2xl font-bold mt-2">{serverData.loadAverage[1].toFixed(2)}</p>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">15 minutes</p>
                <p className="text-2xl font-bold mt-2">{serverData.loadAverage[2].toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
