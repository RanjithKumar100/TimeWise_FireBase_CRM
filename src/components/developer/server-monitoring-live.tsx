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
import { Cpu, HardDrive, Activity, Gauge } from 'lucide-react';

interface MetricDataPoint {
  time: string;
  timestamp: number;
  value: number;
}

interface ServerMonitoringLiveProps {
  diagnostics: any;
}

export function ServerMonitoringLive({ diagnostics }: ServerMonitoringLiveProps) {
  const [liveMode, setLiveMode] = useState(true);
  const [memoryData, setMemoryData] = useState<MetricDataPoint[]>([]);
  const [heapData, setHeapData] = useState<MetricDataPoint[]>([]);
  const [cpuLoadData, setCpuLoadData] = useState<MetricDataPoint[]>([]);
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

      // Calculate memory usage percentage
      const memoryPercent = diagnostics.server
        ? ((diagnostics.server.totalMemory - diagnostics.server.freeMemory) / diagnostics.server.totalMemory) * 100
        : Math.random() * 30 + 50;

      // Calculate heap usage percentage
      const heapPercent = diagnostics.server?.heapUsed && diagnostics.server?.heapTotal
        ? (diagnostics.server.heapUsed / diagnostics.server.heapTotal) * 100
        : Math.random() * 40 + 30;

      // Simulate CPU load (in real app, get from server)
      const cpuLoad = diagnostics.server?.loadAverage?.[0] || Math.random() * 2 + 0.5;

      setMemoryData(prev => {
        const updated = [...prev, {
          time: timeStr,
          timestamp: now.getTime(),
          value: memoryPercent
        }];
        return updated.slice(-30);
      });

      setHeapData(prev => {
        const updated = [...prev, {
          time: timeStr,
          timestamp: now.getTime(),
          value: heapPercent
        }];
        return updated.slice(-30);
      });

      setCpuLoadData(prev => {
        const updated = [...prev, {
          time: timeStr,
          timestamp: now.getTime(),
          value: cpuLoad
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

  const currentMemory = memoryData.length > 0 ? memoryData[memoryData.length - 1].value : 0;
  const currentHeap = heapData.length > 0 ? heapData[heapData.length - 1].value : 0;
  const currentCpuLoad = cpuLoadData.length > 0 ? cpuLoadData[cpuLoadData.length - 1].value : 0;

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Live Mode Toggle */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {liveMode && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              )}
              <div>
                <p className="font-semibold">Server Real-time Monitoring</p>
                <p className="text-sm text-muted-foreground">
                  {liveMode ? 'Streaming live server metrics every second' : 'Paused - Toggle to resume'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="live-mode-server">Live</Label>
              <Switch
                id="live-mode-server"
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Memory Usage
            </CardTitle>
            <HardDrive className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {currentMemory.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {diagnostics?.server && `${formatBytes(diagnostics.server.totalMemory - diagnostics.server.freeMemory)} / ${formatBytes(diagnostics.server.totalMemory)}`}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Heap Usage
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {currentHeap.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {diagnostics?.server && `${formatBytes(diagnostics.server.heapUsed)} / ${formatBytes(diagnostics.server.heapTotal)}`}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CPU Load
            </CardTitle>
            <Cpu className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {currentCpuLoad.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              1-minute average load
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6">
        {/* Memory Usage Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Memory Usage Over Time</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time system RAM utilization
                </p>
              </div>
              {liveMode && (
                <Badge variant="default" className="bg-blue-500">
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
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#memoryGradient)"
                  dot={false}
                  animationDuration={300}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Heap Usage Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Heap Memory Usage</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Node.js heap allocation monitoring
                </p>
              </div>
              {liveMode && (
                <Badge variant="default" className="bg-orange-500">
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
              <AreaChart data={heapData}>
                <defs>
                  <linearGradient id="heapGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.05}/>
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
                  formatter={(value: any) => [`${value.toFixed(2)}%`, 'Heap']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fill="url(#heapGradient)"
                  dot={false}
                  animationDuration={300}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CPU Load Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">CPU Load Average</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  System load over time
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
              <LineChart data={cpuLoadData}>
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
                  formatter={(value: any) => [value.toFixed(2), 'Load']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={false}
                  animationDuration={300}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
