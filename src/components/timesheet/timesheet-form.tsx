'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { TimesheetEntry, Employee } from '@/lib/types';


const verticles = ['CMIS', 'TRI', 'LOF', 'TRG'] as const;

const formSchema = z.object({
  date: z.date({ required_error: 'A date is required.' }),
  verticle: z.enum(verticles, { required_error: 'Please select a verticle.' }),
  country: z.string().min(2, 'Country must be at least 2 characters.'),
  task: z.string().min(3, 'Task description is required.'),
  hours: z.coerce.number().min(0, 'Hours cannot be negative.').max(23, 'Hours cannot exceed 23.'),
  minutes: z.coerce.number().min(0, 'Minutes cannot be negative.').max(59, 'Minutes cannot exceed 59.'),
}).refine((data) => {
  const totalMinutes = (data.hours * 60) + data.minutes;
  return totalMinutes >= 30 && totalMinutes <= (24 * 60); // At least 30 minutes, max 24 hours
}, {
  message: 'Total time must be between 30 minutes and 24 hours',
  path: ['hours'] // Show error on hours field
});

type TimesheetFormValues = z.infer<typeof formSchema>;

interface TimesheetFormProps {
  onSave: (data: Omit<TimesheetEntry, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => void;
  currentUser: Employee;
  myTasks: string[];
  editingEntry?: TimesheetEntry | null;
  onCancel?: () => void;
}

export default function TimesheetForm({ onSave, currentUser, myTasks, editingEntry, onCancel }: TimesheetFormProps) {
  const { toast } = useToast();

  const form = useForm<TimesheetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: editingEntry?.date || new Date(),
      verticle: editingEntry?.verticle,
      country: editingEntry?.country || '',
      task: editingEntry?.task || '',
      hours: editingEntry ? Math.floor(editingEntry.hours) : 8,
      minutes: editingEntry ? Math.round((editingEntry.hours - Math.floor(editingEntry.hours)) * 60) : 0,
    },
  });

  useEffect(() => {
    if (editingEntry) {
      form.reset({
        date: editingEntry.date,
        verticle: editingEntry.verticle,
        country: editingEntry.country,
        task: editingEntry.task,
        hours: Math.floor(editingEntry.hours),
        minutes: Math.round((editingEntry.hours - Math.floor(editingEntry.hours)) * 60),
      });
    }
  }, [editingEntry, form]);

  const onSubmit = (data: TimesheetFormValues) => {
    // Validate 6-day rule for non-admin users
    if (currentUser.role !== 'Admin') {
      const today = new Date();
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(today.getDate() - 6);
      
      if (data.date < sixDaysAgo) {
        toast({
          title: "Invalid Date",
          description: "You can only enter/edit data within the last 6 days.",
          variant: "destructive",
        });
        return;
      }
    }

    // Convert hours and minutes to decimal hours
    const totalHours = data.hours + (data.minutes / 60);
    const convertedData = {
      ...data,
      hours: totalHours
    };

    onSave(convertedData);
    if (!editingEntry) {
      form.reset();
    }
    toast({
      title: editingEntry ? 'Entry Updated!' : 'Entry Saved!',
      description: editingEntry ? 'Your time entry has been updated.' : 'Your time has been successfully logged.',
    });
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
                          const sixDaysAgo = new Date();
                          sixDaysAgo.setDate(today.getDate() - 6);
                          
                          // Admin can select any date (past only), users restricted to 6-day window
                          if (currentUser.role === 'Admin') {
                            return date > today || date < new Date('1900-01-01');
                          }
                          
                          // Users: only allow dates within the last 6 days (including today)
                          return date > today || date < sixDaysAgo;
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a verticle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {verticles.map((v) => (
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
                  <FormLabel>Task</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Video Editing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Time Spent Section */}
            <div className="space-y-4">
              <FormLabel>Time Spent</FormLabel>
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
