'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDateForAPI } from '@/lib/utils/date';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LeaveDate {
  _id: string;
  date: Date;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function LeaveManagement() {
  const { toast } = useToast();
  const [leaveDates, setLeaveDates] = useState<LeaveDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLeaveDate, setNewLeaveDate] = useState('');
  const [newLeaveDescription, setNewLeaveDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaveDates = async () => {
    try {
      const response = await fetch('/api/leaves', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave dates');
      }

      const result = await response.json();
      const leaves = result.data.leaves.map((leave: any) => ({
        ...leave,
        date: new Date(leave.date),
        createdAt: new Date(leave.createdAt),
        updatedAt: new Date(leave.updatedAt),
      }));
      setLeaveDates(leaves);
    } catch (error) {
      console.error('Error fetching leave dates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave dates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeave = async () => {
    if (!newLeaveDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        },
        body: JSON.stringify({
          date: formatDateForAPI(new Date(newLeaveDate)),
          description: newLeaveDescription.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add leave date');
      }

      const result = await response.json();
      const newLeave = {
        ...result.data.leave,
        date: new Date(result.data.leave.date),
        createdAt: new Date(result.data.leave.createdAt),
        updatedAt: new Date(result.data.leave.updatedAt),
      };

      setLeaveDates(prev => [...prev, newLeave].sort((a, b) => a.date.getTime() - b.date.getTime()));
      setAddDialogOpen(false);
      setNewLeaveDate('');
      setNewLeaveDescription('');

      toast({
        title: "Success",
        description: "Leave date added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add leave date",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    try {
      const response = await fetch(`/api/leaves/${leaveId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('timewise-auth-token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete leave date');
      }

      setLeaveDates(prev => prev.filter(leave => leave._id !== leaveId));

      toast({
        title: "Success",
        description: "Leave date deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete leave date",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLeaveDates();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const upcomingLeaves = leaveDates.filter(leave => !isDateInPast(leave.date));
  const pastLeaves = leaveDates.filter(leave => isDateInPast(leave.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leave Management</h2>
          <p className="text-muted-foreground">
            Manage company leave dates.
          </p>
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Leave Date
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Leave Date</DialogTitle>
              <DialogDescription>
                Add a new leave date. No timesheet reminders will be sent on this day.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="leave-date">Date *</Label>
                <Input
                  id="leave-date"
                  type="date"
                  value={newLeaveDate}
                  onChange={(e) => setNewLeaveDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="leave-description">Description (Optional)</Label>
                <Textarea
                  id="leave-description"
                  placeholder="e.g., Christmas Day, Company Holiday, etc."
                  value={newLeaveDescription}
                  onChange={(e) => setNewLeaveDescription(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {newLeaveDescription.length}/200 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLeave} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Leave Date'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <p>Loading leave dates...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Leaves */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Upcoming Leaves ({upcomingLeaves.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingLeaves.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No upcoming leave dates
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingLeaves.map((leave) => (
                    <div key={leave._id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{formatDate(leave.date)}</p>
                        {leave.description && (
                          <p className="text-sm text-muted-foreground">{leave.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Added on {leave.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Leave Date</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this leave date? 
                              Timesheet notifications will resume for this day.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteLeave(leave._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Leaves */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                Past Leaves ({pastLeaves.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pastLeaves.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No past leave dates
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pastLeaves.slice(0, 10).map((leave) => (
                    <div key={leave._id} className="flex items-start justify-between p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium text-gray-700">{formatDate(leave.date)}</p>
                        {leave.description && (
                          <p className="text-sm text-gray-600">{leave.description}</p>
                        )}
                        <Badge variant="secondary" className="mt-1">
                          Past
                        </Badge>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Leave Date</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this leave date from the records?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteLeave(leave._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                  {pastLeaves.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Showing 10 most recent past leaves
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}