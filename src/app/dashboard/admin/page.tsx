
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Employee } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Hourglass, BarChart, Users, Shield, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

import TimesheetTableWithPermissions from '@/components/timesheet/timesheet-table-with-permissions';
import CalendarView from '@/components/timesheet/calendar-view';
import TeamSummary from '@/components/reports/team-summary';
import StatsCard from '@/components/dashboard/stats-card';
import ManageUsers from '@/components/admin/manage-users';
import TimesheetForm from '@/components/timesheet/timesheet-form';

interface WorkLogEntry {
  id: string;
  date: Date;
  verticle: string;
  country: string;
  task: string;
  hours: number;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeRole: string;
  createdAt: Date;
  updatedAt: Date;
  canEdit: boolean;
  canDelete: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Employee[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<WorkLogEntry | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      const usersData = result.data.users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        department: 'General',
        joinedAt: new Date(user.createdAt),
      }));
      setUsers(usersData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const fetchWorkLogs = async () => {
    try {
      const response = await fetch('/api/worklogs?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch work logs');
      }

      const result = await response.json();
      const logs = result.data.workLogs.map((log: any) => ({
        ...log,
        date: new Date(log.date),
        createdAt: new Date(log.createdAt),
        updatedAt: new Date(log.updatedAt),
      }));
      setWorkLogs(logs);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch work logs",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Redirect if not an admin
    if (user && user.role !== 'Admin') {
      router.replace('/dashboard/user');
      return;
    }
    
    if (user && user.role === 'Admin') {
      setLoading(true);
      Promise.all([fetchUsers(), fetchWorkLogs()])
        .finally(() => setLoading(false));
    }
  }, [user, router]);
  
  const handleUserAdded = (newUser: Employee) => {
    setUsers(prev => [...prev, newUser]);
    fetchUsers(); // Refresh users list
  };

  const handleSaveEntry = async (newEntry: any) => {
    if (!user) return;

    try {
      if (editingEntry) {
        // Update existing entry
        const response = await fetch(`/api/worklogs/${editingEntry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
          },
          body: JSON.stringify({
            date: newEntry.date.toISOString().split('T')[0],
            verticle: newEntry.verticle,
            country: newEntry.country,
            task: newEntry.task,
            hoursSpent: newEntry.hours,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update work log');
        }

        const result = await response.json();
        const updatedLog = {
          ...result.data.workLog,
          date: new Date(result.data.workLog.date),
          createdAt: new Date(result.data.workLog.createdAt),
          updatedAt: new Date(result.data.workLog.updatedAt),
        };

        setWorkLogs(prevLogs => 
          prevLogs.map(log => 
            log.id === editingEntry.id ? updatedLog : log
          )
        );
        setEditingEntry(null);

        toast({
          title: "Success",
          description: "Work log updated successfully",
        });
      } else {
        // Create new entry
        const response = await fetch('/api/worklogs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
          },
          body: JSON.stringify({
            date: newEntry.date.toISOString().split('T')[0],
            verticle: newEntry.verticle,
            country: newEntry.country,
            task: newEntry.task,
            hoursSpent: newEntry.hours,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create work log');
        }

        const result = await response.json();
        const newLog = {
          ...result.data.workLog,
          date: new Date(result.data.workLog.date),
          createdAt: new Date(result.data.workLog.createdAt),
          updatedAt: new Date(result.data.workLog.updatedAt),
        };

        setWorkLogs(prevLogs => [newLog, ...prevLogs]);

        toast({
          title: "Success",
          description: "Work log created successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save work log",
        variant: "destructive",
      });
    }
  };

  const handleEditEntry = (entry: any) => {
    // Admin can edit any entry
    setEditingEntry(entry);
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/worklogs/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete work log');
      }

      setWorkLogs(prevLogs => prevLogs.filter(log => log.id !== entryId));
      
      toast({
        title: "Success",
        description: "Work log deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete work log",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const totalHoursThisWeek = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return workLogs
      .filter(entry => entry.date > oneWeekAgo)
      .reduce((sum, entry) => sum + entry.hours, 0);
  }, [workLogs]);

  const projectsThisMonth = useMemo(() => {
     const oneMonthAgo = new Date();
     oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
     const projects = new Set(
       workLogs
         .filter(entry => entry.date > oneMonthAgo)
         .map(entry => entry.verticle)
     );
     return projects.size;
  }, [workLogs]);

  const lockedEntries = useMemo(() => {
    return workLogs.filter(entry => !entry.canEdit).length;
  }, [workLogs]);

  if (!user || user.role !== 'Admin' || loading) {
    return <div className="flex h-full w-full items-center justify-center"><p>Loading admin dashboard...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Badge variant="default" className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Full Access
          </Badge>
        </div>
        {lockedEntries > 0 && (
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {lockedEntries} entries would be locked for regular users (you can still edit them)
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Hours (Week)" value={totalHoursThisWeek.toFixed(1)} icon={Clock} />
        <StatsCard title="Projects (Month)" value={projectsThisMonth} icon={Hourglass} />
        <StatsCard title="Total Hours (All)" value={workLogs.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} icon={BarChart} />
        <StatsCard title="Team Size" value={users.filter(emp => emp.isActive).length} icon={Users} />
      </div>

      <Tabs defaultValue="team-summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="team-summary">Team Summary</TabsTrigger>
          <TabsTrigger value="all-entries">All Entries</TabsTrigger>
          <TabsTrigger value="admin-entry">Admin Entry</TabsTrigger>
          <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="team-summary" className="mt-4">
          <TeamSummary entries={workLogs} employees={users} />
        </TabsContent>

        <TabsContent value="all-entries" className="mt-4">
            <Tabs defaultValue="list">
               <TabsList>
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
               </TabsList>
               <TabsContent value="list" className="mt-4">
                 <TimesheetTableWithPermissions 
                   entries={workLogs} 
                   employees={users}
                   onEdit={handleEditEntry}
                   onDelete={handleDeleteEntry}
                   showAllUsers={true}
                 />
               </TabsContent>
               <TabsContent value="calendar" className="mt-4">
                  <CalendarView entries={workLogs} employees={users} />
               </TabsContent>
            </Tabs>
        </TabsContent>

        <TabsContent value="admin-entry" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <TimesheetForm 
                onSave={handleSaveEntry} 
                currentUser={user}
                myTasks={workLogs.map(e => e.task)}
                editingEntry={editingEntry}
                onCancel={handleCancelEdit}
              />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Admin Privileges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Full Access Control:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• View all user data</li>
                      <li>• Edit any timesheet entry (no time restrictions)</li>
                      <li>• Delete any timesheet entry</li>
                      <li>• Create entries for any user</li>
                      <li>• Manage user accounts</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">User Restrictions Override:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Users can only edit their own entries</li>
                      <li>• Users have 2-day edit window limit</li>
                      <li>• Users cannot access admin functions</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manage-users" className="mt-4">
            <ManageUsers employees={users} onUserAdded={handleUserAdded} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
