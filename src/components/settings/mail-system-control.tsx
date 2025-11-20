'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, MailX, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface MailSystemStatus {
  mailSystemEnabled: boolean;
  emailConfigured: boolean;
  emailHost: string;
  emailUser: string;
}

export function MailSystemControl() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [status, setStatus] = useState<MailSystemStatus | null>(null);

  const fetchMailSystemStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mail-system', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setStatus(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch mail system status');
      }
    } catch (error: any) {
      console.error('Error fetching mail system status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load mail system status',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMailSystem = async () => {
    if (!status) return;

    try {
      setToggling(true);
      const newState = !status.mailSystemEnabled;

      const response = await fetch('/api/mail-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`,
        },
        body: JSON.stringify({
          action: 'toggle',
          enabled: newState,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ ...status, mailSystemEnabled: newState });
        toast({
          title: newState ? 'Mail System Enabled' : 'Mail System Disabled',
          description: newState
            ? 'Email notifications will now be sent normally.'
            : 'All email notifications are now disabled.',
        });
      } else {
        throw new Error(data.message || 'Failed to toggle mail system');
      }
    } catch (error: any) {
      console.error('Error toggling mail system:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to toggle mail system',
      });
    } finally {
      setToggling(false);
    }
  };

  const clearNotifications = async (clearAll: boolean = false) => {
    try {
      setClearing(true);

      const response = await fetch('/api/mail-system/clear-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`,
        },
        body: JSON.stringify({ clearAll }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Notifications Cleared',
          description: `Successfully deleted ${data.data.deletedCount} notification records.`,
        });
      } else {
        throw new Error(data.message || 'Failed to clear notifications');
      }
    } catch (error: any) {
      console.error('Error clearing notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to clear notifications',
      });
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchMailSystemStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Failed to load mail system status
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {status.mailSystemEnabled ? (
                <Mail className="h-5 w-5 text-green-600" />
              ) : (
                <MailX className="h-5 w-5 text-red-600" />
              )}
              Mail System Control
            </CardTitle>
            <CardDescription>
              Developer-only controls for the email notification system
            </CardDescription>
          </div>
          <Badge variant={status.mailSystemEnabled ? 'default' : 'destructive'}>
            {status.mailSystemEnabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Mail System Status</Label>
              <p className="text-sm text-muted-foreground">
                {status.mailSystemEnabled
                  ? 'All email notifications are enabled and will be sent normally'
                  : 'All email notifications are disabled - no emails will be sent'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={status.mailSystemEnabled}
                onCheckedChange={toggleMailSystem}
                disabled={toggling}
              />
              {toggling && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>

          {/* Warning when disabled */}
          {!status.mailSystemEnabled && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-900">
                  Email System is Currently Disabled
                </p>
                <p className="text-sm text-red-700">
                  No emails will be sent for:
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1 ml-2">
                  <li>Missing timesheet reminders</li>
                  <li>Welcome emails for new users</li>
                  <li>Password reset requests</li>
                  <li>Any other system notifications</li>
                </ul>
              </div>
            </div>
          )}

          {/* Email Configuration Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {status.emailConfigured ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
                <Label className="text-sm font-semibold">Email Configuration</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {status.emailConfigured ? 'Configured' : 'Not Configured'}
              </p>
            </div>

            <div className="p-4 bg-secondary rounded-lg">
              <Label className="text-sm font-semibold mb-2 block">SMTP Server</Label>
              <p className="text-xs text-muted-foreground">{status.emailHost}</p>
            </div>

            <div className="p-4 bg-secondary rounded-lg col-span-2">
              <Label className="text-sm font-semibold mb-2 block">Email Account</Label>
              <p className="text-xs text-muted-foreground font-mono">{status.emailUser}</p>
            </div>
          </div>
        </div>

        {/* Notification Management */}
        <div className="space-y-4 pt-4 border-t">
          <div>
            <Label className="text-base font-semibold">Notification Database</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Clear staged or failed notifications from the database
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={clearing}>
                  {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Failed Notifications
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Failed Notifications?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all notification records where email sending failed. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => clearNotifications(false)}>
                    Clear Failed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={clearing}>
                  {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Notifications
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Notifications?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete ALL notification records from the database, including successfully sent ones. This action cannot be undone and will remove the notification history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => clearNotifications(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-base font-semibold">Quick Actions</Label>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMailSystemStatus}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Refresh Status
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
