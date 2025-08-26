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

interface NotificationState {
  dismissedNotifications: string[];
  lastChecked: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [missingDates, setMissingDates] = useState<MissingLogDate[]>([]);
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

        const filteredMissing = missing.filter(m => !dismissedNotifications.has(m.date));
        setMissingDates(filteredMissing);
      }
    } catch (error) {
      console.error('Error checking missing logs:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dismissedNotifications]);

  const dismissNotification = useCallback((date: string) => {
    const newDismissed = new Set(dismissedNotifications);
    newDismissed.add(date);
    setDismissedNotifications(newDismissed);
    saveDismissedNotifications(newDismissed);
    
    setMissingDates(prev => prev.filter(d => d.date !== date));
  }, [dismissedNotifications, saveDismissedNotifications]);

  const clearAllNotifications = useCallback(() => {
    const allDates = new Set([...dismissedNotifications, ...missingDates.map(d => d.date)]);
    setDismissedNotifications(allDates);
    saveDismissedNotifications(allDates);
    setMissingDates([]);
  }, [dismissedNotifications, missingDates, saveDismissedNotifications]);

  const refreshNotifications = useCallback(() => {
    if (user) {
      checkMissingLogs();
    }
  }, [user, checkMissingLogs]);

  // Initialize
  useEffect(() => {
    if (user) {
      loadDismissedNotifications();
    }
  }, [user, loadDismissedNotifications]);

  useEffect(() => {
    if (user && dismissedNotifications) {
      checkMissingLogs();
    }
  }, [user, dismissedNotifications, checkMissingLogs]);

  return {
    missingDates,
    loading,
    notificationCount: missingDates.length,
    dismissNotification,
    clearAllNotifications,
    refreshNotifications
  };
}