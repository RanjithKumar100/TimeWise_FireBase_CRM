'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  Settings as SettingsIcon,
  Database
} from 'lucide-react';

import UserManagement from '@/components/settings/user-management';
import SystemSettings from '@/components/settings/system-settings';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      router.replace('/dashboard/user');
    }
  }, [user, router]);

  if (!user || user.role !== 'Admin') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Administrator access required to view settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Manage users and system configuration</p>
          </div>
        </div>
        <Badge variant="default" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Administrator Panel
        </Badge>
      </div>

      {/* Admin Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You have full administrative privileges. Please use these settings responsibly.
        </AlertDescription>
      </Alert>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            System Config
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="mt-6">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}