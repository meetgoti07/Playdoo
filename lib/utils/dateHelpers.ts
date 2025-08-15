/**
 * Utility functions for safe date and time handling
 * These functions prevent "Invalid time value" errors by validating dates before operations
 */

/**
 * Safely converts a date value to a Date object
 * @param date - The date value to convert (Date, string, or number)
 * @returns Valid Date object or null if invalid
 */
export function safeToDate(date: any): Date | null {
  if (!date) return null;
  
  try {
    // If already a Date object
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Convert to Date
    const convertedDate = new Date(date);
    return isNaN(convertedDate.getTime()) ? null : convertedDate;
  } catch (error) {
    return null;
  }
}

/**
 * Safely converts date to string format
 * @param date - The date value to convert
 * @returns Formatted date string or 'Invalid Date'
 */
export function safeToDateString(date: any): string {
  const validDate = safeToDate(date);
  if (!validDate) return 'Invalid Date';
  
  try {
    return validDate.toDateString();
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Safely converts date to ISO string format
 * @param date - The date value to convert
 * @returns ISO string or 'Invalid Date'
 */
export function safeToISOString(date: any): string {
  const validDate = safeToDate(date);
  if (!validDate) return 'Invalid Date';
  
  try {
    return validDate.toISOString();
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Safely formats time value for display
 * @param time - Time value (Date object, time string, etc.)
 * @param locale - Locale for formatting (default: 'en-IN')
 * @returns Formatted time string or 'Invalid Time'
 */
export function safeFormatTime(time: any, locale: string = 'en-IN'): string {
  if (!time) return 'Invalid Time';
  
  try {
    let timeDate: Date;
    
    // Handle if time is already a Date object
    if (time instanceof Date) {
      if (isNaN(time.getTime())) return 'Invalid Time';
      timeDate = time;
    } 
    // Handle if time is a string in HH:MM:SS format
    else if (typeof time === 'string' && /^(\d{1,2}):(\d{1,2})(:(\d{1,2}))?$/.test(time)) {
      const [hours, minutes, seconds = '0'] = time.split(':');
      timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);
      
      if (isNaN(timeDate.getTime())) return 'Invalid Time';
    }
    // Try parsing as full date string
    else {
      timeDate = new Date(time);
      if (isNaN(timeDate.getTime())) return 'Invalid Time';
    }
    
    return timeDate.toLocaleTimeString(locale, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    return 'Invalid Time';
  }
}

/**
 * Safely gets timestamp from date
 * @param date - Date value to get timestamp from
 * @returns Timestamp in milliseconds or 0 if invalid
 */
export function safeGetTime(date: any): number {
  const validDate = safeToDate(date);
  return validDate ? validDate.getTime() : 0;
}

/**
 * Safely calculates the difference between two dates in hours
 * @param startDate - Start date/time
 * @param endDate - End date/time
 * @returns Number of hours or 0 if invalid dates
 */
export function safeCalculateHours(startDate: any, endDate: any): number {
  const startTime = safeGetTime(startDate);
  const endTime = safeGetTime(endDate);
  
  if (startTime === 0 || endTime === 0 || endTime <= startTime) {
    return 0;
  }
  
  return (endTime - startTime) / (1000 * 60 * 60);
}

/**
 * Safely creates a date with time from separate date and time values
 * @param date - Date value (Date object or string)
 * @param time - Time value (Date object or time string)
 * @returns Combined Date object or null if invalid
 */
export function safeCreateDateTime(date: any, time: any): Date | null {
  const validDate = safeToDate(date);
  if (!validDate) return null;
  
  try {
    const result = new Date(validDate);
    
    if (time instanceof Date && !isNaN(time.getTime())) {
      result.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
    } else if (typeof time === 'string' && /^(\d{1,2}):(\d{1,2})(:(\d{1,2}))?$/.test(time)) {
      const [hours, minutes, seconds = '0'] = time.split(':');
      result.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);
    } else {
      // Try to extract time from time parameter
      const timeDate = safeToDate(time);
      if (timeDate) {
        result.setHours(timeDate.getHours(), timeDate.getMinutes(), timeDate.getSeconds(), 0);
      } else {
        return null;
      }
    }
    
    return isNaN(result.getTime()) ? null : result;
  } catch (error) {
    return null;
  }
}

/**
 * Validates if a date string is in valid format
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Safely formats date for display with locale
 * @param date - Date value to format
 * @param locale - Locale for formatting (default: 'en-IN')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string or 'Invalid Date'
 */
export function safeFormatDate(
  date: any, 
  locale: string = 'en-IN',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string {
  const validDate = safeToDate(date);
  if (!validDate) return 'Invalid Date';
  
  try {
    return validDate.toLocaleDateString(locale, options);
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Checks if a date is expired based on expiry time in minutes
 * @param createdAt - Creation date
 * @param expiryMinutes - Expiry time in minutes
 * @returns true if expired, false otherwise
 */
export function isExpired(createdAt: any, expiryMinutes: number): boolean {
  const createdTime = safeGetTime(createdAt);
  if (createdTime === 0) return true;
  
  const expiryTime = createdTime + (expiryMinutes * 60 * 1000);
  return Date.now() > expiryTime;
}

/**
 * Creates a safe expiry date
 * @param createdAt - Creation date
 * @param expiryMinutes - Expiry time in minutes
 * @returns Expiry date or null if invalid input
 */
export function createExpiryDate(createdAt: any, expiryMinutes: number): Date | null {
  const createdTime = safeGetTime(createdAt);
  if (createdTime === 0) return null;
  
  return new Date(createdTime + (expiryMinutes * 60 * 1000));
}
