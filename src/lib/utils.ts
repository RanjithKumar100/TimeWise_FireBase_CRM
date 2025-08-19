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
    'Hours': entry.hours,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheet Data');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
