'use client';

import React, { useMemo } from 'react';
import type { TimesheetEntry, Verticle, AggregatedVerticleData, Employee } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SummaryChart from './summary-chart';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadDataAsExcel } from '@/lib/utils';
import { verticleColors } from '@/lib/colors';


interface IndividualSummaryProps {
  entries: TimesheetEntry[];
  employees: Employee[];
}

const verticles: Verticle[] = ['CMIS', 'TRI', 'LOF', 'TRG'];

export default function IndividualSummary({ entries, employees }: IndividualSummaryProps) {
  const aggregatedData = useMemo<AggregatedVerticleData[]>(() => {
    const dataMap = new Map<Verticle, number>();
    verticles.forEach(v => dataMap.set(v, 0));

    entries.forEach(entry => {
      dataMap.set(entry.verticle, (dataMap.get(entry.verticle) || 0) + entry.hours);
    });

    return Array.from(dataMap.entries()).map(([verticle, totalHours]) => ({
      verticle,
      totalHours,
    }));
  }, [entries]);

  const totalHours = useMemo(() => {
    return entries.reduce((sum, entry) => sum + entry.hours, 0);
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
                {aggregatedData.map(({ verticle, totalHours: verticleHours }) => (
                  <TableRow key={verticle}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-sm" 
                          style={{ backgroundColor: verticleColors[verticle as keyof typeof verticleColors] }}
                        ></div>
                        {verticle}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{verticleHours.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      {totalHours > 0 ? ((verticleHours / totalHours) * 100).toFixed(1) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
                 <TableRow className="font-bold bg-secondary">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{totalHours.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{totalHours > 0 ? '100.0%' : '0.0%'}</TableCell>
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
