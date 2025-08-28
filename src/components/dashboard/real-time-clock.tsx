'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeClockProps {
  className?: string;
  showDate?: boolean;
  showSeconds?: boolean;
  format24Hour?: boolean;
  timezone?: string;
}

export function RealTimeClock({ 
  className,
  showDate = true,
  showSeconds = true,
  format24Hour = false,
  timezone = 'Asia/Kolkata' // Default to India timezone
}: RealTimeClockProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Prevent hydration mismatch by not rendering on server
  if (!isClient) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Clock className="h-4 w-4" />
        <div className="flex flex-col">
          <span className="font-mono">--:--:--</span>
          {showDate && <span className="text-xs">Loading...</span>}
        </div>
      </div>
    );
  }

  // Format time based on preferences
  const formatTime = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...(showSeconds && { second: '2-digit' }),
      hour12: !format24Hour,
      timeZone: timezone,
    };
    
    return date.toLocaleTimeString('en-US', options);
  };

  // Format date
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  // Get current day info
  const getDayInfo = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: timezone 
    });
  };

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm select-none group",
      "bg-gradient-to-r from-muted/30 to-muted/20 rounded-lg px-3 py-2",
      "border border-border/50 shadow-sm",
      "hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30",
      "hover:border-primary/20 transition-all duration-300",
      "hover:shadow-md hover:scale-[1.02]",
      className
    )}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary group-hover:animate-pulse transition-all duration-200" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-foreground tabular-nums tracking-wide">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {timezone.split('/')[1]?.replace('_', ' ') || 'Local'}
            </span>
          </div>
          {showDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 opacity-70" />
              <span className="font-medium">{getDayInfo(currentTime)}</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="opacity-80">{formatDate(currentTime)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Alternative compact version for smaller spaces
export function CompactClock({ className }: { className?: string }) {
  return (
    <RealTimeClock
      className={className}
      showDate={false}
      showSeconds={true}
      format24Hour={true}
    />
  );
}

// Alternative minimal version
export function MinimalClock({ className }: { className?: string }) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isClient) {
    return <span className={cn("font-mono text-sm text-muted-foreground", className)}>--:--:--</span>;
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-md",
      "bg-muted/20 border border-border/30",
      "hover:bg-muted/40 transition-colors duration-200",
      className
    )}>
      <Clock className="h-4 w-4 text-primary animate-pulse" />
      <span className="font-mono text-sm font-semibold tabular-nums tracking-wide">
        {currentTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata'
        })}
      </span>
    </div>
  );
}