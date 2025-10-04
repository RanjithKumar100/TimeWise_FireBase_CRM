'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Send, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Settings,
  TestTube
} from 'lucide-react';

interface MissingEntry {
  userId: string;
  userName: string;
  userEmail: string;
  missingDates: Date[];
  daysRemaining: number;
}

interface NotificationResult {
  userId: string;
  userName: string;
  userEmail: string;
  success: boolean;
  error?: string;
  missingDates: Date[];
  daysRemaining: number;
  skipped?: boolean;
  skipReason?: string;
}

interface NotificationStats {
  totalNotifications: number;
  successfulNotifications: number;
  failedNotifications: number;
  notificationsByType: any[];
  recentNotifications: any[];
}

export default function NotificationManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingMissing, setCheckingMissing] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [missingEntries, setMissingEntries] = useState<MissingEntry[]>([]);
  const [notificationResults, setNotificationResults] = useState<NotificationResult[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [cronStatus, setCronStatus] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
    loadCronStatus();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load notification data');
      }

      const result = await response.json();
      setStats(result.data.stats);
      setEmailConfigured(result.data.emailConfigured);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load notification data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCronStatus = async () => {
    try {
      const response = await fetch('/api/notifications/cron', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCronStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to load cron status:', error);
    }
  };

  const checkForMissingEntries = async () => {
    setCheckingMissing(true);
    try {
      const response = await fetch('/api/notifications?action=check-missing', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check for missing entries');
      }

      const result = await response.json();
      setMissingEntries(result.data.missingEntries);
      setEmailConfigured(result.data.emailConfigured);

      toast({
        title: "Check Completed",
        description: `Found ${result.data.totalUsersWithMissingEntries} users with missing timesheet entries`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check for missing entries",
        variant: "destructive",
      });
    } finally {
      setCheckingMissing(false);
    }
  };

  const sendNotifications = async (forceResend: boolean = false) => {
    if (!emailConfigured) {
      toast({
        title: "Email Not Configured",
        description: "Please configure email settings before sending notifications",
        variant: "destructive",
      });
      return;
    }

    setSendingNotifications(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        },
        body: JSON.stringify({
          action: 'send-missing-entry-notifications',
          forceResend
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notifications');
      }

      const result = await response.json();
      setNotificationResults(result.data.results);
      
      toast({
        title: "Notifications Sent",
        description: `${result.data.successCount} sent, ${result.data.failedCount} failed, ${result.data.skippedCount} skipped`,
      });

      // Refresh stats
      loadInitialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send notifications",
        variant: "destructive",
      });
    } finally {
      setSendingNotifications(false);
    }
  };

  const testEmailConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        },
        body: JSON.stringify({
          action: 'test-email-config'
        })
      });

      if (!response.ok) {
        throw new Error('Email configuration test failed');
      }

      const result = await response.json();
      toast({
        title: "Email Test Successful",
        description: result.data.message,
      });
      setEmailConfigured(true);
    } catch (error: any) {
      toast({
        title: "Email Test Failed",
        description: error.message || "Email configuration test failed",
        variant: "destructive",
      });
      setEmailConfigured(false);
    } finally {
      setLoading(false);
    }
  };

  const triggerDailyCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        },
        body: JSON.stringify({
          action: 'trigger-daily-check'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger daily check');
      }

      const result = await response.json();
      setNotificationResults(result.data.results || []);
      
      toast({
        title: "Daily Check Completed",
        description: `${result.data.summary?.sent || 0} notifications sent`,
      });

      loadInitialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to trigger daily check",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading && !stats) {
    return <div className="flex items-center justify-center p-8">Loading notification management...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Management</h2>
          <p className="text-muted-foreground">Manage timesheet reminder notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={emailConfigured ? "default" : "destructive"} className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Email {emailConfigured ? 'Configured' : 'Not Configured'}
          </Badge>
        </div>
      </div>

      {/* Email Configuration Alert */}
      {!emailConfigured && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Email is not configured. Please set up email credentials in your environment variables:
            EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT, EMAIL_SECURE
            <Button onClick={testEmailConfiguration} className="ml-4" size="sm" variant="outline">
              <TestTube className="w-4 h-4 mr-2" />
              Test Configuration
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="quick-actions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="recent">Recent Results</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Check Missing Entries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Check which users have missing timesheet entries.
                </p>
                <Button 
                  onClick={checkForMissingEntries} 
                  disabled={checkingMissing}
                  className="w-full"
                >
                  {checkingMissing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Check Missing Entries
                </Button>
                {missingEntries.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Found {missingEntries.length} users with missing entries:</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {missingEntries.map((entry, index) => (
                        <div key={index} className="text-sm border-l-2 border-amber-500 pl-3">
                          <div className="font-medium">{entry.userName}</div>
                          <div className="text-muted-foreground">
                            Missing: {entry.missingDates.map(d => formatDate(d)).join(', ')}
                          </div>
                          <div className="text-amber-600 font-medium">
                            {entry.daysRemaining} {entry.daysRemaining === 1 ? 'day' : 'days'} remaining
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Send email notifications to users with missing timesheet entries.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => sendNotifications(false)} 
                    disabled={sendingNotifications || !emailConfigured}
                    className="w-full"
                  >
                    {sendingNotifications && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                    Send New Notifications
                  </Button>
                  <Button 
                    onClick={() => sendNotifications(true)} 
                    disabled={sendingNotifications || !emailConfigured}
                    variant="outline"
                    className="w-full"
                  >
                    Force Resend All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Total Sent (30 days)</p>
                      <p className="text-2xl font-bold">{stats.totalNotifications}</p>
                    </div>
                    <Mail className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Successful</p>
                      <p className="text-2xl font-bold text-green-600">{stats.successfulNotifications}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{stats.failedNotifications}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Success Rate</p>
                      <p className="text-2xl font-bold">
                        {stats.totalNotifications > 0 
                          ? Math.round((stats.successfulNotifications / stats.totalNotifications) * 100)
                          : 0}%
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {notificationResults.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Notification Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notificationResults.map((result, index) => (
                    <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.userName}</span>
                          {result.success && !result.skipped && (
                            <Badge variant="default" className="text-xs">Sent</Badge>
                          )}
                          {result.skipped && (
                            <Badge variant="secondary" className="text-xs">Skipped</Badge>
                          )}
                          {!result.success && (
                            <Badge variant="destructive" className="text-xs">Failed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{result.userEmail}</p>
                        <p className="text-sm">
                          Missing: {result.missingDates.map(d => formatDate(d)).join(', ')}
                        </p>
                        <p className="text-sm text-amber-600">
                          {result.daysRemaining} {result.daysRemaining === 1 ? 'day' : 'days'} remaining
                        </p>
                        {result.error && (
                          <p className="text-sm text-red-600">{result.error}</p>
                        )}
                        {result.skipReason && (
                          <p className="text-sm text-muted-foreground">{result.skipReason}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        {result.success && !result.skipped && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {result.skipped && <Clock className="w-5 h-5 text-gray-600" />}
                        {!result.success && <XCircle className="w-5 h-5 text-red-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No recent notification results to display</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Automated Daily Checks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cronStatus ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cron Jobs Enabled:</span>
                      <Badge variant={cronStatus.enabled ? "default" : "secondary"}>
                        {cronStatus.enabled ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Schedule:</span>
                      <span className="text-sm font-mono">{cronStatus.cronDescription}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Timezone:</span>
                      <span className="text-sm">{cronStatus.timezone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daily Check Job:</span>
                      <Badge variant={cronStatus.jobs['daily-notification-check'] ? "default" : "secondary"}>
                        {cronStatus.jobs['daily-notification-check'] ? 'Running' : 'Stopped'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading automation status...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Manual Trigger
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manually trigger the daily check process to test automation.
                </p>
                <Button 
                  onClick={triggerDailyCheck} 
                  disabled={loading || !emailConfigured}
                  className="w-full"
                >
                  {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Trigger Daily Check
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}