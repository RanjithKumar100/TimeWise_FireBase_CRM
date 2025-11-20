'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils/helpers';
import type { Employee } from '@/lib/types';
import { formatDateForAPI } from '@/lib/utils/date';

interface ComplianceCalendarViewProps {
  user: Employee;
  className?: string;
}

interface DayStatus {
  date: Date;
  hasEntry: boolean;
  hours: number;
  isWorkDay: boolean;
  isToday: boolean;
  entries: any[];
  isSecondSaturday?: boolean;
  isLeaveDay?: boolean;
}

export function ComplianceCalendarView({ user, className }: ComplianceCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());
  const [monthStats, setMonthStats] = useState({
    totalWorkDays: 0,
    completedDays: 0,
    complianceRate: 0,
    totalHours: 0,
    totalTimeFormatted: '0:00'
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper function to format decimal hours to HH:MM
  const formatDecimalToTime = (decimalHours: number): string => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Helper function to get hours and minutes from log
  const getTimeFromLog = (log: any): { hours: number; minutes: number; decimal: number } => {
    // Check if we have separate hours and minutes fields
    if (log.timeHours !== undefined && log.timeMinutes !== undefined) {
      return {
        hours: log.timeHours,
        minutes: log.timeMinutes,
        decimal: log.timeHours + (log.timeMinutes / 60)
      };
    }

    // Fall back to decimal hours calculation
    const decimalHours = parseFloat(log.hours || log.hoursSpent || 0);
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);

    return {
      hours,
      minutes,
      decimal: decimalHours
    };
  };

  useEffect(() => {
    fetchLeaveDates();
  }, []);

  useEffect(() => {
    fetchWorkLogs();
  }, [currentDate, user, refreshKey]);

  // Auto-refresh every 30 seconds to catch new entries
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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
        console.log('📅 Fetched leave dates for calendar:', Array.from(leaveDateStrings));
      }
    } catch (error) {
      console.error('Failed to fetch leave dates:', error);
    }
  };

  const fetchWorkLogs = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/worklogs?startDate=${monthStart.toISOString().split('T')[0]}&endDate=${monthEnd.toISOString().split('T')[0]}&_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const logs = result.data.workLogs || [];
        // Filter logs for this specific user (API already returns only approved entries)
        const userLogs = logs.filter((log: any) =>
          log.employeeId === user.id || log.userId === user.id
        );
        console.log(`📊 Calendar data for ${user.name}: ${userLogs.length} entries loaded`);
        setWorkLogs(userLogs);
        calculateMonthStats(userLogs, monthStart, monthEnd);
      }
    } catch (error) {
      console.error('Failed to fetch work logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthStats = (logs: any[], monthStart: Date, monthEnd: Date) => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Find the second Saturday of the month
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

    const workDays = days.filter(day => {
      const dayOfWeek = day.getDay();
      const currentMonth = day.getMonth();
      const currentYear = day.getFullYear();
      const currentDate = day.getDate();
      const dateString = formatDateForAPI(day);

      // Exclude future dates
      if (day > new Date()) return false;

      // Exclude Sundays
      if (dayOfWeek === 0) return false;

      // Exclude second Saturday of the month
      if (dayOfWeek === 6) {
        const secondSaturdayDate = getSecondSaturday(currentMonth, currentYear);
        if (currentDate === secondSaturdayDate) return false;
      }

      // Exclude company leave days (festivals/holidays)
      if (leaveDates.has(dateString)) return false;

      return true; // Include all other days (Mon-Fri, and Saturdays except 2nd Saturday, and not leave days)
    });

    const logDates = new Set(logs.map(log => formatDateForAPI(new Date(log.date))));
    const completedDays = workDays.filter(day =>
      logDates.has(formatDateForAPI(day))
    ).length;

    const totalHours = logs.reduce((sum, log) => {
      const logTime = getTimeFromLog(log);
      return sum + logTime.decimal;
    }, 0);
    const complianceRate = workDays.length > 0 ? (completedDays / workDays.length) * 100 : 0;

    setMonthStats({
      totalWorkDays: workDays.length,
      completedDays,
      complianceRate: Math.round(complianceRate),
      totalHours: Math.round(totalHours * 100) / 100,
      totalTimeFormatted: formatDecimalToTime(totalHours)
    });
  };

  const getDayStatus = (date: Date): DayStatus => {
    const dayOfWeek = date.getDay();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const currentDate = date.getDate();
    const dateString = formatDateForAPI(date);

    // Find the second Saturday of the month
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

    // Check if this is a company leave day (festival/holiday)
    const isLeaveDay = leaveDates.has(dateString);

    // Determine if this is a work day (exclude Sundays, 2nd Saturday, and leave days)
    let isWorkDay = true;
    let isSecondSaturday = false;

    if (dayOfWeek === 0) {
      isWorkDay = false; // Sunday
    } else if (dayOfWeek === 6) {
      const secondSaturdayDate = getSecondSaturday(currentMonth, currentYear);
      if (currentDate === secondSaturdayDate) {
        isWorkDay = false; // Second Saturday
        isSecondSaturday = true;
      }
    } else if (isLeaveDay) {
      isWorkDay = false; // Company leave day
    }

    const isToday = isSameDay(date, new Date());
    const dayEntries = workLogs.filter(log =>
      formatDateForAPI(new Date(log.date)) === dateString
    );
    const hasEntry = dayEntries.length > 0;
    // Sum all approved entries for this day (multiple entries per day are aggregated)
    const hours = dayEntries.reduce((sum, log) => {
      const logTime = getTimeFromLog(log);
      console.log(`Time for ${format(date, 'MMM d')}:`, `${logTime.hours}:${logTime.minutes.toString().padStart(2, '0')}`, 'from log:', log);
      return sum + logTime.decimal;
    }, 0);

    return {
      date,
      hasEntry,
      hours,
      isWorkDay,
      isToday,
      entries: dayEntries,
      isSecondSaturday,
      isLeaveDay
    };
  };

  const getDayColor = (dayStatus: DayStatus) => {
    if (dayStatus.isLeaveDay) return 'bg-purple-50 text-purple-600 border-purple-300'; // Company leave day
    if (dayStatus.isSecondSaturday) return 'bg-blue-50 text-blue-600'; // 2nd Saturday - Non-work day
    if (!dayStatus.isWorkDay) return 'bg-gray-50 text-gray-400'; // Weekend (Sundays)
    if (dayStatus.date > new Date()) return 'bg-gray-50 text-gray-400'; // Future date
    if (dayStatus.hasEntry && dayStatus.hours >= 4) return 'bg-green-100 text-green-800'; // Good entry
    if (dayStatus.hasEntry && dayStatus.hours < 4) return 'bg-yellow-100 text-yellow-800'; // Partial entry
    if (dayStatus.isToday) return 'bg-red-100 text-red-800'; // Today, no entry
    return 'bg-red-50 text-red-600'; // Missing entry
  };

  const getDayIcon = (dayStatus: DayStatus) => {
    if (!dayStatus.isWorkDay) return null;
    if (dayStatus.date > new Date()) return null;
    if (dayStatus.hasEntry && dayStatus.hours >= 4) return <CheckCircle className="h-3 w-3" />;
    if (dayStatus.hasEntry && dayStatus.hours < 4) return <Clock className="h-3 w-3" />;
    if (dayStatus.isToday) return <AlertTriangle className="h-3 w-3" />;
    return <XCircle className="h-3 w-3" />;
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create calendar grid (7 days per week)
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay()); // Start from Sunday

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay())); // End on Saturday

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {user.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              {format(currentDate, 'MMM yyyy')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey(prev => prev + 1)}
              disabled={loading}
              title="Refresh data to see latest entries"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Month Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{monthStats.totalWorkDays}</p>
            <p className="text-sm text-muted-foreground">Work Days</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{monthStats.completedDays}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className={cn("text-2xl font-bold",
              monthStats.complianceRate >= 90 ? "text-green-600" :
              monthStats.complianceRate >= 70 ? "text-yellow-600" : "text-red-600"
            )}>
              {monthStats.complianceRate}%
            </p>
            <p className="text-sm text-muted-foreground">Compliance</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{monthStats.totalTimeFormatted}</p>
            <p className="text-sm text-muted-foreground">Total Time</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Complete Entry (≥4h)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>Partial Entry (&lt;4h)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Missing Entry</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-50 border border-purple-300 rounded"></div>
            <span>Company Leave (Holiday)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
            <span>2nd Saturday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Sunday/Future</span>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading calendar...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map(day => {
              const dayStatus = getDayStatus(day);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-2 text-center text-sm border rounded transition-all hover:shadow-sm cursor-pointer",
                    getDayColor(dayStatus),
                    !isCurrentMonth && "opacity-30",
                    dayStatus.isToday && "ring-2 ring-blue-500"
                  )}
                  title={`${format(day, 'MMM d, yyyy')} - ${
                    dayStatus.isLeaveDay
                      ? 'Company Leave Day (Holiday/Festival)'
                      : dayStatus.isSecondSaturday
                        ? 'Non-work day (2nd Saturday)'
                        : dayStatus.hasEntry
                          ? `${formatDecimalToTime(dayStatus.hours)} logged`
                          : dayStatus.isWorkDay && day <= new Date()
                            ? 'No entry'
                            : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium">{format(day, 'd')}</span>
                    {getDayIcon(dayStatus)}
                    {dayStatus.hasEntry && dayStatus.hours > 0 && (
                      <span className="text-xs">{formatDecimalToTime(dayStatus.hours)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}