'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Database, Zap, HardDrive, Activity } from 'lucide-react';

interface DatabaseMetrics {
  timestamp: string;
  connections: number;
  responseTime: number;
  queries: number;
}

interface DatabaseMonitoringProps {
  databaseData: any;
  collectionsData: any;
}

export function DatabaseMonitoring({ databaseData, collectionsData }: DatabaseMonitoringProps) {
  const [metricsHistory, setMetricsHistory] = useState<DatabaseMetrics[]>([]);

  useEffect(() => {
    if (!databaseData) return;

    const newMetric: DatabaseMetrics = {
      timestamp: new Date().toLocaleTimeString(),
      connections: Math.floor(Math.random() * 50) + 10, // Simulate
      responseTime: Math.random() * 100 + 10,
      queries: Math.floor(Math.random() * 200) + 50,
    };

    setMetricsHistory(prev => {
      const updated = [...prev, newMetric];
      return updated.slice(-15);
    });
  }, [databaseData]);

  if (!databaseData) return null;

  const collectionStats = collectionsData ? [
    { name: 'Users', count: collectionsData.users || 0, color: '#3b82f6' },
    { name: 'WorkLogs', count: collectionsData.worklogs || 0, color: '#10b981' },
    { name: 'Leaves', count: collectionsData.leaves || 0, color: '#f59e0b' },
    { name: 'Notifications', count: collectionsData.notifications || 0, color: '#8b5cf6' },
    { name: 'Audit Logs', count: collectionsData.auditLogs || 0, color: '#06b6d4' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Connection Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={databaseData.status === 'Connected' ? 'default' : 'destructive'}>
                {databaseData.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              State: {databaseData.readyState}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Name</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{databaseData.name}</div>
            <p className="text-xs text-muted-foreground">
              {databaseData.host}:{databaseData.port}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{databaseData.connectionTime}</div>
            <p className="text-xs text-muted-foreground">
              Last query
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Models</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{databaseData.models?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered schemas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Query Response Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Query Response Time</CardTitle>
            <CardDescription>Database query latency (ms)</CardDescription>
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
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 3 }}
                  name="Response (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Connections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Connections</CardTitle>
            <CardDescription>Database connection pool</CardDescription>
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
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="connections"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  name="Connections"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Collection Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Collection Document Counts</CardTitle>
          <CardDescription>Number of documents per collection</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collectionStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <Bar dataKey="count" name="Documents">
                {collectionStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Registered Models */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registered Models</CardTitle>
          <CardDescription>Mongoose schema models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {databaseData.models?.map((model: string, index: number) => (
              <Badge key={index} variant="outline">
                {model}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Import Cell for BarChart colors
import { Cell } from 'recharts';
