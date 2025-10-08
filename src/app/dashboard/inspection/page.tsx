'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Users, Eye, CheckCircle, XCircle, Clock, Download, Filter } from 'lucide-react';
import { ComplianceCalendarView } from '@/components/inspection/compliance-calendar-view';
import { UserSearchDialog } from '@/components/inspection/user-search-dialog';
import { cn } from '@/lib/utils';
import type { Employee } from '@/lib/types';
import { formatDateForAPI } from '@/lib/date-utils';

interface UserComplianceStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalDays: number;
  completedDays: number;
  complianceRate: number;
  missingDates: string[];
  lastEntryDate?: string;
}

export default function InspectionDashboard() {
  const { user, isInspection, canViewAllData } = useAuth();
  const [users, setUsers] = useState<Employee[]>([]);
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [complianceStats, setComplianceStats] = useState<UserComplianceStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('30'); // days
  const [loading, setLoading] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [complianceFilter, setComplianceFilter] = useState('all'); // all, high, medium, low
  const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());

  // Redirect if user doesn't have inspection access
  useEffect(() => {
    if (user && !isInspection() && !canViewAllData()) {
      window.location.href = '/dashboard/user';
    }
  }, [user, isInspection, canViewAllData]);

  // Fetch all users and leave dates
  useEffect(() => {
    fetchUsers();
    fetchLeaveDates();
  }, []);

  // Fetch compliance stats when time range changes
  useEffect(() => {
    if (users.length > 0) {
      fetchComplianceStats();
    }
  }, [users, timeRange]);

  // Auto-refresh every 60 seconds to catch new entries
  useEffect(() => {
    const interval = setInterval(() => {
      if (users.length > 0) {
        fetchComplianceStats();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [users]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const allUsers = result.data.users || [];
        // Show all active users including admins (inspection users can view everyone's timesheets)
        const activeUsers = allUsers.filter((u: Employee) => u.isActive && u.role !== 'Inspection');
        setUsers(activeUsers);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchLeaveDates = async () => {
    try {
      const response = await fetch('/api/leaves', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const leaves = result.data.leaves || [];
        const leaveDateStrings = new Set(
          leaves.map((leave: any) => formatDateForAPI(new Date(leave.date)))
        );
        setLeaveDates(leaveDateStrings);
        console.log('📅 Fetched leave dates:', Array.from(leaveDateStrings));
      }
    } catch (error) {
      console.error('Failed to fetch leave dates:', error);
    }
  };

  const fetchComplianceStats = async () => {
    setLoading(true);
    try {
      let endDate = new Date();
      let startDate = new Date();

      // Handle month-based calculations
      if (timeRange === '30') {
        // "This Month" - use current month boundaries
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
      } else if (timeRange === '60') {
        // "Last 2 months" - start from 2 months ago
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
      } else if (timeRange === '90') {
        // "Last 3 months" - start from 3 months ago
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
      } else {
        // Keep day-based calculation for 7 and 14 days
        startDate.setDate(endDate.getDate() - parseInt(timeRange));
      }

      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/worklogs?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const workLogs = result.data.workLogs || [];

        // Calculate compliance stats for each user
        const stats = users.map(user => {
          // API already returns only approved work logs
          const userLogs = workLogs.filter((log: any) => log.employeeId === user.id);
          const uniqueDates = new Set(userLogs.map((log: any) => formatDateForAPI(new Date(log.date))));

          // Calculate expected work days (weekdays only)
          const expectedDays = getWorkDaysInRange(startDate, endDate);
          const completedDays = uniqueDates.size;
          const complianceRate = expectedDays > 0 ? (completedDays / expectedDays) * 100 : 0;

          // Find missing dates
          const missingDates = expectedDays > 0 ? getMissingWorkDays(startDate, endDate, Array.from(uniqueDates).map(String)) : [];

          // Get last entry date
          const lastEntryDate = userLogs.length > 0
            ? userLogs.reduce((latest: any, log: any) =>
                new Date(log.date) > new Date(latest.date) ? log : latest
              ).date
            : undefined;

          return {
            userId: user.id,
            userName: user.name,
            userEmail: user.email || '',
            totalDays: expectedDays,
            completedDays,
            complianceRate: Math.round(complianceRate),
            missingDates,
            lastEntryDate
          };
        });

        setComplianceStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch compliance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkDaysInRange = (start: Date, end: Date): number => {
    let count = 0;
    const current = new Date(start);

    // Find the second Saturday of the month for each month in the range
    const getSecondSaturday = (month: number, year: number): number => {
      // Find first Saturday
      let firstSaturday = 1;
      for (let day = 1; day <= 7; day++) {
        const date = new Date(year, month, day);
        if (date.getDay() === 6) {
          firstSaturday = day;
          break;
        }
      }
      // Second Saturday is 7 days later
      return firstSaturday + 7;
    };

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const currentMonth = current.getMonth();
      const currentYear = current.getFullYear();
      const currentDate = current.getDate();
      const dateString = formatDateForAPI(current);

      // Exclude Sundays (dayOfWeek === 0)
      if (dayOfWeek === 0) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Exclude second Saturday of the month
      if (dayOfWeek === 6) {
        const secondSaturdayDate = getSecondSaturday(currentMonth, currentYear);
        if (currentDate === secondSaturdayDate) {
          current.setDate(current.getDate() + 1);
          continue;
        }
      }

      // Exclude company leave days
      if (leaveDates.has(dateString)) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Count all other days (Monday-Friday, and Saturdays except 2nd Saturday, and not leave days)
      count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const getMissingWorkDays = (start: Date, end: Date, completedDates: string[]): string[] => {
    const missing: string[] = [];
    const current = new Date(start);
    const completedSet = new Set(completedDates);

    // Find the second Saturday of the month for each month in the range
    const getSecondSaturday = (month: number, year: number): number => {
      // Find first Saturday
      let firstSaturday = 1;
      for (let day = 1; day <= 7; day++) {
        const date = new Date(year, month, day);
        if (date.getDay() === 6) {
          firstSaturday = day;
          break;
        }
      }
      // Second Saturday is 7 days later
      return firstSaturday + 7;
    };

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const currentMonth = current.getMonth();
      const currentYear = current.getFullYear();
      const currentDate = current.getDate();
      const dateString = formatDateForAPI(current);

      // Exclude Sundays (dayOfWeek === 0)
      if (dayOfWeek === 0) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Exclude second Saturday of the month
      if (dayOfWeek === 6) {
        const secondSaturdayDate = getSecondSaturday(currentMonth, currentYear);
        if (currentDate === secondSaturdayDate) {
          current.setDate(current.getDate() + 1);
          continue;
        }
      }

      // Exclude company leave days (festivals/holidays)
      if (leaveDates.has(dateString)) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Check if this work day is missing
      if (!completedSet.has(dateString)) {
        missing.push(dateString);
      }

      current.setDate(current.getDate() + 1);
    }
    return missing;
  };

  // Filter stats based on compliance filter and search term
  const getFilteredStats = () => {
    let filtered = complianceStats;

    // Apply compliance filter
    if (complianceFilter === 'high') {
      filtered = filtered.filter(stat => stat.complianceRate >= 90);
    } else if (complianceFilter === 'medium') {
      filtered = filtered.filter(stat => stat.complianceRate >= 70 && stat.complianceRate < 90);
    } else if (complianceFilter === 'low') {
      filtered = filtered.filter(stat => stat.complianceRate < 70);
    }

    // Apply search term filter
    filtered = filtered.filter(stat =>
      stat.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stat.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered;
  };

  const filteredStats = getFilteredStats();

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getComplianceIcon = (rate: number) => {
    if (rate >= 90) return <CheckCircle className="h-4 w-4" />;
    if (rate >= 70) return <Clock className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  // Function to get compliance label
  const getComplianceLabel = (filter: string) => {
    switch (filter) {
      case 'high': return 'High Compliance (≥90%)';
      case 'medium': return 'Medium Compliance (70-89%)';
      case 'low': return 'Low Compliance (<70%)';
      default: return 'All Users';
    }
  };

  if (!user || (!isInspection() && !canViewAllData())) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timesheet Compliance Inspection</h1>
          <p className="text-muted-foreground">Monitor and verify team timesheet compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Eye className="h-3 w-3 mr-1" />
            Inspection Dashboard
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">This Month</SelectItem>
            <SelectItem value="60">Last 2 months</SelectItem>
            <SelectItem value="90">Last 3 months</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowUserSearch(true)} variant="outline">
          <Users className="h-4 w-4 mr-2" />
          View User Calendar
        </Button>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn(
          "cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2",
          complianceFilter === 'high' ? "border-green-500 bg-green-50" : "border-transparent hover:border-green-200"
        )} onClick={() => setComplianceFilter(complianceFilter === 'high' ? 'all' : 'high')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">High Compliance (≥90%)</p>
                <p className="text-2xl font-bold text-green-600">
                  {complianceStats.filter(s => s.complianceRate >= 90).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to {complianceFilter === 'high' ? 'clear filter' : 'filter users'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2",
          complianceFilter === 'medium' ? "border-yellow-500 bg-yellow-50" : "border-transparent hover:border-yellow-200"
        )} onClick={() => setComplianceFilter(complianceFilter === 'medium' ? 'all' : 'medium')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Medium Compliance (70-89%)</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {complianceStats.filter(s => s.complianceRate >= 70 && s.complianceRate < 90).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to {complianceFilter === 'medium' ? 'clear filter' : 'filter users'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2",
          complianceFilter === 'low' ? "border-red-500 bg-red-50" : "border-transparent hover:border-red-200"
        )} onClick={() => setComplianceFilter(complianceFilter === 'low' ? 'all' : 'low')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Low Compliance (&lt;70%)</p>
                <p className="text-2xl font-bold text-red-600">
                  {complianceStats.filter(s => s.complianceRate < 70).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to {complianceFilter === 'low' ? 'clear filter' : 'filter users'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              User Compliance Report - {getComplianceLabel(complianceFilter)}
              {filteredStats.length !== complianceStats.length && (
                <Badge variant="secondary" className="ml-2">
                  {filteredStats.length} of {complianceStats.length}
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading compliance data...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStats.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {complianceFilter === 'all'
                      ? "No users found matching your search."
                      : `No users found in the ${getComplianceLabel(complianceFilter).toLowerCase()} category.`}
                  </p>
                </div>
              ) : (
                filteredStats.map((stat) => (
                  <div key={stat.userId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{stat.userName}</p>
                          <p className="text-sm text-muted-foreground">{stat.userEmail}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {stat.completedDays} / {stat.totalDays} days
                        </p>
                        {stat.lastEntryDate && (
                          <p className="text-xs text-muted-foreground">
                            Last entry: {new Date(stat.lastEntryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge className={cn("flex items-center gap-1", getComplianceColor(stat.complianceRate))}>
                        {getComplianceIcon(stat.complianceRate)}
                        {stat.complianceRate}%
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const user = users.find(u => u.id === stat.userId);
                          if (user) {
                            setSelectedUser(user);
                            setShowUserSearch(true);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Search Dialog */}
      <UserSearchDialog
        open={showUserSearch}
        onOpenChange={setShowUserSearch}
        users={users}
        selectedUser={selectedUser}
        onUserSelect={setSelectedUser}
        complianceFilter={complianceFilter}
        filteredUsers={filteredStats.map(stat => users.find(u => u.id === stat.userId)!).filter(Boolean)}
      />
    </div>
  );
}