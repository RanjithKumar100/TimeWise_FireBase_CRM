
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, TimesheetEntry } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Hourglass, BarChart, CheckSquare, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

import TimesheetForm from '@/components/timesheet/timesheet-form';
import TimesheetTableWithPermissions from '@/components/timesheet/timesheet-table-with-permissions';
import CalendarView from '@/components/timesheet/calendar-view';
import IndividualSummary from '@/components/reports/individual-summary';
import StatsCard from '@/components/dashboard/stats-card';

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

export default function UserDashboardPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<WorkLogEntry | null>(null);

  const currentUser: Employee | null = useMemo(() => {
    return user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'Admin' | 'User',
      isActive: user.isActive,
      department: 'General', // Default department
      joinedAt: new Date(), // Default joined date
    } : null;
  }, [user]);

  const fetchWorkLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/worklogs', {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkLogs();
    }
  }, [user]);

  const handleSaveEntry = async (newEntry: Omit<TimesheetEntry, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;

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
    if (!currentUser) return;
    
    if (entry.canEdit) {
      setEditingEntry(entry);
    }
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

  const myHoursThisWeek = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return workLogs
      .filter(entry => entry.date > oneWeekAgo)
      .reduce((sum, entry) => sum + entry.hours, 0);
  }, [workLogs]);
  
  const myTasksThisMonth = useMemo(() => {
     const oneMonthAgo = new Date();
     oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
     const tasks = new Set(
       workLogs
         .filter(entry => entry.date > oneMonthAgo)
         .map(entry => entry.task)
     );
     return tasks.size;
  }, [workLogs]);

  const editableEntries = useMemo(() => {
    return workLogs.filter(entry => entry.canEdit).length;
  }, [workLogs]);
  
  if (!currentUser || loading) {
    return <div className="flex h-full w-full items-center justify-center"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* User Role Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <Badge variant={currentUser.role === 'Admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {currentUser.role}
          </Badge>
        </div>
        {!isAdmin() && editableEntries < workLogs.length && (
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {workLogs.length - editableEntries} entries locked (2-day edit limit exceeded)
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="My Hours (Week)" value={myHoursThisWeek.toFixed(1)} icon={Clock} />
        <StatsCard title="My Tasks (Month)" value={myTasksThisMonth} icon={CheckSquare} />
        <StatsCard title="My Total Hours" value={workLogs.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} icon={BarChart} />
        <StatsCard title="Editable Entries" value={`${editableEntries}/${workLogs.length}`} icon={Hourglass} />
      </div>

      <Tabs defaultValue="entry" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
          <TabsTrigger value="entry">My Time Entry</TabsTrigger>
          <TabsTrigger value="individual">My Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <TimesheetForm 
                onSave={handleSaveEntry} 
                currentUser={currentUser}
                myTasks={workLogs.map(e => e.task)}
                editingEntry={editingEntry}
                onCancel={handleCancelEdit}
              />
            </div>
            <div className="lg:col-span-2">
                <Tabs defaultValue="list">
                   <TabsList>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                   </TabsList>
                   <TabsContent value="list" className="mt-4">
                     <TimesheetTableWithPermissions 
                       entries={workLogs} 
                       employees={[currentUser]}
                       onEdit={handleEditEntry}
                       onDelete={handleDeleteEntry}
                       showAllUsers={false}
                     />
                   </TabsContent>
                   <TabsContent value="calendar" className="mt-4">
                      <CalendarView entries={workLogs} employees={[currentUser]} />
                   </TabsContent>
                </Tabs>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="individual" className="mt-4">
          <IndividualSummary entries={workLogs} employees={[currentUser]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
