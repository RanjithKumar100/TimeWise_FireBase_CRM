'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  Mail,
  Users,
  Database,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MonitoringData {
  timestamp: string;
  timeRange: string;
  stats: {
    users: {
      total: number;
      active: number;
      inactive: number;
    };
    worklogs: {
      total: number;
      recent: number;
    };
    notifications: {
      total: number;
      successful: number;
      failed: number;
      successRate: number;
    };
    database: {
      collections: number;
      dataSize: number;
      storageSize: number;
      indexes: number;
    };
  };
  charts: {
    emailActivity: Array<{
      time: string;
      sent: number;
      failed: number;
    }>;
    notificationTypes: Array<{
      type: string;
      total: number;
      successful: number;
      failed: number;
    }>;
  };
  recentEvents: Array<{
    timestamp: string;
    type: string;
    description: string;
    status: string;
  }>;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
};

export function LiveMonitoring() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [data, setData] = useState<MonitoringData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/monitoring?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`,
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setLastUpdate(new Date());
      } else {
        throw new Error(result.message || 'Failed to fetch monitoring data');
      }
    } catch (error: any) {
      console.error('Error fetching monitoring data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load monitoring data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [timeRange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchMonitoringData, 10000); // Refresh every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, timeRange]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Failed to load monitoring data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Live System Monitoring</CardTitle>
                <CardDescription>
                  Real-time system metrics and analytics
                  {lastUpdate && (
                    <span className="ml-2 text-xs">
                      • Last updated: {lastUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {autoRefresh && (
                <Badge variant="default" className="flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMonitoringData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Auto Refresh Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label className="text-sm">Auto-refresh (10s)</Label>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Time Range:</Label>
              <div className="flex gap-1">
                {['1h', '6h', '24h', '7d'].map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Email Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Success Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.stats.notifications.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.stats.notifications.successful} sent / {data.stats.notifications.failed} failed
            </p>
            <div className="mt-2 flex items-center gap-1">
              {data.stats.notifications.successRate >= 95 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Excellent</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-amber-600" />
                  <span className="text-xs text-amber-600">Needs attention</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.stats.users.active}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.stats.users.total} total • {data.stats.users.inactive} inactive
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              {((data.stats.users.active / data.stats.users.total) * 100).toFixed(0)}% active
            </div>
          </CardContent>
        </Card>

        {/* Recent Worklogs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Work Entries</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.stats.worklogs.recent}
            </div>
            <p className="text-xs text-muted-foreground">
              in last {timeRange} • {data.stats.worklogs.total} total
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              {(data.stats.worklogs.recent / data.stats.users.active).toFixed(1)} per active user
            </div>
          </CardContent>
        </Card>

        {/* Database Size */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {formatBytes(data.stats.database.dataSize)}
            </div>
            <p className="text-xs text-muted-foreground">
              Storage: {formatBytes(data.stats.database.storageSize)}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              {data.stats.database.collections} collections • {data.stats.database.indexes} indexes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Email Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Activity Over Time</CardTitle>
            <CardDescription>Sent vs Failed emails in {timeRange}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.charts.emailActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sent"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  name="Sent"
                  dot={{ fill: COLORS.success, r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke={COLORS.danger}
                  strokeWidth={2}
                  name="Failed"
                  dot={{ fill: COLORS.danger, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Notification Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification Types Distribution</CardTitle>
            <CardDescription>Breakdown by notification type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.charts.notificationTypes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="successful" stackId="a" fill={COLORS.success} name="Successful" />
                <Bar dataKey="failed" stackId="a" fill={COLORS.danger} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Live Event Feed
          </CardTitle>
          <CardDescription>Real-time system events and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.recentEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent events
              </div>
            ) : (
              data.recentEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <div className="mt-0.5">
                    {event.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {event.status === 'failed' && (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    {event.status === 'info' && (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{event.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(event.timestamp)} • {event.type}
                    </p>
                  </div>
                  <Badge
                    variant={
                      event.status === 'success' ? 'default' :
                      event.status === 'failed' ? 'destructive' :
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {event.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
