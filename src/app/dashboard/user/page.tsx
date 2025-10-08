
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, TimesheetEntry, Verticle } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Hourglass, BarChart, CheckSquare, AlertTriangle, Shield, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import TimesheetForm from '@/components/timesheet/timesheet-form';
import TimesheetTableWithPermissions from '@/components/timesheet/timesheet-table-with-permissions';
import CalendarView from '@/components/timesheet/calendar-view';
import IndividualSummary from '@/components/reports/individual-summary';
import StatsCard from '@/components/dashboard/stats-card';
import { ConditionalDataLoader } from '@/components/ui/database-status';
import { formatDateForAPI } from '@/lib/date-utils';
import { formatTimeSpent } from '@/lib/time-utils';

interface WorkLogEntry {
  id: string;
  date: Date;
  verticle: Verticle;
  country: string;
  task: string;
  taskDescription?: string;
  hours: number; // Legacy decimal hours field
  timeHours?: number; // New separate hours field
  timeMinutes?: number; // New separate minutes field
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
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const currentUser: Employee | null = useMemo(() => {
    return user ? {
      id: user.id,
      userId: user.id, // Add userId for compatibility
      name: user.name,
      email: user.email,
      role: user.role as 'Admin' | 'User',
      isActive: user.isActive,
      department: 'General', // Default department
    } : null;
  }, [user]);

  // Sort entries: Today's entries first, then others in reverse chronological order
  const sortEntriesByDate = (entries: WorkLogEntry[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const otherEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() !== today.getTime();
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return [...todayEntries, ...otherEntries];
  };

  const fetchWorkLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/worklogs?limit=1000&personalOnly=true', {
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

      // Sort: Today's entries first, then others
      const sortedLogs = sortEntriesByDate(logs);

      setAllWorkLogs(sortedLogs);
      setWorkLogs(sortedLogs);
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

  // Get unique dates from entries for the date dropdown
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    allWorkLogs.forEach(entry => {
      const dateKey = format(entry.date, 'yyyy-MM-dd');
      dates.add(dateKey);
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)
  }, [allWorkLogs]);

  // Filter work logs by selected month and date
  useEffect(() => {
    let filtered = allWorkLogs;

    if (selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-').map(Number);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getFullYear() === year && logDate.getMonth() + 1 === month;
      });
    }

    if (selectedDate !== 'all') {
      filtered = filtered.filter(log => {
        const dateKey = format(log.date, 'yyyy-MM-dd');
        return dateKey === selectedDate;
      });
    }

