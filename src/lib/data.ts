import type { Employee, TimesheetEntry, Verticle } from '@/lib/types';

export const employees: Employee[] = [
  { id: '1', name: 'Alex Johnson', role: 'Manager' },
  { id: '2', name: 'Maria Garcia', role: 'Employee' },
  { id: '3', name: 'James Smith', role: 'Employee' },
  { id: '4', name: 'Priya Patel', role: 'Employee' },
  { id: '5', name: 'Kenji Tanaka', role: 'Employee' },
];

const today = new Date();
const getRandomDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(today.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
};

const verticles: Verticle[] = ['CMIS', 'TRI', 'LOF', 'TRG'];
const countries = ['USA', 'UK', 'Canada', 'Australia', 'Japan'];
const tasks = [
  'Video Editing',
  'Graphic Design',
  'Sound Mixing',
  'Animation',
  'Project Management',
];

export const timesheetEntries: TimesheetEntry[] = Array.from({ length: 50 }, (_, i) => {
  const employee = employees[Math.floor(Math.random() * employees.length)];
  return {
    id: (i + 1).toString(),
    date: getRandomDate(30),
    verticle: verticles[Math.floor(Math.random() * verticles.length)],
    country: countries[Math.floor(Math.random() * countries.length)],
    task: tasks[Math.floor(Math.random() * tasks.length)],
    hours: Math.round((Math.random() * 8 + 1) * 2) / 2, // Hours between 1 and 9, in 0.5 increments
    employeeId: employee.id,
  };
}).sort((a, b) => b.date.getTime() - a.date.getTime());
