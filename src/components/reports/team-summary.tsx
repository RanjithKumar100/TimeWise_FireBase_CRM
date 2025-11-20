'use client';

import React, { useState, useMemo } from 'react';
import type { Employee, TimesheetEntry, Verticle, AggregatedVerticleData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SummaryChart from './summary-chart';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadDataAsExcel, calculateEmployeeExtraTime, formatExtraTime } from '@/lib/utils/helpers';
import { verticleColors } from '@/lib/constants/colors';
import { formatTimeSpent } from '@/lib/utils/time';

interface TeamSummaryProps {
  entries: TimesheetEntry[];
  employees: Employee[];
  preSelectedUserId?: string | null;
  onUserSelect?: (userId: string | null) => void;
}

export default function TeamSummary({ entries, employees, preSelectedUserId, onUserSelect }: TeamSummaryProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preSelectedUserId || 'all');

  // Update selection when preSelectedUserId changes
  React.useEffect(() => {
    setSelectedEmployeeId(preSelectedUserId || 'all');
  }, [preSelectedUserId]);

  // Notify parent when selection changes
  const handleSelectionChange = (value: string) => {
    setSelectedEmployeeId(value);
    if (onUserSelect) {
      onUserSelect(value === 'all' ? null : value);
    }
  };

  const selectedEntries = useMemo(() => {
    if (selectedEmployeeId === 'all') {
      console.log('📊 TeamSummary: Showing all entries', entries.length);
      return entries;
    }
    const filtered = entries.filter(entry => entry.employeeId === selectedEmployeeId);
    console.log('📊 TeamSummary: Filtered entries for', selectedEmployeeId, ':', filtered.length, 'out of', entries.length);
    return filtered;
  }, [entries, selectedEmployeeId]);

  const selectedEmployee = useMemo(() => {
    return selectedEmployeeId === 'all' ? null : employees.find(emp => emp.id === selectedEmployeeId);
  }, [selectedEmployeeId, employees]);

  // Get unique verticles from all entries dynamically
  const verticles = useMemo(() => {
    const uniqueVerticles = Array.from(new Set(entries.map(entry => entry.verticle)));
    return uniqueVerticles.sort(); // Sort alphabetically
  }, [entries]);

  const handleDownload = () => {
    const fileName = selectedEmployeeId === 'all'
      ? 'all-team-timesheet'
      : `${employees.find(e => e.id === selectedEmployeeId)?.name}-timesheet` || 'individual-timesheet';
    downloadDataAsExcel(selectedEntries, employees, fileName);
  };

  const aggregatedData = useMemo<AggregatedVerticleData[]>(() => {
    const dataMap = new Map<Verticle, { hours: number; minutes: number }>();
    verticles.forEach(v => dataMap.set(v, { hours: 0, minutes: 0 }));

    selectedEntries.forEach(entry => {
      const current = dataMap.get(entry.verticle) || { hours: 0, minutes: 0 };
      const hours = (entry as any).timeHours ?? Math.floor(entry.hours);
      const minutes = (entry as any).timeMinutes ?? Math.round((entry.hours - Math.floor(entry.hours)) * 60);

      const totalMinutes = (current.hours * 60 + current.minutes) + (hours * 60 + minutes);
      dataMap.set(entry.verticle, {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60
      });
    });

    return Array.from(dataMap.entries()).map(([verticle, time]) => ({
      verticle,
      totalHours: time.hours + (time.minutes / 60), // Keep decimal for chart compatibility
    }));
  }, [selectedEntries, verticles]);

  const teamOverallData = useMemo(() => {
    const employeeData = new Map<string, {
      name: string,
      hoursByVerticle: Map<Verticle, { hours: number; minutes: number; display: string }>,
      totalHours: number,
      totalMinutes: number,
      totalDisplay: string,
      extraTime: number,
      employeeId: string
    }>();

    // Filter employees based on selection
    const relevantEmployees = selectedEmployeeId === 'all' ? employees : employees.filter(emp => emp.id === selectedEmployeeId);

    relevantEmployees.forEach(emp => {
        const verticleMap = new Map<Verticle, { hours: number; minutes: number; display: string }>();
        verticles.forEach(v => verticleMap.set(v, { hours: 0, minutes: 0, display: '0h' }));
        employeeData.set(emp.id, {
          name: emp.name,
          hoursByVerticle: verticleMap,
          totalHours: 0,
          totalMinutes: 0,
          totalDisplay: '0h',
          extraTime: 0,
          employeeId: emp.id
        });
    });

    // Use selectedEntries instead of all entries to match the filter
    selectedEntries.forEach(entry => {
        const empData = employeeData.get(entry.employeeId);
        if (empData) {
            const hours = (entry as any).timeHours ?? Math.floor(entry.hours);
            const minutes = (entry as any).timeMinutes ?? Math.round((entry.hours - Math.floor(entry.hours)) * 60);

            // Update verticle-specific time
            const current = empData.hoursByVerticle.get(entry.verticle) || { hours: 0, minutes: 0, display: '0h' };
            const totalMinutes = (current.hours * 60 + current.minutes) + (hours * 60 + minutes);
            empData.hoursByVerticle.set(entry.verticle, {
              hours: Math.floor(totalMinutes / 60),
              minutes: totalMinutes % 60,
              display: formatTimeSpent(Math.floor(totalMinutes / 60), totalMinutes % 60)
            });

            // Update total time
            empData.totalMinutes += (hours * 60) + minutes;
        }
    });

    // Calculate totals and extra time for each employee
    employeeData.forEach((empData, employeeId) => {
        empData.totalHours = Math.floor(empData.totalMinutes / 60);
        empData.totalDisplay = formatTimeSpent(Math.floor(empData.totalMinutes / 60), empData.totalMinutes % 60);
        empData.extraTime = calculateEmployeeExtraTime(selectedEntries, employeeId);
    });

    return Array.from(employeeData.values());
  }, [selectedEntries, employees, selectedEmployeeId, verticles]);
  

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedEmployee ? `${selectedEmployee.name}'s Drilldown` : 'Team Member Drilldown'}
          </CardTitle>
          <CardDescription>
            {selectedEmployee 
              ? `Individual summary and data for ${selectedEmployee.name}`
              : 'Select a team member to see their summary and download their data.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={selectedEmployeeId} onValueChange={handleSelectionChange}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Members</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
             <Button onClick={handleDownload} disabled={selectedEntries.length === 0} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Excel
            </Button>
          </div>
          <SummaryChart key={selectedEmployeeId} data={aggregatedData} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>
              {selectedEmployee ? `${selectedEmployee.name}'s Overall Hours` : 'Team Overall Hours'}
            </CardTitle>
            <CardDescription>
              {selectedEmployee 
                ? `Total hours per verticle for ${selectedEmployee.name}`
                : 'Total hours per verticle for each team member.'
              }
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            {verticles.map(v => (
                              <TableHead key={v} className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-sm" 
                                    style={{ backgroundColor: verticleColors[v as keyof typeof verticleColors] }}
                                  ></div>
                                  {v}
                                </div>
                              </TableHead>
                            ))}
                            <TableHead className="text-right font-bold">Total</TableHead>
                            <TableHead className="text-right font-bold text-orange-600">Extra Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamOverallData.map(empData => (
                            <TableRow key={empData.name}>
                                <TableCell className="font-medium">{empData.name}</TableCell>
                                {verticles.map(v => <TableCell key={v} className="text-right">{empData.hoursByVerticle.get(v)?.display || '0h'}</TableCell>)}
                                <TableCell className="text-right font-bold">{empData.totalDisplay}</TableCell>
                                <TableCell className="text-right font-bold text-orange-600">
                                  {empData.extraTime > 0 ? formatExtraTime(empData.extraTime) : '0h'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
