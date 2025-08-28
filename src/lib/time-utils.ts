export const convertHoursInput = (inputValue: number): number => {
  const inputStr = inputValue.toString();
  
  // Check if input has decimal point
  if (inputStr.includes('.')) {
    const [hours, decimal] = inputStr.split('.');
    const hoursNum = parseInt(hours);
    const decimalNum = parseInt(decimal);
    
    // Only allow decimals 1-6
    if (decimalNum < 1 || decimalNum > 6) {
      throw new Error('Invalid decimal. Only .1, .2, .3, .4, .5, .6 are allowed');
    }
    
    // If decimal is 5, convert to minutes (50 minutes)
    if (decimalNum === 5) {
      return parseFloat(`${hoursNum}.50`);
    }
    
    // If decimal is 6, round up to next whole hour
    if (decimalNum === 6) {
      return hoursNum + 1; // 8.6 → 9, 7.6 → 8, 2.6 → 3
    }
    
    // For decimals 1-4, keep as is (they represent 10, 20, 30, 40 minutes)
    return inputValue;
  }
  
  // Return original value for whole numbers
  return inputValue;
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
  const numValue = parseFloat(value);
  return convertHoursInput(numValue);
};