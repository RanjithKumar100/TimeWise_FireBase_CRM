import type { Employee, TimesheetEntry, PermissionCheck, UserRole } from './types';

/**
 * Calculates the number of days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / msPerDay);
}

/**
 * Checks if a user can edit a timesheet entry based on role and rolling 6-day window
 */
export function canEditTimesheetEntry(
  entry: TimesheetEntry,
  currentUser: Employee,
  currentDate: Date = new Date()
): PermissionCheck {
  // Admin has full access to everything
  if (currentUser.role === 'Admin') {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
    };
  }

  // Users can only access their own entries
  if (entry.employeeId !== currentUser.id) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
    };
  }

  // User can view their own entries
  const result: PermissionCheck = {
    canView: true,
    canEdit: false,
    canDelete: false,
  };

  // Calculate days since record date using rolling 6-day window
  const daysSinceRecordDate = daysBetween(entry.date, currentDate);
  const editTimeRemaining = Math.max(0, 6 - daysSinceRecordDate);

  result.editTimeRemaining = editTimeRemaining;

  // Rolling 6-day window: user can edit if record date is within last 6 days (including today)
  // daysSinceRecordDate >= 0 ensures we don't allow future dates
  // daysSinceRecordDate <= 6 ensures it's within the rolling window
  if (daysSinceRecordDate >= 0 && daysSinceRecordDate <= 6) {
    result.canEdit = true;
    result.canDelete = true;
  }

  return result;
}

/**
 * Filters timesheet entries based on user permissions
 */
export function filterTimesheetEntriesForUser(
  entries: TimesheetEntry[],
  currentUser: Employee
): TimesheetEntry[] {
  if (currentUser.role === 'Admin') {
    return entries;
  }

  return entries.filter(entry => entry.employeeId === currentUser.id);
}

/**
 * Checks if user has admin privileges
 */
export function isAdmin(user: Employee): boolean {
  return user.role === 'Admin';
}

/**
 * Checks if user can manage other users
 */
export function canManageUsers(user: Employee): boolean {
  return user.role === 'Admin';
}

/**
 * Checks if user can view all data
 */
export function canViewAllData(user: Employee): boolean {
  return user.role === 'Admin';
}

/**
 * Gets user-friendly role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'Admin':
      return 'Administrator';
    case 'User':
      return 'User';
    default:
      return 'Unknown';
  }
}

/**
 * Validates if a role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return role === 'Admin' || role === 'User';
}