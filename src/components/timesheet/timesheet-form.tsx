'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Sparkles, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { TimesheetEntry, Verticle, Employee } from '@/lib/types';
import { suggestTimesheetDetails, SuggestTimesheetDetailsOutput } from '@/ai/flows/suggest-timesheet-details';
import { Badge } from '../ui/badge';


const verticles: Verticle[] = ['CMIS', 'TRI', 'LOF', 'TRG'];

const formSchema = z.object({
  date: z.date({ required_error: 'A date is required.' }),
  verticle: z.enum(verticles, { required_error: 'Please select a verticle.' }),
  country: z.string().min(2, 'Country must be at least 2 characters.'),
  task: z.string().min(3, 'Task description is required.'),
  hours: z.coerce.number().min(0.5, 'Minimum hours is 0.5.').max(24, 'Maximum hours is 24.'),
});

type TimesheetFormValues = z.infer<typeof formSchema>;

interface TimesheetFormProps {
  onSave: (data: Omit<TimesheetEntry, 'id' | 'employeeId'>) => void;
  currentUser: Employee;
  myTasks: string[];
}

export default function TimesheetForm({ onSave, currentUser, myTasks }: TimesheetFormProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SuggestTimesheetDetailsOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const form = useForm<TimesheetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      country: '',
      task: '',
      hours: 8,
    },
  });

  const onSubmit = (data: TimesheetFormValues) => {
    onSave(data);
    form.reset();
    setSuggestions(null);
    toast({
      title: 'Entry Saved!',
      description: 'Your time has been successfully logged.',
    });
  };

  const handleGetSuggestions = async () => {
    setIsSuggesting(true);
    setSuggestions(null);
    try {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      const result = await suggestTimesheetDetails({
        timeOfDay,
        previousTasks: myTasks.slice(0, 5),
        teamMember: currentUser.name,
      });
      setSuggestions(result);
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      toast({
        variant: "destructive",
        title: "Suggestion Failed",
        description: "Could not fetch AI suggestions at this time.",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const applySuggestion = <K extends keyof TimesheetFormValues>(field: K, value: TimesheetFormValues[K]) => {
     form.setValue(field, value, { shouldValidate: true });
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Log Your Time</CardTitle>
        <CardDescription>Fill in the details for your work session.</CardDescription>
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
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
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
            <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours Spent</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {suggestions && (
              <div className="space-y-3 rounded-lg border bg-secondary/50 p-3">
                <h4 className="text-sm font-medium">Suggestions</h4>
                {suggestions.suggestedVerticles?.length > 0 && <div><p className="text-xs text-muted-foreground mb-1">Verticles</p><div className="flex flex-wrap gap-1">{suggestions.suggestedVerticles.map(v => <Badge key={v} className="cursor-pointer" variant="outline" onClick={() => applySuggestion('verticle', v as Verticle)}>{v}</Badge>)}</div></div>}
                {suggestions.suggestedCountries?.length > 0 && <div><p className="text-xs text-muted-foreground mb-1">Countries</p><div className="flex flex-wrap gap-1">{suggestions.suggestedCountries.map(c => <Badge key={c} className="cursor-pointer" variant="outline" onClick={() => applySuggestion('country', c)}>{c}</Badge>)}</div></div>}
                {suggestions.suggestedTasks?.length > 0 && <div><p className="text-xs text-muted-foreground mb-1">Tasks</p><div className="flex flex-wrap gap-1">{suggestions.suggestedTasks.map(t => <Badge key={t} className="cursor-pointer" variant="outline" onClick={() => applySuggestion('task', t)}>{t}</Badge>)}</div></div>}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={handleGetSuggestions} disabled={isSuggesting}>
              {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Suggest
            </Button>
            <Button type="submit">Save Entry</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
