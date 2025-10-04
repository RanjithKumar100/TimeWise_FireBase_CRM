// Helper function to convert decimal hours to "2h 12m" format for display
export const formatTimeSpent = (hours: number, minutes?: number): string => {
  // If minutes is provided, use the separate values directly
  if (minutes !== undefined) {
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }

  // Legacy support: convert decimal hours to hours/minutes format
  const roundedHours = Math.round(hours * 100) / 100;
  const wholeHours = Math.floor(roundedHours);
  const calculatedMinutes = Math.round((roundedHours - wholeHours) * 60);

  if (wholeHours === 0) {
    return `${calculatedMinutes}m`;
  } else if (calculatedMinutes === 0) {
    return `${wholeHours}h`;
  } else {
    return `${wholeHours}h ${calculatedMinutes}m`;
  }
};

// Helper function to convert hours and minutes to decimal hours for calculations
export const convertToDecimalHours = (hours: number, minutes: number): number => {
  return Math.round((hours + (minutes / 60)) * 100) / 100;
};

// Helper function to convert decimal hours back to hours and minutes
export const convertFromDecimalHours = (decimalHours: number): { hours: number; minutes: number } => {
  const roundedHours = Math.round(decimalHours * 100) / 100;
  const hours = Math.floor(roundedHours);
  const minutes = Math.round((roundedHours - hours) * 60);

  return { hours, minutes };
};

// Helper function to validate time input
export const validateTimeInput = (hours: number, minutes: number): { isValid: boolean; message?: string } => {
  if (hours < 0 || hours > 24) {
    return { isValid: false, message: 'Hours must be between 0 and 24' };
  }

  if (minutes < 0 || minutes > 59) {
    return { isValid: false, message: 'Minutes must be between 0 and 59' };
  }

  const totalMinutes = (hours * 60) + minutes;
  if (totalMinutes < 30) {
    return { isValid: false, message: 'Minimum time is 30 minutes' };
  }

  if (totalMinutes > (24 * 60)) {
    return { isValid: false, message: 'Maximum time is 24 hours' };
  }

  return { isValid: true };
};

export const formatHoursDisplay = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const remainder = hours - wholeHours;

  if (remainder === 0.5) {
    return `${wholeHours}.50`;
  }

  if (hours === 9.0) {
    return '9.00';
  }

  return hours.toString();
};

export const parseHoursInput = (value: string): number => {
  return parseFloat(value);
};

// Legacy function for backward compatibility
export const convertHoursInput = (inputValue: number): number => {
  return inputValue;
};