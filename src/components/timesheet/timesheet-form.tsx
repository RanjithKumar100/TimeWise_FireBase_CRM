'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { TimesheetEntry, Employee } from '@/lib/types';
import { formatDateForAPI } from '@/lib/date-utils';


// Default task options (will be configurable by admin later)
const defaultTaskOptions: ComboboxOption[] = [
  { value: 'Video Editing', label: 'Video Editing' },
  { value: 'Content Creation', label: 'Content Creation' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Documentation', label: 'Documentation' },
  { value: 'Development', label: 'Development' },
  { value: 'Design', label: 'Design' },
  { value: 'Research', label: 'Research' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Training', label: 'Training' },
  { value: 'Client Communication', label: 'Client Communication' },
];

// Default verticles (fallback)
const defaultVerticles = ['CMIS', 'TRI', 'LOF', 'TRG'];

// Create form schema function that accepts dynamic verticles
const createFormSchema = (availableVerticles: string[]) => z.object({
  date: z.date({ required_error: 'A date is required.' }),
  verticle: z.string().refine((val) => availableVerticles.includes(val), {
    message: 'Please select a valid verticle.',
  }),
  country: z.string().min(2, 'Country must be at least 2 characters.'),
  task: z.string().min(3, 'Task name is required.'),
  taskDescription: z.string()
    .min(1, 'Task description is required.')
    .refine((value) => {
      const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
      return wordCount >= 3;
    }, {
      message: 'Task description must contain at least 3 words.',
    }),
  hours: z.coerce.number().min(0, 'Hours cannot be negative.').max(24, 'Hours cannot exceed 24.'),
  minutes: z.coerce.number().min(0, 'Minutes cannot be negative.').max(59, 'Minutes cannot exceed 59.'),
}).refine((data) => {
  const totalMinutes = (data.hours * 60) + data.minutes;
  return totalMinutes >= 30 && totalMinutes <= (24 * 60); // At least 30 minutes, max 24 hours
}, {
  message: 'Total time must be between 30 minutes and 24 hours',
  path: ['hours'] // Show error on hours field
});

type TimesheetFormValues = {
  date: Date;
  verticle: string;
  country: string;
  task: string;
  taskDescription: string;
  hours: number;
  minutes: number;
};

interface TimesheetFormProps {
  onSave: (data: Omit<TimesheetEntry, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'> & { taskDescription: string; hours: number; minutes: number }) => void;
  currentUser: Employee;
  myTasks: string[];
  editingEntry?: TimesheetEntry | null;
  onCancel?: () => void;
  refreshTrigger?: number; // Add this to trigger refresh when entries change
}

export default function TimesheetForm({ onSave, currentUser, myTasks, editingEntry, onCancel, refreshTrigger }: TimesheetFormProps) {
  const { toast } = useToast();
  const [leaveDates, setLeaveDates] = useState<Date[]>([]);
  const [dailyHours, setDailyHours] = useState(0);
  const [dailyHoursLoaded, setDailyHoursLoaded] = useState(false);
  const [taskOptions, setTaskOptions] = useState<ComboboxOption[]>(defaultTaskOptions);
  const [availableVerticles, setAvailableVerticles] = useState<string[]>(defaultVerticles);
  const [dailyHoursTarget, setDailyHoursTarget] = useState(8);
  const [editTimeLimit, setEditTimeLimit] = useState(3);
  const [formSchema, setFormSchema] = useState(() => createFormSchema(defaultVerticles));

  const fetchSystemConfig = async () => {
    try {
      const response = await fetch('/api/system-config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();

        // Update task options
        const taskOptions = result.data.availableTasks.map((task: string) => ({
          value: task,
          label: task
        }));
        setTaskOptions(taskOptions);

        // Update available verticles
        if (result.data.availableVerticles && result.data.availableVerticles.length > 0) {
          setAvailableVerticles(result.data.availableVerticles);
          setFormSchema(createFormSchema(result.data.availableVerticles));
          console.log('🔄 Updated available verticles:', result.data.availableVerticles);
        }

        // Update daily hours target from system config (use maxHoursPerDay as the daily target)
        setDailyHoursTarget(result.data.maxHoursPerDay || result.data.standardWorkingHours || 8);
        setEditTimeLimit(result.data.editTimeLimit || 3);
        console.log('🔄 Updated daily hours target:', result.data.maxHoursPerDay || result.data.standardWorkingHours || 8);
        console.log('🔄 Updated edit time limit:', result.data.editTimeLimit || 3);
      }
    } catch (error) {
      console.error('Failed to fetch system config:', error);
      // Keep default options on error
    }
  };

  const form = useForm<TimesheetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: editingEntry?.date || new Date(),
      verticle: editingEntry?.verticle,
      country: editingEntry?.country || '',
      task: editingEntry?.task || '',
      taskDescription: (editingEntry as any)?.taskDescription || '',
      hours: editingEntry ? ((editingEntry as any).timeHours !== undefined ? (editingEntry as any).timeHours : Math.floor(editingEntry.hours)) : 0,
      minutes: editingEntry ? ((editingEntry as any).timeMinutes !== undefined ? (editingEntry as any).timeMinutes : Math.round((Math.round(editingEntry.hours * 100) / 100 - Math.floor(editingEntry.hours)) * 60)) : 0,
    },
  });

  // Fetch daily hours for selected date
  const fetchDailyHours = async (selectedDate: Date) => {
    try {
      const dateString = formatDateForAPI(selectedDate);
      console.log('🔍 Fetching daily hours for date:', dateString, 'User:', currentUser.id);
      
      const response = await fetch('/api/worklogs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 API Response structure:', result);
        
        // Check different possible response structures
        let worklogsArray = [];
        if (result.data && result.data.worklogs) {
          worklogsArray = result.data.worklogs;
        } else if (result.data && result.data.workLogs) {
          worklogsArray = result.data.workLogs;
        } else if (result.worklogs) {
          worklogsArray = result.worklogs;
        } else if (result.workLogs) {
          worklogsArray = result.workLogs;
        } else if (Array.isArray(result)) {
          worklogsArray = result;
        } else {
          console.error('❌ Unknown API response structure:', result);
          setDailyHoursLoaded(true);
          return;
        }

        // Filter worklogs for the selected date and current user
        const dailyLogs = worklogsArray.filter((log: any) => {
          const logDate = formatDateForAPI(new Date(log.date));
          return logDate === dateString && log.employeeId === currentUser.id;
        });

        // Calculate total hours for the day (excluding current editing entry if any)
        const totalHours = dailyLogs
          .filter((log: any) => editingEntry ? log.id !== editingEntry.id : true)
          .reduce((sum: number, log: any) => sum + log.hours, 0);
        
        console.log('🔍 Daily logs found:', dailyLogs.length, 'Total hours:', totalHours);
        setDailyHours(Math.round(totalHours * 100) / 100);
        setDailyHoursLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch daily hours:', error);
      setDailyHoursLoaded(true); // Set loaded even on error to prevent infinite loading
    }
  };

  // Fetch leave dates
  const fetchLeaveDates = async () => {
    try {
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      const startDate = formatDateForAPI(threeMonthsAgo);
      const endDate = formatDateForAPI(today);
      
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
    }
  };

  useEffect(() => {
    fetchLeaveDates();
    fetchSystemConfig();
    // Fetch initial daily hours for today or editing entry date
    const selectedDate = editingEntry?.date || new Date();
    fetchDailyHours(selectedDate);
  }, []);

  // Refresh task options when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchSystemConfig();
    }
  }, [refreshTrigger]);

  // Listen for system config updates
  useEffect(() => {
    const handleConfigUpdate = () => {
      fetchSystemConfig();
    };

    window.addEventListener('systemConfigUpdated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('systemConfigUpdated', handleConfigUpdate);
    };
  }, []);

  // Fetch daily hours when date changes
  useEffect(() => {
    const selectedDate = form.watch('date');
    if (selectedDate) {
      setDailyHoursLoaded(false);
      fetchDailyHours(selectedDate);
    }
  }, [form.watch('date')]);

  // Refresh daily hours when refreshTrigger changes (when entries are deleted/modified)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('🔄 RefreshTrigger changed:', refreshTrigger);
      const selectedDate = form.getValues('date') || new Date();
      console.log('🔄 Refreshing hours for date:', formatDateForAPI(selectedDate));
      setDailyHoursLoaded(false);
      fetchDailyHours(selectedDate);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    if (editingEntry) {
      form.reset({
        date: editingEntry.date,
        verticle: editingEntry.verticle,
        country: editingEntry.country,
        task: editingEntry.task,
        taskDescription: (editingEntry as any)?.taskDescription || '',
        hours: (editingEntry as any).timeHours !== undefined ? (editingEntry as any).timeHours : Math.floor(editingEntry.hours),
        minutes: (editingEntry as any).timeMinutes !== undefined ? (editingEntry as any).timeMinutes : Math.round((Math.round(editingEntry.hours * 100) / 100 - Math.floor(editingEntry.hours)) * 60),
      });
    }
  }, [editingEntry, form]);

  const onSubmit = (data: TimesheetFormValues) => {
    // Validate edit window rule for non-admin users (gets limit from system config)
    if (currentUser.role !== 'Admin') {
      const today = new Date();
      const limitDaysAgo = new Date();
      limitDaysAgo.setDate(today.getDate() - editTimeLimit);

      if (data.date < limitDaysAgo) {
        toast({
          title: "Invalid Date",
          description: `You can only enter/edit data within the last ${editTimeLimit} days.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate leave day for non-admin users
    if (currentUser.role !== 'Admin') {
      const isLeaveDay = leaveDates.some(leaveDate => {
        const dateString = formatDateForAPI(data.date);
        const leaveDateString = formatDateForAPI(leaveDate);
        return dateString === leaveDateString;
      });

      if (isLeaveDay) {
        toast({
          title: "Leave Day",
          description: "Cannot create timesheet entries on company leave days. Contact admin if this entry is required.",
          variant: "destructive",
        });
        return;
      }
    }

    // Send hours and minutes separately instead of converting to decimal
    const convertedData = {
      ...data,
      hours: data.hours,
      minutes: data.minutes
    };

    onSave(convertedData);
    
    // Smart reset: preserve verticle selection for new entries, full reset for edits
    if (!editingEntry) {
      const currentVerticle = form.getValues('verticle');
      
      // Keep the same date if it's today, otherwise reset to today
      const today = new Date();
      const isToday = data.date.toDateString() === today.toDateString();
      
      form.reset({
        date: isToday ? data.date : today,
        verticle: currentVerticle, // Preserve the selected verticle
        country: '',
        task: '',
        taskDescription: '',
        hours: 0,
        minutes: 0,
      });
    }
    
    // Let the parent component handle refreshing via refreshTrigger
    console.log('✅ Entry saved, waiting for parent refreshTrigger...');
  };

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };


  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{editingEntry ? 'Edit Time Entry' : 'Log Your Time'}</CardTitle>
        <CardDescription>
          {editingEntry 
            ? 'Update the details for this work session.'
            : 'Fill in the details for your work session.'
          }
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const today = new Date();
                          const limitDaysAgo = new Date();
                          limitDaysAgo.setDate(today.getDate() - editTimeLimit);
                          
                          // Check if date is a leave day (disabled for non-admins)
                          const isLeaveDay = leaveDates.some(leaveDate => {
                            const dateString = formatDateForAPI(date);
                            const leaveDateString = formatDateForAPI(leaveDate);
                            return dateString === leaveDateString;
                          });
                          
                          // Admin can select any date (past only), but leave days get visual indication
                          if (currentUser.role === 'Admin') {
                            return date > today || date < new Date('1900-01-01');
                          }
                          
                          // Users: disabled if future date, older than edit time limit, or leave day
                          return date > today || date < limitDaysAgo || isLeaveDay;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="verticle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verticle</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a verticle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableVerticles.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="task"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a task" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" side="bottom" sideOffset={5} avoidCollisions={false}>
                      {taskOptions.map((task) => (
                        <SelectItem key={task.value} value={task.value}>
                          {task.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taskDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide a detailed description of the work..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground">
                    Word count: {field.value ? field.value.trim().split(/\s+/).filter(word => word.length > 0).length : 0} / 3 minimum
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Hours</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="23"
                        {...field}
                        placeholder="0-23"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Minutes</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="59"
                        step="1"
                        {...field}
                        placeholder="0-59"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <div className="flex gap-2">
              {editingEntry && onCancel && (
                <Button variant="outline" type="button" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit">
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}