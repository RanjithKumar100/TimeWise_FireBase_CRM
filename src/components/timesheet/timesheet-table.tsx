'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { Employee, TimesheetEntry } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Verticle</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Task</TableHead>
              <TableHead className="text-right">Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{format(entry.date, 'MMM d, yyyy')}</TableCell>
                <TableCell>{employeeMap.get(entry.employeeId) ?? 'Unknown'}</TableCell>
                <TableCell>{entry.verticle}</TableCell>
                <TableCell>{entry.country}</TableCell>
                <TableCell>{entry.task}</TableCell>
                <TableCell className="text-right">{entry.hours.toFixed(1)}</TableCell>
              </TableRow>
            ))}
            {filteredEntries.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
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
