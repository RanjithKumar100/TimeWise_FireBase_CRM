'use client';

import React, { useState, useMemo } from 'react';
import type { Employee, TimesheetEntry, AggregatedVerticleData } from '@/lib/types';
import { employees as initialEmployees, timesheetEntries as initialEntries } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Hourglass, BarChart, Users } from 'lucide-react';

import TimesheetForm from '@/components/timesheet/timesheet-form';
import TimesheetTable from '@/components/timesheet/timesheet-table';
import CalendarView from '@/components/timesheet/calendar-view';
import IndividualSummary from '@/components/reports/individual-summary';
import TeamSummary from '@/components/reports/team-summary';
import StatsCard from '@/components/dashboard/stats-card';

// Assume current user is the manager 'Alex Johnson'
const CURRENT_USER_ID = '1';

export default function DashboardPage() {
  const [employees] = useState<Employee[]>(initialEmployees);
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>(initialEntries);
  const [currentUser] = useState<Employee>(() => employees.find(e => e.id === CURRENT_USER_ID)!);

  const handleSaveEntry = (newEntry: Omit<TimesheetEntry, 'id' | 'employeeId'>) => {
    setTimesheetEntries(prevEntries => [
      {
        ...newEntry,
        id: (prevEntries.length + 1).toString(),
        employeeId: currentUser.id,
      },
      ...prevEntries,
    ]);
  };
  
  const myEntries = useMemo(() => 
    timesheetEntries.filter(entry => entry.employeeId === currentUser.id), 
    [timesheetEntries, currentUser.id]
  );

  const totalHoursThisWeek = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return timesheetEntries
      .filter(entry => entry.date > oneWeekAgo)
      .reduce((sum, entry) => sum + entry.hours, 0);
  }, [timesheetEntries]);

  const projectsThisMonth = useMemo(() => {
     const oneMonthAgo = new Date();
     oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
     const projects = new Set(
       timesheetEntries
         .filter(entry => entry.date > oneMonthAgo)
         .map(entry => entry.verticle)
     );
     return projects.size;
  }, [timesheetEntries]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Hours (Week)" value={totalHoursThisWeek.toFixed(1)} icon={Clock} />
        <StatsCard title="Projects (Month)" value={projectsThisMonth} icon={Hourglass} />
        <StatsCard title="My Total Hours" value={myEntries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} icon={BarChart} />
        <StatsCard title="Team Size" value={employees.length} icon={Users} />
      </div>

      <Tabs defaultValue="entry" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="entry">Time Entry</TabsTrigger>
          <TabsTrigger value="individual">My Summary</TabsTrigger>
          <TabsTrigger value="team">Team Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <TimesheetForm 
                onSave={handleSaveEntry} 
                currentUser={currentUser}
                myTasks={myEntries.map(e => e.task)}
              />
            </div>
            <div className="lg:col-span-2">
                <Tabs defaultValue="list">
                   <TabsList>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                   </TabsList>
                   <TabsContent value="list" className="mt-4">
                     <Card>
                       <CardHeader>
                         <CardTitle>Recent Entries</CardTitle>
                       </CardHeader>
                       <CardContent>
                          <TimesheetTable entries={timesheetEntries} employees={employees} />
                       </CardContent>
                     </Card>
                   </TabsContent>
                   <TabsContent value="calendar" className="mt-4">
                      <CalendarView entries={timesheetEntries} employees={employees} />
                   </TabsContent>
                </Tabs>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="individual" className="mt-4">
          <IndividualSummary entries={myEntries} />
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <TeamSummary entries={timesheetEntries} employees={employees} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