    // Sort: Today's entries first, then others
    const sortedFiltered = sortEntriesByDate(filtered);
    setWorkLogs(sortedFiltered);
  }, [selectedMonth, selectedDate, allWorkLogs]);


  useEffect(() => {
    if (user) {
      fetchWorkLogs();
    }
  }, [user]);

  const handleSaveEntry = async (newEntry: Omit<TimesheetEntry, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'> & { taskDescription: string; hours: number; minutes: number }) => {
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
            date: formatDateForAPI(newEntry.date),
            verticle: newEntry.verticle,
            country: newEntry.country,
            task: newEntry.task,
            taskDescription: newEntry.taskDescription,
            hours: newEntry.hours,
            minutes: newEntry.minutes,
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
        setAllWorkLogs(prevLogs => 
          prevLogs.map(log => 
            log.id === editingEntry.id ? updatedLog : log
          )
        );
        setEditingEntry(null);

        toast({
          title: "Success",
          description: "Work log updated successfully",
        });
        setRefreshTrigger(prev => prev + 1);
      } else {
        // Create new entry
        const requestData = {
          date: formatDateForAPI(newEntry.date),
          verticle: newEntry.verticle,
          country: newEntry.country,
          task: newEntry.task,
          taskDescription: newEntry.taskDescription,
          hours: newEntry.hours,
          minutes: newEntry.minutes,
        };
        
        console.log('🔍 Sending worklog data:', requestData);
        
        const authToken = localStorage.getItem('timewise-auth-token');
        console.log('🔍 Auth token present:', !!authToken);
        console.log('🔍 Auth token length:', authToken?.length || 0);
        
        const response = await fetch('/api/worklogs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(requestData),
        });
        
        console.log('🔍 Response received:', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });

        if (!response.ok) {
          console.error('❌ API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          let errorData;
          try {
            const responseText = await response.text();
            console.error('❌ Raw response text:', responseText);
            errorData = responseText ? JSON.parse(responseText) : { message: 'Empty response' };
          } catch (parseError) {
            console.error('❌ Failed to parse error response:', parseError);
            errorData = { message: 'Invalid JSON response' };
          }
          
          console.error('❌ Parsed error data:', errorData);
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        const newLog = {
          ...result.data.workLog,
          date: new Date(result.data.workLog.date),
          createdAt: new Date(result.data.workLog.createdAt),
          updatedAt: new Date(result.data.workLog.updatedAt),
        };

        setWorkLogs(prevLogs => [newLog, ...prevLogs]);
        setAllWorkLogs(prevLogs => [newLog, ...prevLogs]);

        toast({
          title: "Success",
          description: "Work log created successfully",
        });
        setRefreshTrigger(prev => prev + 1);
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
        const result = await response.json();
        throw new Error(result.message || 'Failed to reject work log');
      }

      // Remove the entry from the view (it's now rejected and won't show up in API response)
      setWorkLogs(prevLogs => prevLogs.filter(log => log.id !== entryId));
      setAllWorkLogs(prevLogs => prevLogs.filter(log => log.id !== entryId));

      toast({
        title: "Success",
        description: "Time entry rejected successfully. It has been removed from your view.",
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject work log",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };


  const myHoursToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate total time in minutes for today
    const totalMinutes = workLogs
      .filter(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      })
      .reduce((sum, entry) => {
        const hours = (entry as any).timeHours ?? Math.floor(entry.hours);
        const minutes = (entry as any).timeMinutes ?? Math.round((entry.hours - Math.floor(entry.hours)) * 60);
        return sum + (hours * 60) + minutes;
      }, 0);

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      display: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    };
  }, [workLogs]);

  const myHoursThisMonth = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Calculate total time in minutes, then convert to hours/minutes
    const totalMinutes = workLogs
      .filter(entry => entry.date > oneMonthAgo)
      .reduce((sum, entry) => {
        const hours = (entry as any).timeHours ?? Math.floor(entry.hours);
        const minutes = (entry as any).timeMinutes ?? Math.round((entry.hours - Math.floor(entry.hours)) * 60);
        return sum + (hours * 60) + minutes;
      }, 0);

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      display: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    };
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
    <ConditionalDataLoader>
      <div className="flex flex-col gap-6">
      {/* User Role Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">My Personal Dashboard</h1>
          <Badge variant={currentUser.role === 'Admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {currentUser.role}
          </Badge>
        </div>
        {currentUser.role === 'Admin' && (
          <div className="text-right">
          </div>
        )}
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

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="My Hours (Day)" value={myHoursToday.display} icon={Clock} />
        <StatsCard title="My Hours (Month)" value={myHoursThisMonth.display} icon={Clock} />
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
                refreshTrigger={refreshTrigger}
              />
            </div>
            <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'calendar')} className="flex-1">
                     <TabsList>
                      <TabsTrigger value="list">List View</TabsTrigger>
                      <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                     </TabsList>
                  </Tabs>
                  {viewMode === 'list' && (
                    <Select value={selectedDate} onValueChange={setSelectedDate}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        {availableDates.map(dateKey => (
                          <SelectItem key={dateKey} value={dateKey}>
                            {format(new Date(dateKey), 'MMM dd, yyyy')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {viewMode === 'list' && (
                  <TimesheetTableWithPermissions
                    entries={workLogs}
                    employees={[currentUser]}
                    onEdit={handleEditEntry}
                    onDelete={handleDeleteEntry}
                    showAllUsers={false}
                  />
                )}

                {viewMode === 'calendar' && (
                  <CalendarView entries={workLogs} employees={[currentUser]} />
                )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="individual" className="mt-4">
          <IndividualSummary entries={workLogs} employees={[currentUser]} />
        </TabsContent>
      </Tabs>
      </div>
    </ConditionalDataLoader>
  );
}
