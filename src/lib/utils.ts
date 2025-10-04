import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { TimesheetEntry, Employee } from './types';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function downloadDataAsExcel(entries: TimesheetEntry[], employees: Employee[], fileName: string) {
  const employeeMap = new Map(employees.map(e => [e.id, e.name]));

  const dataToExport = entries.map(entry => ({
    'Date': format(entry.date, 'yyyy-MM-dd'),
    'Employee': employeeMap.get(entry.employeeId) || 'Unknown',
    'Verticle': entry.verticle,
    'Country': entry.country,
    'Task': entry.task,
    'Task Description': entry.taskDescription,
    'Hours': entry.hours,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheet Data');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function calculateDailyExtraTime(entries: TimesheetEntry[]): Map<string, number> {
  const STANDARD_WORK_HOURS = 8;
  const dailyHoursMap = new Map<string, number>();

  // Group entries by employee and date
  entries.forEach(entry => {
    const dateKey = `${entry.employeeId}-${format(entry.date, 'yyyy-MM-dd')}`;
    const currentHours = dailyHoursMap.get(dateKey) || 0;
    dailyHoursMap.set(dateKey, currentHours + entry.hours);
  });

  // Calculate extra time for each day
  const extraTimeMap = new Map<string, number>();
  dailyHoursMap.forEach((totalHours, dateKey) => {
    const extraHours = Math.max(0, totalHours - STANDARD_WORK_HOURS);
    if (extraHours > 0) {
      extraTimeMap.set(dateKey, extraHours);
    }
  });

  return extraTimeMap;
}

export function calculateEmployeeExtraTime(entries: TimesheetEntry[], employeeId: string): number {
  const employeeEntries = entries.filter(entry => entry.employeeId === employeeId);
  const extraTimeMap = calculateDailyExtraTime(employeeEntries);
  
  let totalExtraTime = 0;
  extraTimeMap.forEach(extraHours => {
    totalExtraTime += extraHours;
  });
  
  return totalExtraTime;
}

export function formatExtraTime(hours: number): string {
  if (hours === 0) return '0h';
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours % 1) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  } else {
    return `${wholeHours}h ${minutes}m`;
  }
}
