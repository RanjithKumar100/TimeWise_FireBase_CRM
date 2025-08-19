
'use client';

import React, { useState, useMemo } from 'react';
import type { Employee, TimesheetEntry, AggregatedVerticleData } from '@/lib/types';
import { employees as initialEmployees, timesheetEntries as initialEntries } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Hourglass, BarChart, CheckSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

import TimesheetForm from '@/components/timesheet/timesheet-form';
import TimesheetTable from '@/components/timesheet/timesheet-table';
import CalendarView from '@/components/timesheet/calendar-view';
import IndividualSummary from '@/components/reports/individual-summary';
import StatsCard from '@/components/dashboard/stats-card';

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>(initialEntries);

  const currentUser = useMemo(() => {
    return user ? employees.find(e => e.id === user.id)! : null;
  }, [user, employees]);


  const handleSaveEntry = (newEntry: Omit<TimesheetEntry, 'id' | 'employeeId'>) => {
     if (!currentUser) return;
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
    currentUser ? timesheetEntries.filter(entry => entry.employeeId === currentUser.id) : [], 
    [timesheetEntries, currentUser]
  );

  const myHoursThisWeek = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return myEntries
      .filter(entry => entry.date > oneWeekAgo)
      .reduce((sum, entry) => sum + entry.hours, 0);
  }, [myEntries]);
  
  const myTasksThisMonth = useMemo(() => {
     const oneMonthAgo = new Date();
     oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
     const tasks = new Set(
       myEntries
         .filter(entry => entry.date > oneMonthAgo)
         .map(entry => entry.task)
     );
     return tasks.size;
  }, [myEntries]);
  
  if (!currentUser) {
    return <div className="flex h-full w-full items-center justify-center"><p>Loading user data...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="My Hours (Week)" value={myHoursThisWeek.toFixed(1)} icon={Clock} />
        <StatsCard title="My Tasks (Month)" value={myTasksThisMonth} icon={CheckSquare} />
        <StatsCard title="My Total Hours" value={myEntries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} icon={BarChart} />
         <StatsCard title="My Verticles" value={new Set(myEntries.map(e => e.verticle)).size} icon={Hourglass} />
      </div>

      <Tabs defaultValue="entry" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
          <TabsTrigger value="entry">My Time Entry</TabsTrigger>
          <TabsTrigger value="individual">My Summary</TabsTrigger>
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
                         <CardTitle>My Recent Entries</CardTitle>
                       </CardHeader>
                       <CardContent>
                          <TimesheetTable entries={myEntries} employees={[currentUser]} />
                       </CardContent>
                     </Card>
                   </TabsContent>
                   <TabsContent value="calendar" className="mt-4">
                      <CalendarView entries={myEntries} employees={[currentUser]} />
                   </TabsContent>
                </Tabs>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="individual" className="mt-4">
          <IndividualSummary entries={myEntries} employees={employees} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
