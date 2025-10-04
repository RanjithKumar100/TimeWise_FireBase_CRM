'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { Employee, TimesheetEntry } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatTimeSpent } from '@/lib/time-utils';

interface TimesheetTableProps {
  entries: TimesheetEntry[];
  employees: Employee[];
}

export default function TimesheetTable({ entries, employees }: TimesheetTableProps) {
  const [filter, setFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(entry => {
        const employeeMatch = selectedEmployee === 'all' || entry.employeeId === selectedEmployee;
        const filterMatch =
          filter === '' ||
          entry.task.toLowerCase().includes(filter.toLowerCase()) ||
          entry.taskDescription?.toLowerCase().includes(filter.toLowerCase()) ||
          entry.verticle.toLowerCase().includes(filter.toLowerCase()) ||
          entry.country.toLowerCase().includes(filter.toLowerCase()) ||
          employeeMap.get(entry.employeeId)?.toLowerCase().includes(filter.toLowerCase());
        return employeeMatch && filterMatch;
      });
  }, [entries, filter, selectedEmployee, employeeMap]);

  return (
    <div className="space-y-4">
       <div className="flex items-center gap-4">
        <Input
          placeholder="Filter entries..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        {employees.length > 1 && (
         <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {employees.length > 1 && <TableHead>Employee</TableHead>}
              <TableHead>Verticle</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Time Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{format(entry.date, 'MMM d, yyyy')}</TableCell>
                {employees.length > 1 && <TableCell>{employeeMap.get(entry.employeeId) ?? 'Unknown'}</TableCell>}
                <TableCell>{entry.verticle}</TableCell>
                <TableCell>{entry.country}</TableCell>
                <TableCell>{entry.task}</TableCell>
                <TableCell className="max-w-xs truncate" title={entry.taskDescription || 'No description'}>{entry.taskDescription || 'No description'}</TableCell>
                <TableCell>
                  <Badge variant={(entry as any).status === 'rejected' ? 'destructive' : 'default'}>
                    {(entry as any).status === 'rejected' ? 'Rejected' : 'Approved'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {(entry as any).timeHours !== undefined && (entry as any).timeMinutes !== undefined
                    ? formatTimeSpent((entry as any).timeHours, (entry as any).timeMinutes)
                    : formatTimeSpent(entry.hours)
                  }
                </TableCell>
              </TableRow>
            ))}
            {filteredEntries.length === 0 && (
                <TableRow>
                    <TableCell colSpan={employees.length > 1 ? 8 : 7} className="h-24 text-center">
                        No results found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
