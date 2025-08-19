'use client';

import React, { useMemo } from 'react';
import type { TimesheetEntry, Verticle, AggregatedVerticleData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SummaryChart from './summary-chart';

interface IndividualSummaryProps {
  entries: TimesheetEntry[];
}

const verticles: Verticle[] = ['CMIS', 'TRI', 'LOF', 'TRG'];

export default function IndividualSummary({ entries }: IndividualSummaryProps) {
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
                    <TableCell className="font-medium">{verticle}</TableCell>
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
    </Card>
  );
}
