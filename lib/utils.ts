import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSportType(sportType: string): string {
  return sportType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAmount(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date value:', date);
      return typeof date === 'string' ? date : 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', date, error);
    return typeof date === 'string' ? date : 'N/A';
  }
}

export function formatTime(time: string | Date | null | undefined): string {
  if (!time) return 'N/A';
  
  try {
    let timeObj: Date;
    
    if (typeof time === 'string') {
      // Handle different time formats
      let timeString = time;
      
      // If it's already a full ISO string, extract the time part
      if (timeString.includes('T')) {
        timeString = timeString.split('T')[1]?.split('.')[0] || timeString;
      }
      
      // Remove any timezone info if present
      timeString = timeString.split('+')[0].split('Z')[0];
      
      // Ensure it's in HH:mm or HH:mm:ss format
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) {
        console.warn('Invalid time format:', time);
        return time; // Return as-is if format is unexpected
      }
      
      timeObj = new Date(`2000-01-01T${timeString}`);
    } else {
      timeObj = time;
    }
    
    // Check if the date is valid
    if (isNaN(timeObj.getTime())) {
      console.warn('Invalid time value:', time);
      return typeof time === 'string' ? time : 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(timeObj);
  } catch (error) {
    console.error('Error formatting time:', time, error);
    return typeof time === 'string' ? time : 'N/A';
  }
}

export function formatDateTime(dateTime: string | Date | null | undefined): string {
  if (!dateTime) return 'N/A';
  
  try {
    const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid dateTime value:', dateTime);
      return typeof dateTime === 'string' ? dateTime : 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting dateTime:', dateTime, error);
    return typeof dateTime === 'string' ? dateTime : 'N/A';
  }
}
