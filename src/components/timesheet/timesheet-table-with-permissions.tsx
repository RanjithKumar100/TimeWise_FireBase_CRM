'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { canEditTimesheetEntry, filterTimesheetEntriesForUser, getRoleDisplayName } from '@/lib/permissions';
import { useAuth } from '@/hooks/use-auth';
import type { TimesheetEntry, Employee } from '@/lib/types';

interface TimesheetTableProps {
  entries: TimesheetEntry[];
  employees: Employee[];
  onEdit?: (entry: TimesheetEntry) => void;
  onDelete: (entryId: string) => void;
  showAllUsers?: boolean;
}

export default function TimesheetTableWithPermissions({ 
  entries, 
  employees, 
  onEdit, 
  onDelete,
  showAllUsers = false
}: TimesheetTableProps) {
  const { user, isAdmin } = useAuth();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    if (!user) return [];
    
    if (showAllUsers && isAdmin()) {
      return entries;
    }
    
    return filterTimesheetEntriesForUser(entries, user);
  }, [entries, user, showAllUsers, isAdmin]);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  const getEmployeeRole = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? getRoleDisplayName(employee.role) : 'Unknown';
  };

  const getPermissionStatus = (entry: TimesheetEntry) => {
    if (!user) return null;
    return canEditTimesheetEntry(entry, user);
  };

  const renderPermissionIndicator = (entry: TimesheetEntry) => {
    const permissions = getPermissionStatus(entry);
    if (!permissions) return null;

    if (isAdmin()) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="default" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Full admin access - can edit anytime</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (permissions.canEdit) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {permissions.editTimeRemaining}d left
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Can edit for {permissions.editTimeRemaining} more days</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Locked
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit window expired - only admin can modify</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const handleEdit = (entry: TimesheetEntry) => {
    if (!user || !onEdit) return;
    
    // Admin can edit any entry, users need permission check
    if (isAdmin() || getPermissionStatus(entry)?.canEdit) {
      onEdit(entry);
    }
  };

  const handleDelete = (entryId: string) => {
    setDeleteConfirmId(null);
    onDelete(entryId);
  };

  const canUserEdit = (entry: TimesheetEntry) => {
    if (!user) return false;
    // Admin can edit any entry, users need permission check
    if (isAdmin()) return true;
    const permissions = getPermissionStatus(entry);
    return permissions?.canEdit || false;
  };

  const canUserDelete = (entry: TimesheetEntry) => {
    if (!user) return false;
    // Admin can delete any entry, users need permission check
    if (isAdmin()) return true;
    const permissions = getPermissionStatus(entry);
    return permissions?.canDelete || false;
  };

  if (filteredEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No time entries found.</p>
            <p className="text-sm">Start by logging your first time entry!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Time Entries
          <Badge variant="outline">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {showAllUsers && isAdmin() && <TableHead>Employee</TableHead>}
                <TableHead>Verticle</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {format(entry.date, 'MMM dd, yyyy')}
                  </TableCell>
                  {showAllUsers && isAdmin() && (
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{getEmployeeName(entry.employeeId)}</span>
                        <Badge variant={getEmployeeRole(entry.employeeId) === 'Admin' ? 'default' : 'secondary'} className="w-fit text-xs">
                          {getEmployeeRole(entry.employeeId)}
                        </Badge>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline">{entry.verticle}</Badge>
                  </TableCell>
                  <TableCell>{entry.country}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={entry.task}>
                    {entry.task}
                  </TableCell>
                  <TableCell>{entry.hours}h</TableCell>
                  <TableCell>
                    {entry.status === 'rejected' ? (
                      <Badge variant="destructive" className="text-xs">
                        Rejected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Approved
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                          disabled={!canUserEdit(entry)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <AlertDialog 
                        open={deleteConfirmId === entry.id} 
                        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirmId(entry.id)}
                            disabled={!canUserDelete(entry) || entry.status === 'rejected'}
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            title={entry.status === 'rejected' ? 'Already rejected' : 'Reject entry'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reject Time Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to reject this time entry for {format(entry.date, 'MMM dd, yyyy')}? 
                              The user will see this entry as rejected in their dashboard.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(entry.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Reject Entry
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}