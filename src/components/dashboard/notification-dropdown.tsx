'use client';

import React from 'react';
import { Bell, Calendar, Clock, X, RefreshCw, AlertTriangle } from 'lucide-react';
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
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationDropdown() {
  const { user } = useAuth();
  const { 
    missingDates, 
    userNotifications,
    loading, 
    notificationCount, 
    dismissNotification, 
    dismissUserNotification,
    clearAllNotifications,
    refreshNotifications 
  } = useNotifications();

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
        <DropdownMenuLabel className="flex items-center justify-between sticky top-0 bg-background border-b pb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {notificationCount > 0 && (
              <Badge variant="secondary">{notificationCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNotifications}
              className="h-6 px-2 text-xs hover:bg-muted"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {notificationCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="h-6 px-2 text-xs hover:bg-muted"
              >
                Clear All
              </Button>
            )}
          </div>
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
                  All caught up! No notifications.
                </p>
              </div>
            </DropdownMenuItem>
          ) : (
            <div className="p-1">
              {/* User Notifications (Entry Rejections, etc) */}
              {userNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <DropdownMenuItem 
                    className="flex flex-col items-start p-3 cursor-default focus:bg-muted/50"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {notification.type === 'entry_rejected' ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="font-medium text-sm">
                            {notification.type === 'entry_rejected' ? 'Entry Rejected' : 'Notification'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissUserNotification(notification.id)}
                        className="text-xs h-6 px-2 hover:bg-destructive hover:text-destructive-foreground flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Dismiss
                      </Button>
                    </div>
                  </DropdownMenuItem>
                  {index < userNotifications.length - 1 && <DropdownMenuSeparator className="mx-2" />}
                </div>
              ))}
              
              {/* Add separator between user notifications and missing dates */}
              {userNotifications.length > 0 && missingDates.length > 0 && (
                <DropdownMenuSeparator className="mx-2" />
              )}
              
              {/* Missing Timesheet Notifications */}
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
                        onClick={() => dismissNotification(missing.date)}
                        className="text-xs h-6 px-2 hover:bg-destructive hover:text-destructive-foreground flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
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