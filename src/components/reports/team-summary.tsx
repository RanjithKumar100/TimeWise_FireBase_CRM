'use client';

import React, { useState, useMemo } from 'react';
import type { Employee, TimesheetEntry, Verticle, AggregatedVerticleData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SummaryChart from './summary-chart';

interface TeamSummaryProps {
  entries: TimesheetEntry[];
  employees: Employee[];
}

const verticles: Verticle[] = ['CMIS', 'TRI', 'LOF', 'TRG'];

export default function TeamSummary({ entries, employees }: TeamSummaryProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  const selectedEntries = useMemo(() => {
    if (selectedEmployeeId === 'all') {
      return entries;
    }
    return entries.filter(entry => entry.employeeId === selectedEmployeeId);
  }, [entries, selectedEmployeeId]);

  const aggregatedData = useMemo<AggregatedVerticleData[]>(() => {
    const dataMap = new Map<Verticle, number>();
    verticles.forEach(v => dataMap.set(v, 0));

    selectedEntries.forEach(entry => {
      dataMap.set(entry.verticle, (dataMap.get(entry.verticle) || 0) + entry.hours);
    });

    return Array.from(dataMap.entries()).map(([verticle, totalHours]) => ({
      verticle,
      totalHours,
    }));
  }, [selectedEntries]);

  const teamOverallData = useMemo(() => {
    const employeeData = new Map<string, { name: string, hoursByVerticle: Map<Verticle, number>, total: number }>();

    employees.forEach(emp => {
        const verticleMap = new Map<Verticle, number>();
        verticles.forEach(v => verticleMap.set(v, 0));
        employeeData.set(emp.id, { name: emp.name, hoursByVerticle: verticleMap, total: 0 });
    });

    entries.forEach(entry => {
        const empData = employeeData.get(entry.employeeId);
        if (empData) {
            empData.hoursByVerticle.set(entry.verticle, (empData.hoursByVerticle.get(entry.verticle) || 0) + entry.hours);
            empData.total += entry.hours;
        }
    });

    return Array.from(employeeData.values());
  }, [entries, employees]);
  

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Member Drilldown</CardTitle>
          <CardDescription>Select a team member to see their individual summary.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
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
          <SummaryChart data={aggregatedData} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Team Overall Hours</CardTitle>
            <CardDescription>Total hours per verticle for each team member.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            {verticles.map(v => <TableHead key={v} className="text-right">{v}</TableHead>)}
                            <TableHead className="text-right font-bold">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamOverallData.map(empData => (
                            <TableRow key={empData.name}>
                                <TableCell className="font-medium">{empData.name}</TableCell>
                                {verticles.map(v => <TableCell key={v} className="text-right">{empData.hoursByVerticle.get(v)?.toFixed(1)}</TableCell>)}
                                <TableCell className="text-right font-bold">{empData.total.toFixed(1)}</TableCell>
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
