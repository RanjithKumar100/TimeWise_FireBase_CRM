'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays, isWeekend } from 'date-fns';
import { useAuth } from './use-auth';
import { apiClient } from '@/lib/api';

export interface MissingLogDate {
  date: string;
  formattedDate: string;
  daysAgo: number;
}

export interface UserNotification {
  id: string;
  type: string;
  message: string;
  date: string;
  isRead: boolean;
  data: any;
}

interface NotificationState {
  dismissedNotifications: string[];
  lastChecked: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [missingDates, setMissingDates] = useState<MissingLogDate[]>([]);
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  const getStorageKey = useCallback(() => {
    return `notifications-dismissed-${user?.id || 'anonymous'}`;
  }, [user?.id]);

  const loadDismissedNotifications = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
          const data: NotificationState = JSON.parse(stored);
          const currentDate = format(new Date(), 'yyyy-MM-dd');
          
          // Reset dismissed notifications if it's a new day
          if (data.lastChecked !== currentDate) {
            setDismissedNotifications(new Set());
            localStorage.removeItem(getStorageKey());
          } else {
            setDismissedNotifications(new Set(data.dismissedNotifications));
          }
        }
      } catch (error) {
        console.error('Error loading dismissed notifications:', error);
        setDismissedNotifications(new Set());
      }
    }
  }, [getStorageKey]);

  const saveDismissedNotifications = useCallback((dismissed: Set<string>) => {
    if (typeof window !== 'undefined') {
      try {
        const data: NotificationState = {
          dismissedNotifications: Array.from(dismissed),
          lastChecked: format(new Date(), 'yyyy-MM-dd')
        };
        localStorage.setItem(getStorageKey(), JSON.stringify(data));
      } catch (error) {
        console.error('Error saving dismissed notifications:', error);
      }
    }
  }, [getStorageKey]);

  const fetchUserNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/user?limit=20&unreadOnly=true', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.notifications) {
          setUserNotifications(data.data.notifications);
        }
      }
    } catch (error) {
      console.error('Error fetching user notifications:', error);
    }
  }, [user]);

  const checkMissingLogs = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

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

        const loggedDates = new Set(
          userLogs.map(log => format(new Date(log.date), 'yyyy-MM-dd'))
        );

        const missing: MissingLogDate[] = [];
        for (let i = 1; i <= 14; i++) {
          const checkDate = subDays(new Date(), i);
          const dateString = format(checkDate, 'yyyy-MM-dd');

          if (isWeekend(checkDate)) continue;
          if (loggedDates.has(dateString)) continue;

          missing.push({
            date: dateString,
            formattedDate: format(checkDate, 'MMM dd, yyyy'),
            daysAgo: i,
          });
        }

        // Use functional state update to avoid dependency on dismissedNotifications
        setMissingDates(prev => {
          const filteredMissing = missing.filter(m => !dismissedNotifications.has(m.date));
          // Only update if the content actually changed
          if (JSON.stringify(prev) === JSON.stringify(filteredMissing)) {
            return prev;
          }
          return filteredMissing;
        });
      }

      // Also fetch user notifications
      await fetchUserNotifications();
    } catch (error) {
      console.error('Error checking missing logs:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dismissedNotifications, fetchUserNotifications]);

  const dismissNotification = useCallback((date: string) => {
    const newDismissed = new Set(dismissedNotifications);
    newDismissed.add(date);
    setDismissedNotifications(newDismissed);
    saveDismissedNotifications(newDismissed);
    
    setMissingDates(prev => prev.filter(d => d.date !== date));
  }, [dismissedNotifications, saveDismissedNotifications]);

  const dismissUserNotification = useCallback(async (notificationId: string) => {
    try {
      // Call API to mark notification as read/dismissed
      await fetch('/api/notifications/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        },
        body: JSON.stringify({ 
          notificationIds: [notificationId], 
          markAsRead: true 
        })
      });

      // Remove from local state
      setUserNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error dismissing user notification:', error);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      // Clear missing dates notifications
      const allDates = new Set([...dismissedNotifications, ...missingDates.map(d => d.date)]);
      setDismissedNotifications(allDates);
      saveDismissedNotifications(allDates);
      setMissingDates([]);

      // Clear user notifications
      if (userNotifications.length > 0) {
        const userNotificationIds = userNotifications.map(n => n.id);
        await fetch('/api/notifications/user', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
          },
          body: JSON.stringify({ 
            notificationIds: userNotificationIds, 
            markAsRead: true 
          })
        });
        setUserNotifications([]);
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }, [dismissedNotifications, missingDates, userNotifications, saveDismissedNotifications]);

  const refreshNotifications = useCallback(() => {
    if (user) {
      checkMissingLogs();
    }
  }, [user, checkMissingLogs]);

  // Auto-refresh notifications every 10 seconds and on page focus
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshNotifications();
    }, 10000); // 10 seconds for reasonable responsiveness

    // Also refresh when user returns to the page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshNotifications]);

  // Initialize - load dismissed notifications once when user changes
  useEffect(() => {
    if (user) {
      loadDismissedNotifications();
    }
  }, [user, loadDismissedNotifications]);

  // Check missing logs once after dismissed notifications are loaded
  useEffect(() => {
    if (user && dismissedNotifications.size >= 0) {
      checkMissingLogs();
    }
    // Only run when user changes, not when dismissedNotifications changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return {
    missingDates,
    userNotifications,
    loading,
    notificationCount: missingDates.length + userNotifications.length,
    dismissNotification,
    dismissUserNotification,
    clearAllNotifications,
    refreshNotifications
  };
}