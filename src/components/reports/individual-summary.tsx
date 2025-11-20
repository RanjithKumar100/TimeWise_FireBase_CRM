'use client';

import React, { useMemo } from 'react';
import type { TimesheetEntry, Verticle, AggregatedVerticleData, Employee } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SummaryChart from './summary-chart';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadDataAsExcel } from '@/lib/utils/helpers';
import { verticleColors } from '@/lib/constants/colors';
import { formatTimeSpent } from '@/lib/utils/time';


interface IndividualSummaryProps {
  entries: TimesheetEntry[];
  employees: Employee[];
}

export default function IndividualSummary({ entries, employees }: IndividualSummaryProps) {
  const aggregatedData = useMemo<AggregatedVerticleData[]>(() => {
    const dataMap = new Map<Verticle, { hours: number; minutes: number }>();

    // Get unique verticles from entries dynamically
    const uniqueVerticles = Array.from(new Set(entries.map(entry => entry.verticle)));
    uniqueVerticles.forEach(v => dataMap.set(v, { hours: 0, minutes: 0 }));

    entries.forEach(entry => {
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
      displayTime: formatTimeSpent(time.hours, time.minutes),
    }));
  }, [entries]);

  const totalTime = useMemo(() => {
    const totalMinutes = entries.reduce((sum, entry) => {
      const hours = (entry as any).timeHours ?? Math.floor(entry.hours);
      const minutes = (entry as any).timeMinutes ?? Math.round((entry.hours - Math.floor(entry.hours)) * 60);
      return sum + (hours * 60) + minutes;
    }, 0);

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      display: formatTimeSpent(Math.floor(totalMinutes / 60), totalMinutes % 60),
      decimal: Math.floor(totalMinutes / 60) + (totalMinutes % 60) / 60
    };
  }, [entries]);
  
  const handleDownload = () => {
    const employeeId = entries[0]?.employeeId;
    const employeeName = employees.find(e => e.id === employeeId)?.name || 'individual';
    downloadDataAsExcel(entries, employees, `${employeeName}-timesheet`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SummaryChart data={aggregatedData} />
        <div>
          <h3 className="text-lg font-semibold mb-2">Hours by Verticle</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Verticle</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregatedData.map((item) => (
                  <TableRow key={item.verticle}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: verticleColors[item.verticle as keyof typeof verticleColors] }}
                        ></div>
                        {item.verticle}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{(item as any).displayTime}</TableCell>
                    <TableCell className="text-right">
                      {totalTime.decimal > 0 ? ((item.totalHours / totalTime.decimal) * 100).toFixed(1) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
                 <TableRow className="font-bold bg-secondary">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{totalTime.display}</TableCell>
                    <TableCell className="text-right">{totalTime.decimal > 0 ? '100.0%' : '0.0%'}</TableCell>
                  </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
       <CardFooter className="justify-end">
          <Button onClick={handleDownload} disabled={entries.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Download Excel
          </Button>
      </CardFooter>
    </Card>
  );
}
