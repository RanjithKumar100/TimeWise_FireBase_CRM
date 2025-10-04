
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, Verticle } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Clock, Hourglass, BarChart, Users, Shield, AlertTriangle, Download, Filter, Search, Timer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { formatDateForAPI } from '@/lib/date-utils';
import { calculateEmployeeExtraTime, formatExtraTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import TimesheetTableWithPermissions from '@/components/timesheet/timesheet-table-with-permissions';
import CalendarView from '@/components/timesheet/calendar-view';
import TeamSummary from '@/components/reports/team-summary';
import StatsCard from '@/components/dashboard/stats-card';
import ManageUsers from '@/components/admin/manage-users';
import NotificationManagement from '@/components/admin/notification-management';
import LeaveManagement from '@/components/admin/leave-management';
import { ConditionalDataLoader } from '@/components/ui/database-status';

interface WorkLogEntry {
  id: string;
  date: Date;
  verticle: Verticle;
  country: string;
  task: string;
  taskDescription?: string;
  hours: number;
  status?: 'approved' | 'rejected';
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
  const [allWorkLogs, setAllWorkLogs] = useState<WorkLogEntry[]>([]);
  const [adminEntries, setAdminEntries] = useState<WorkLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<WorkLogEntry | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

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
      }));
      setAllWorkLogs(logs);
      setWorkLogs(logs);
      
      // Filter admin's own entries
      if (user) {
        const adminLogs = logs.filter((log: WorkLogEntry) => log.employeeId === user.id);
        setAdminEntries(adminLogs);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch work logs",
        variant: "destructive",
      });
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

  // Filter users for suggestions
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return [];
    return users.filter(user => 
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(userSearchQuery.toLowerCase())
    ).slice(0, 8); // Show max 8 suggestions
  }, [users, userSearchQuery]);


  // Filter work logs by selected month and selected user
  useEffect(() => {
    let filtered = allWorkLogs;

    // Filter by month
    if (selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-').map(Number);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getFullYear() === year && logDate.getMonth() + 1 === month;
      });
    }

    // Filter by selected user
    if (selectedUser) {
      filtered = filtered.filter(log => log.employeeId === selectedUser.id);
    }

    setWorkLogs(filtered);

    // Also filter admin entries for month selection
    if (user) {
      let adminFiltered = allWorkLogs.filter((log: WorkLogEntry) => log.employeeId === user.id);
      
      // Filter by month
      if (selectedMonth !== 'all') {
        const [year, month] = selectedMonth.split('-').map(Number);
        adminFiltered = adminFiltered.filter(log => {
          const logDate = new Date(log.date);
          return logDate.getFullYear() === year && logDate.getMonth() + 1 === month;
        });
      }
      
      setAdminEntries(adminFiltered);
    }
  }, [selectedMonth, selectedUser, allWorkLogs, user]);

  // Export to Excel
  const exportToExcel = () => {
    const exportData = workLogs.map(log => {
      // Get hours and minutes values
      const hours = log.timeHours || Math.floor(log.hours || 0);
      const minutes = log.timeMinutes || Math.round(((log.hours || 0) % 1) * 60);

      // Convert to Excel time format (decimal fraction of a day)
      // Excel time format: hours/24 + minutes/(24*60)
      const excelTimeValue = (hours + minutes/60) / 24;

      return {
        'Date': log.date.toLocaleDateString(),
        'Employee': log.employeeName,
        'Email': log.employeeEmail,
        'Role': log.employeeRole,
        'Verticle': log.verticle,
        'Country': log.country,
        'Task': log.task,
        'Time Spent': excelTimeValue,
        'Created At': log.createdAt.toLocaleDateString()
      };
    });

    // Add extra time summary per employee
    const uniqueEmployees = [...new Set(workLogs.map(log => log.employeeId))];
    const extraTimeData = uniqueEmployees.map(employeeId => {
      const employee = users.find(u => u.id === employeeId);
      const extraTime = calculateEmployeeExtraTime(workLogs, employeeId);

      return {
        'Employee': employee?.name || 'Unknown',
        'Email': employee?.email || 'N/A',
        'Total Extra Time': formatExtraTime(extraTime)
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const extraTimeSheet = XLSX.utils.json_to_sheet(extraTimeData);

    // Apply time formatting to the 'Time Spent' column
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const timeColumnIndex = 7; // 'Time Spent' is the 8th column (0-indexed: 7)

    // Format the Time Spent column as time
    for (let row = 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: timeColumnIndex });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].z = '[h]:mm'; // Excel time format showing hours:minutes
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Team Work Logs');
    XLSX.utils.book_append_sheet(workbook, extraTimeSheet, 'Extra Time Summary');
    
    const monthLabel = selectedMonth === 'all' ? 'All_Months' : 
      monthOptions.find(opt => opt.value === selectedMonth)?.label.replace(' ', '_') || selectedMonth;
    
    const userLabel = selectedUser ? 
      selectedUser.name.replace(/[^a-zA-Z0-9]/g, '_') : 'All_Users';
    
    const fileName = `Team_Work_Logs_${userLabel}_${monthLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);

    toast({
      title: "Success",
      description: "Team work logs exported successfully",
    });
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

  const handleUserUpdated = (updatedUser: Employee) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
  };

  const handleUserDeleted = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
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
            date: formatDateForAPI(newEntry.date),
            verticle: newEntry.verticle,
            country: newEntry.country,
            task: newEntry.task,
            taskDescription: newEntry.taskDescription || '',
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
        
        // Update admin entries if this is admin's entry
        if (user && updatedLog.employeeId === user.id) {
          setAdminEntries(prevLogs => 
            prevLogs.map(log => 
              log.id === editingEntry.id ? updatedLog : log
            )
          );
        }
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
            date: formatDateForAPI(newEntry.date),
            verticle: newEntry.verticle,
            country: newEntry.country,
            task: newEntry.task,
            taskDescription: newEntry.taskDescription || '',
            hours: newEntry.hours,
            minutes: newEntry.minutes,
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
        setAllWorkLogs(prevLogs => [newLog, ...prevLogs]);
        
        // Add to admin entries if this is admin's entry
        if (user && newLog.employeeId === user.id) {
          setAdminEntries(prevLogs => [newLog, ...prevLogs]);
        }

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
      // Find the entry to determine if it's already rejected
      const entry = workLogs.find(log => log.id === entryId);
      
      let response;
      let successMessage = "Work log rejected successfully";
      
      if (entry?.status === 'rejected') {
        // If already rejected, permanently delete
        response = await fetch(`/api/worklogs/${entryId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
          },
          body: JSON.stringify({ action: 'permanent_delete' })
        });
        successMessage = "Work log permanently deleted successfully";
      } else {
        // If approved, reject it (soft delete)
        response = await fetch(`/api/worklogs/${entryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
          }
        });
        successMessage = "Work log rejected successfully";
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process work log');
      }

      // Refresh the work logs to get the updated status from server
      await fetchWorkLogs();
      
      toast({
        title: "Success", 
        description: successMessage,
      });
    } catch (error: any) {
      console.error('Delete work log error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process work log",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };


  const handleUserSelect = (user: Employee) => {
    setSelectedUser(user);
    setUserSearchQuery(user.name);
    setShowSuggestions(false);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setUserSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserSearchQuery(value);
    setShowSuggestions(value.trim().length > 0);
    
    // If user clears the input, clear the selection
    if (!value.trim()) {
      setSelectedUser(null);
    }
  };

  const totalHoursThisMonth = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return workLogs
      .filter(entry => entry.date > oneMonthAgo)
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

  const totalExtraTimeThisMonth = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const recentWorkLogs = workLogs.filter(entry => entry.date > oneMonthAgo);
    
    let totalExtraTime = 0;
    const uniqueEmployees = [...new Set(recentWorkLogs.map(entry => entry.employeeId))];
    
    uniqueEmployees.forEach(employeeId => {
      totalExtraTime += calculateEmployeeExtraTime(recentWorkLogs, employeeId);
    });
    
    return totalExtraTime;
  }, [workLogs]);

  if (!user || user.role !== 'Admin' || loading) {
    return <div className="flex h-full w-full items-center justify-center"><p>Loading admin dashboard...</p></div>;
  }

  return (
    <ConditionalDataLoader>
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

      {/* Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Filter by Month:</label>
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
          <div className="flex items-center gap-4">
            <label htmlFor="user-search" className="text-sm font-medium whitespace-nowrap">Search Users:</label>
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="user-search"
                type="text"
                placeholder="Search by name, email or role."
                value={userSearchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => userSearchQuery.trim() && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className={`pl-10 pr-4 h-10 w-full focus:ring-2 focus:ring-primary/20 transition-all ${
                  selectedUser ? 'bg-green-50 border-green-200' : ''
                }`}
              />
              {userSearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                  onClick={handleClearUser}
                >
                  ×
                </Button>
              )}
              
              {/* Suggestions Dropdown */}
              {showSuggestions && filteredUsers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                  <div className="p-1">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email} • {user.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            {selectedMonth !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Month: {monthOptions.find(opt => opt.value === selectedMonth)?.label}
              </Badge>
            )}
            {selectedUser && (
              <Badge variant="secondary" className="text-xs">
                User: {selectedUser.name}
              </Badge>
            )}
          </div>
          <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Total Hours (Month)" value={totalHoursThisMonth.toFixed(1)} icon={Clock} />
        <StatsCard title="Projects (Month)" value={projectsThisMonth} icon={Hourglass} />
        <StatsCard title="Team Size" value={users.filter(emp => emp.isActive).length} icon={Users} />
        <StatsCard title="Extra Time (Month)" value={formatExtraTime(totalExtraTimeThisMonth)} icon={Timer} />
      </div>

      <Tabs defaultValue="team-summary" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="team-summary">Team Summary</TabsTrigger>
          <TabsTrigger value="all-entries">All Entries</TabsTrigger>
          <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="leave-management">Leave Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="team-summary" className="mt-4">
          <TeamSummary 
            entries={workLogs} 
            employees={users} 
            preSelectedUserId={selectedUser?.id}
          />
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
                   onDelete={handleDeleteEntry}
                   showAllUsers={true}
                 />
               </TabsContent>
               <TabsContent value="calendar" className="mt-4">
                  <CalendarView entries={workLogs} employees={users} />
               </TabsContent>
            </Tabs>
        </TabsContent>

        <TabsContent value="manage-users" className="mt-4">
            <ManageUsers 
              employees={users} 
              onUserAdded={handleUserAdded}
              onUserUpdated={handleUserUpdated}
              onUserDeleted={handleUserDeleted}
            />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
            <NotificationManagement />
        </TabsContent>

        <TabsContent value="leave-management" className="mt-4">
            <LeaveManagement />
        </TabsContent>
      </Tabs>
      </div>
    </ConditionalDataLoader>
  );
}
