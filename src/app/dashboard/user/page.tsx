
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, TimesheetEntry } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Hourglass, BarChart, CheckSquare, AlertTriangle, Shield, Filter } from 'lucide-react';
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
  status?: 'approved' | 'rejected';
  rejectedAt?: Date;
  rejectedBy?: string;
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
  const [allWorkLogs, setAllWorkLogs] = useState<WorkLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<WorkLogEntry | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

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
      const response = await fetch('/api/worklogs?limit=1000', {
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
        status: log.status || 'approved',
        rejectedAt: log.rejectedAt ? new Date(log.rejectedAt) : undefined,
      }));
      setAllWorkLogs(logs);
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

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const options = [{ value: 'all', label: 'All Months' }];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value: monthKey, label: monthLabel });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Filter work logs by selected month
  useEffect(() => {
    if (selectedMonth === 'all') {
      setWorkLogs(allWorkLogs);
    } else {
      const [year, month] = selectedMonth.split('-').map(Number);
      const filtered = allWorkLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getFullYear() === year && logDate.getMonth() + 1 === month;
      });
      setWorkLogs(filtered);
    }
  }, [selectedMonth, allWorkLogs]);


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

  const myHoursThisMonth = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return workLogs
      .filter(entry => entry.date > oneMonthAgo)
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
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <label htmlFor="month-filter" className="text-sm font-medium">Filter by Month:</label>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {selectedMonth !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Filtered: {monthOptions.find(opt => opt.value === selectedMonth)?.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="My Hours (Month)" value={myHoursThisMonth.toFixed(1)} icon={Clock} />
        <StatsCard title="My Tasks (Month)" value={myTasksThisMonth} icon={CheckSquare} />
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
