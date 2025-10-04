'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2, Clock, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { canEditTimesheetEntry, filterTimesheetEntriesForUser, getRoleDisplayName } from '@/lib/permissions';
import { useAuth } from '@/hooks/use-auth';
import type { TimesheetEntry, Employee } from '@/lib/types';
import { formatTimeSpent } from '@/lib/time-utils';

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
  const [permanentDeleteConfirmId, setPermanentDeleteConfirmId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10; // Show 10 entries per page

  const allFilteredEntries = useMemo(() => {
    if (!user) return [];
    
    if (showAllUsers && isAdmin()) {
      return entries;
    }
    
    return filterTimesheetEntriesForUser(entries, user);
  }, [entries, user, showAllUsers, isAdmin]);

  const totalPages = Math.ceil(allFilteredEntries.length / entriesPerPage);
  // Ensure currentPage is within valid bounds
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIndex = (safePage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedEntries = allFilteredEntries.slice(startIndex, endIndex);

  // Smart pagination: only reset to page 1 when current page becomes invalid
  React.useEffect(() => {
    const newTotalPages = Math.ceil(allFilteredEntries.length / entriesPerPage);
    // If current page is now beyond the available pages, go to the last available page
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
    // Only reset to page 1 if there are no entries at all
    else if (allFilteredEntries.length === 0) {
      setCurrentPage(1);
    }
    // Otherwise, stay on the current page
  }, [allFilteredEntries.length, currentPage, entriesPerPage]);

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
                Editable
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Can edit this entry</p>
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

  const handlePermanentDelete = (entryId: string) => {
    setPermanentDeleteConfirmId(null);
    // Let the parent handle the permanent deletion
    onDelete(entryId);
  };

  const canUserEdit = (entry: TimesheetEntry) => {
    if (!user) return false;
    // Rejected entries cannot be edited
    if (entry.status === 'rejected') return false;
    // Admin can edit any entry, users need permission check
    if (isAdmin()) return true;
    const permissions = getPermissionStatus(entry);
    return permissions?.canEdit || false;
  };

  const canUserDelete = (entry: TimesheetEntry) => {
    if (!user) return false;
    // Rejected entries cannot be deleted again
    if (entry.status === 'rejected') return false;
    // Admin can delete any entry, users need permission check
    if (isAdmin()) return true;
    const permissions = getPermissionStatus(entry);
    return permissions?.canDelete || false;
  };

  if (allFilteredEntries.length === 0) {
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
            {allFilteredEntries.length} {allFilteredEntries.length === 1 ? 'entry' : 'entries'}
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
                <TableHead>Description</TableHead>
                <TableHead>Time Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.map((entry) => (
                <TableRow 
                  key={entry.id} 
                  className={entry.status === 'rejected' ? 'opacity-60 bg-red-50 dark:bg-red-950/20' : ''}
                >
                  <TableCell className={`font-medium ${entry.status === 'rejected' ? 'line-through' : ''}`}>
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
                  <TableCell className={entry.status === 'rejected' ? 'line-through' : ''}>{entry.country}</TableCell>
                  <TableCell className={`max-w-[200px] truncate ${entry.status === 'rejected' ? 'line-through' : ''}`} title={entry.task}>
                    {entry.task}
                  </TableCell>
                  <TableCell className={`max-w-[300px] truncate ${entry.status === 'rejected' ? 'line-through' : ''}`} title={entry.taskDescription || 'No description'}>
                    {entry.taskDescription || 'No description'}
                  </TableCell>
                  <TableCell className={`font-mono ${entry.status === 'rejected' ? 'line-through opacity-60' : ''}`}>
                    {(entry as any).timeHours !== undefined && (entry as any).timeMinutes !== undefined
                      ? formatTimeSpent((entry as any).timeHours, (entry as any).timeMinutes)
                      : formatTimeSpent(entry.hours)
                    }
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={entry.status === 'rejected' ? 'destructive' : 'secondary'} 
                      className="text-xs"
                    >
                      {entry.status === 'rejected' ? 'Rejected' : 'Approved'}
                    </Badge>
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
                      
                      {/* Only show delete button in admin view (when showAllUsers is true) */}
                      {showAllUsers && (
                        <>
                          {entry.status !== 'rejected' ? (
                            <AlertDialog 
                              open={deleteConfirmId === entry.id} 
                              onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeleteConfirmId(entry.id)}
                                  disabled={!canUserDelete(entry)}
                                  className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                  title="Reject entry"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Time Entry</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject this time entry for {format(entry.date, 'MMM dd, yyyy')}? 
                                    The entry will be marked as rejected and will remain visible with a crossed-out appearance for audit purposes.
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
                          ) : (
                            <AlertDialog 
                              open={permanentDeleteConfirmId === entry.id} 
                              onOpenChange={(open) => !open && setPermanentDeleteConfirmId(null)}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPermanentDeleteConfirmId(entry.id)}
                                  className="h-8 w-8 p-0 hover:bg-red-600 hover:text-white"
                                  title="Permanently delete rejected entry"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Permanently Delete Entry</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete this rejected entry for {format(entry.date, 'MMM dd, yyyy')}? 
                                    This action cannot be undone and will completely remove the entry from the database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handlePermanentDelete(entry.id)}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                  >
                                    Permanently Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, allFilteredEntries.length)} of {allFilteredEntries.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safePage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                Page {safePage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}