'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TimesheetEntry, Employee } from '@/lib/types';
import { formatTimeSpent } from '@/lib/time-utils';
import { formatDateForAPI } from '@/lib/date-utils';

interface CalendarViewProps {
  entries: TimesheetEntry[];
  employees: Employee[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ entries, employees }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveDates, setLeaveDates] = useState<Date[]>([]);

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);

  // Fetch leave dates for the current month
  const fetchLeaveDates = async (date: Date) => {
    try {
      const startDate = formatDateForAPI(startOfMonth(date));
      const endDate = formatDateForAPI(endOfMonth(date));
      
      const response = await fetch(`/api/leaves?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const dates = result.data.leaves.map((leave: any) => new Date(leave.date));
        setLeaveDates(dates);
      }
    } catch (error) {
      console.error('Failed to fetch leave dates:', error);
      setLeaveDates([]);
    }
  };

  useEffect(() => {
    fetchLeaveDates(currentDate);
  }, [currentDate]);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = getDay(firstDayOfMonth);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimesheetEntry[]>();
    entries.forEach(entry => {
      const dateKey = format(entry.date, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(entry);
    });
    return map;
  }, [entries]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Helper to check if a date is a leave day
  const isLeaveDay = (date: Date) => {
    return leaveDates.some(leaveDate => {
      const dateString = formatDateForAPI(date);
      const leaveDateString = formatDateForAPI(leaveDate);
      return dateString === leaveDateString;
    });
  };

  const verticleColors: { [key: string]: string } = {
    CMIS: 'bg-chart-1',
    TRI: 'bg-chart-2',
    LOF: 'bg-chart-3',
    TRG: 'bg-chart-4',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
          {WEEKDAYS.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 mt-2">
          {Array.from({ length: startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="border-t border-r" />
          ))}
          {daysInMonth.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEntries = entriesByDate.get(dateKey) || [];
            const isDayLeave = isLeaveDay(day);
            const hasContent = dayEntries.length > 0 || isDayLeave;
            
            return (
              <Popover key={day.toString()}>
                <PopoverTrigger asChild disabled={!hasContent}>
                  <div
                    className={cn(
                      'h-24 border-t border-r p-2 text-left relative',
                      hasContent ? 'cursor-pointer hover:bg-secondary' : 'bg-muted/30',
                      isDayLeave && 'bg-red-50 border-red-200',
                      !isSameMonth(day, currentDate) && 'text-muted-foreground'
                    )}
                  >
                    <span className={cn("text-sm", isSameDay(day, new Date()) && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center')}>{format(day, 'd')}</span>
                    
                    {/* Leave day indicator */}
                    {isDayLeave && (
                      <div className="absolute top-1 right-1">
                        <CalendarIcon className="h-3 w-3 text-red-500" />
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                      {dayEntries.slice(0, 3).map(entry => (
                        <div key={entry.id} className={cn("h-2 w-2 rounded-full", verticleColors[entry.verticle] || 'bg-gray-400')} />
                      ))}
                    </div>
                    
                    {/* Leave day label */}
                    {isDayLeave && dayEntries.length === 0 && (
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                          Leave
                        </Badge>
                      </div>
                    )}
                  </div>
                </PopoverTrigger>
                {hasContent && (
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium leading-none">{format(day, 'PPP')}</h4>
                      
                      {isDayLeave && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Company Leave Day
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            No timesheet entries required on this day
                          </p>
                        </div>
                      )}
                      
                      {dayEntries.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Time Entries:</p>
                          {dayEntries.map(entry => (
                            <div key={entry.id} className="text-sm">
                               <p className="font-medium">{entry.task} <span className="text-muted-foreground font-mono">({formatTimeSpent(entry.hours)})</span></p>
                               <p className="text-xs text-muted-foreground">{employeeMap.get(entry.employeeId)} - <Badge variant="secondary">{entry.verticle}</Badge></p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                )}
              </Popover>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
