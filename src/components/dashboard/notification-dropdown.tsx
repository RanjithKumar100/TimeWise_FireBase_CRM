'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Clock } from 'lucide-react';
import { format, subDays, isWeekend } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api';

interface MissingLogDate {
  date: string;
  formattedDate: string;
  daysAgo: number;
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const [missingDates, setMissingDates] = useState<MissingLogDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkMissingLogs();
    }
  }, [user]);

  const checkMissingLogs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get work logs for the last 30 days
      const endDate = new Date();
      const startDate = subDays(endDate, 30);
      
      const response = await apiClient.getWorkLogs({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });

      if (response.success && response.data) {
        const userLogs = response.data.workLogs.filter(log => 
          user.role === 'Admin' ? true : log.userId === user.id
        );

        // Create a set of dates that have logs
        const loggedDates = new Set(
          userLogs.map(log => format(new Date(log.date), 'yyyy-MM-dd'))
        );

        // Check last 14 days (excluding weekends) for missing logs
        const missing: MissingLogDate[] = [];
        for (let i = 1; i <= 14; i++) {
          const checkDate = subDays(new Date(), i);
          const dateString = format(checkDate, 'yyyy-MM-dd');
          
          // Skip weekends
          if (isWeekend(checkDate)) continue;
          
          // Skip if log exists
          if (loggedDates.has(dateString)) continue;
          
          missing.push({
            date: dateString,
            formattedDate: format(checkDate, 'MMM dd, yyyy'),
            daysAgo: i,
          });
        }

        setMissingDates(missing);
      }
    } catch (error) {
      console.error('Error checking missing logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsNotified = (date: string) => {
    // Remove from notifications (in a real app, you might want to store this server-side)
    setMissingDates(prev => prev.filter(d => d.date !== date));
  };

  const notificationCount = missingDates.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px] font-semibold"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2 sticky top-0 bg-background border-b pb-2">
          <Bell className="h-4 w-4" />
          Timesheet Reminders
          {notificationCount > 0 && (
            <Badge variant="secondary">{notificationCount}</Badge>
          )}
        </DropdownMenuLabel>
        
        <ScrollArea className="max-h-80">
          {loading ? (
            <DropdownMenuItem disabled className="m-2">
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </DropdownMenuItem>
          ) : notificationCount === 0 ? (
            <DropdownMenuItem disabled className="m-2">
              <div className="flex flex-col items-center py-4 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  All caught up! No missing timesheets.
                </p>
              </div>
            </DropdownMenuItem>
          ) : (
            <div className="p-1">
              {missingDates.map((missing, index) => (
                <div key={missing.date}>
                  <DropdownMenuItem 
                    className="flex flex-col items-start p-3 cursor-default focus:bg-muted/50"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span className="font-medium text-sm">Missing Timesheet</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You have not updated your log time on{' '}
                          <span className="font-medium">{missing.formattedDate}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {missing.daysAgo === 1 ? 'Yesterday' : `${missing.daysAgo} days ago`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsNotified(missing.date)}
                        className="text-xs h-6 px-2 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </DropdownMenuItem>
                  {index < missingDates.length - 1 && <DropdownMenuSeparator className="mx-2" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notificationCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-center text-sm text-primary cursor-pointer m-2 justify-center font-medium"
              onClick={() => {
                // Navigate to timesheet page
                if (typeof window !== 'undefined') {
                  window.location.href = user?.role === 'Admin' ? '/dashboard/admin' : '/dashboard/user';
                }
              }}
            >
              <Clock className="mr-2 h-4 w-4" />
              Add Missing Timesheets
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}