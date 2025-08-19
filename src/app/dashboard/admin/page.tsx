
'use client';

import React, { useState, useMemo } from 'react';
import type { Employee, TimesheetEntry, AggregatedVerticleData } from '@/lib/types';
import { employees as initialEmployees, timesheetEntries as initialEntries } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Hourglass, BarChart, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

import TimesheetTable from '@/components/timesheet/timesheet-table';
import CalendarView from '@/components/timesheet/calendar-view';
import TeamSummary from '@/components/reports/team-summary';
import StatsCard from '@/components/dashboard/stats-card';
import ManageUsers from '@/components/admin/manage-users';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [timesheetEntries] = useState<TimesheetEntry[]>(initialEntries);

  React.useEffect(() => {
    // Redirect if not a manager
    if (user && user.role !== 'Manager') {
      router.replace('/dashboard/user');
    }
  }, [user, router]);
  
  const handleUserAdded = (newUser: Employee) => {
      setEmployees(prev => [...prev, newUser]);
  }

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

  if (!user || user.role !== 'Manager') {
    return <div className="flex h-full w-full items-center justify-center"><p>Access Denied. Redirecting...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Hours (Week)" value={totalHoursThisWeek.toFixed(1)} icon={Clock} />
        <StatsCard title="Projects (Month)" value={projectsThisMonth} icon={Hourglass} />
        <StatsCard title="Total Hours (All)" value={timesheetEntries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} icon={BarChart} />
        <StatsCard title="Team Size" value={employees.length} icon={Users} />
      </div>

      <Tabs defaultValue="team-summary" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="team-summary">Team Summary</TabsTrigger>
          <TabsTrigger value="all-entries">All Entries</TabsTrigger>
          <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="team-summary" className="mt-4">
          <TeamSummary entries={timesheetEntries} employees={employees} />
        </TabsContent>

        <TabsContent value="all-entries" className="mt-4">
            <Tabs defaultValue="list">
               <TabsList>
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
               </TabsList>
               <TabsContent value="list" className="mt-4">
                 <Card>
                   <CardHeader>
                     <CardTitle>All Recent Entries</CardTitle>
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
        </TabsContent>
         <TabsContent value="manage-users" className="mt-4">
            <ManageUsers employees={employees} onUserAdded={handleUserAdded} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
