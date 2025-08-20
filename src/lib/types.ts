export type Verticle = 'CMIS' | 'TRI' | 'LOF' | 'TRG';

export type UserRole = 'Admin' | 'User';

export type TimesheetEntry = {
  id: string;
  date: Date;
  verticle: Verticle;
  country: string;
  task: string;
  hours: number;
  employeeId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Employee = {
  id: string;
  name: string;
  role: UserRole;
  password?: string;
  email?: string;
  isActive: boolean;
};

export type PermissionCheck = {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  editTimeRemaining?: number; // in days
};

export type AggregatedVerticleData = {
  verticle: Verticle;
  totalHours: number;
};
