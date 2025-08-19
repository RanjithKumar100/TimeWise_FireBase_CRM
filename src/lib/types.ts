export type Verticle = 'CMIS' | 'TRI' | 'LOF' | 'TRG';

export type TimesheetEntry = {
  id: string;
  date: Date;
  verticle: Verticle;
  country: string;
  task: string;
  hours: number;
  employeeId: string;
};

export type Employee = {
  id: string;
  name: string;
  role: 'Employee' | 'Manager';
};

export type AggregatedVerticleData = {
  verticle: Verticle;
  totalHours: number;
};
