import type { Employee, TimesheetEntry, Verticle } from '@/lib/types';

export const employees: Employee[] = [
  { 
    id: '1', 
    name: 'Alex Johnson', 
    role: 'Admin', 
    password: 'admin123', 
    email: 'alex.johnson@timewise.com',
    isActive: true
  },
  { 
    id: '2', 
    name: 'Maria Garcia', 
    role: 'User', 
    password: 'user123', 
    email: 'maria.garcia@timewise.com',
    isActive: true
  },
  { 
    id: '3', 
    name: 'James Smith', 
    role: 'User', 
    password: 'user123', 
    email: 'james.smith@timewise.com',
    isActive: true
  },
  { 
    id: '4', 
    name: 'Priya Patel', 
    role: 'User', 
    password: 'user123', 
    email: 'priya.patel@timewise.com',
    isActive: true
  },
  { 
    id: '5', 
    name: 'Kenji Tanaka', 
    role: 'User', 
    password: 'user123', 
    email: 'kenji.tanaka@timewise.com',
    isActive: true
  },
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
  const entryDate = getRandomDate(30);
  const createdDate = new Date(entryDate);
  
  // Some entries created on the same day, some created a few days later
  const creationDelayDays = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 3);
  createdDate.setDate(createdDate.getDate() - creationDelayDays);
  
  return {
    id: (i + 1).toString(),
    date: entryDate,
    verticle: verticles[Math.floor(Math.random() * verticles.length)],
    country: countries[Math.floor(Math.random() * countries.length)],
    task: tasks[Math.floor(Math.random() * tasks.length)],
    hours: Math.round((Math.random() * 8 + 1) * 2) / 2, // Hours between 1 and 9, in 0.5 increments
    employeeId: employee.id,
    createdAt: createdDate,
    updatedAt: createdDate,
  };
}).sort((a, b) => b.date.getTime() - a.date.getTime());
