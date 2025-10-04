export type Verticle = string;

export type UserRole = 'Admin' | 'User' | 'Inspection';

export type TimesheetEntry = {
  id: string;
  date: Date;
  verticle: Verticle;
  country: string;
  task: string;
  taskDescription?: string;
  hours: number;
  status?: 'approved' | 'rejected';
  employeeId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Employee = {
  id: string;
  userId?: string; // For compatibility with existing code
  name: string;
  role: UserRole;
  password?: string;
  email?: string;
  isActive: boolean;
  department?: string; // For compatibility with existing code
  joinedAt?: Date; // For compatibility with existing code
};

export type PermissionCheck = {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type AggregatedVerticleData = {
  verticle: Verticle;
  totalHours: number;
};
