export const formatDateForAPI = (date: Date): string => {
  // Format date in YYYY-MM-DD format using local timezone
  // Use local time methods to preserve the user's selected date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseAPIDate = (dateString: string): Date => {
  // Parse YYYY-MM-DD format and create date in UTC timezone
  // This prevents timezone shifts that cause issues with 1st of month
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};