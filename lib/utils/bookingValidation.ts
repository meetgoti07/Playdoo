/**
 * Validation utilities for booking-related operations
 * Ensures all date/time fields are properly validated before database operations
 */

import { safeToDate, isValidDateString } from "./dateHelpers";

export interface TimeSlotValidation {
  isValid: boolean;
  errors: string[];
  sanitizedData?: {
    date: Date;
    startTime: Date;
    endTime: Date;
  };
}

export interface BookingValidation {
  isValid: boolean;
  errors: string[];
  sanitizedData?: {
    bookingDate: Date;
    startTime: Date;
    endTime: Date;
  };
}

/**
 * Validates time slot data before booking operations
 * @param timeSlot - Time slot data from database
 * @returns Validation result with sanitized data
 */
export function validateTimeSlot(timeSlot: any): TimeSlotValidation {
  const errors: string[] = [];
  
  if (!timeSlot) {
    errors.push("Time slot data is required");
    return { isValid: false, errors };
  }

  // Validate date
  const date = safeToDate(timeSlot.date);
  if (!date) {
    errors.push("Invalid date in time slot");
  }

  // Validate start time
  const startTime = safeToDate(timeSlot.startTime);
  if (!startTime) {
    errors.push("Invalid start time in time slot");
  }

  // Validate end time
  const endTime = safeToDate(timeSlot.endTime);
  if (!endTime) {
    errors.push("Invalid end time in time slot");
  }

  // Validate time logic
  if (date && startTime && endTime) {
    // Create full datetime objects for comparison
    const startDateTime = new Date(date);
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    
    const endDateTime = new Date(date);
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    
    if (endDateTime <= startDateTime) {
      errors.push("End time must be after start time");
    }
    
    // Check if booking is in the past
    if (startDateTime < new Date()) {
      errors.push("Cannot book time slots in the past");
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitizedData: {
      date: date!,
      startTime: startTime!,
      endTime: endTime!,
    },
  };
}

/**
 * Validates booking data
 * @param booking - Booking data from database
 * @returns Validation result with sanitized data
 */
export function validateBooking(booking: any): BookingValidation {
  const errors: string[] = [];
  
  if (!booking) {
    errors.push("Booking data is required");
    return { isValid: false, errors };
  }

  // Validate booking date
  const bookingDate = safeToDate(booking.bookingDate);
  if (!bookingDate) {
    errors.push("Invalid booking date");
  }

  // Validate start time
  const startTime = safeToDate(booking.startTime);
  if (!startTime) {
    errors.push("Invalid start time");
  }

  // Validate end time
  const endTime = safeToDate(booking.endTime);
  if (!endTime) {
    errors.push("Invalid end time");
  }

  // Validate created date
  const createdAt = safeToDate(booking.createdAt);
  if (!createdAt) {
    errors.push("Invalid creation date");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitizedData: {
      bookingDate: bookingDate!,
      startTime: startTime!,
      endTime: endTime!,
    },
  };
}

/**
 * Validates date filter parameters for booking queries
 * @param startDate - Start date filter
 * @param endDate - End date filter
 * @returns Validation result with sanitized dates
 */
export function validateDateFilters(startDate?: string, endDate?: string): {
  isValid: boolean;
  errors: string[];
  sanitizedDates?: {
    startDate?: Date;
    endDate?: Date;
  };
} {
  const errors: string[] = [];
  let sanitizedStartDate: Date | undefined;
  let sanitizedEndDate: Date | undefined;

  if (startDate) {
    if (!isValidDateString(startDate)) {
      errors.push("Invalid startDate format");
    } else {
      const date = safeToDate(startDate);
      if (!date) {
        errors.push("Invalid startDate value");
      } else {
        sanitizedStartDate = date;
      }
    }
  }

  if (endDate) {
    if (!isValidDateString(endDate)) {
      errors.push("Invalid endDate format");
    } else {
      const date = safeToDate(endDate);
      if (!date) {
        errors.push("Invalid endDate value");
      } else {
        sanitizedEndDate = date;
      }
    }
  }

  // Validate date range logic
  if (sanitizedStartDate && sanitizedEndDate) {
    if (sanitizedEndDate < sanitizedStartDate) {
      errors.push("End date must be after start date");
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitizedDates: {
      startDate: sanitizedStartDate,
      endDate: sanitizedEndDate,
    },
  };
}

/**
 * Validates and sanitizes user input for booking creation
 * @param requestBody - Request body from booking creation
 * @returns Validation result
 */
export function validateBookingCreationInput(requestBody: any): {
  isValid: boolean;
  errors: string[];
  sanitizedInput?: any;
} {
  const errors: string[] = [];
  
  if (!requestBody) {
    errors.push("Request body is required");
    return { isValid: false, errors };
  }

  const { facilityId, courtId, timeSlotId, userDetails } = requestBody;

  // Required field validation
  if (!facilityId) errors.push("Facility ID is required");
  if (!courtId) errors.push("Court ID is required");
  if (!timeSlotId) errors.push("Time slot ID is required");
  
  // User details validation
  if (!userDetails) {
    errors.push("User details are required");
  } else {
    if (!userDetails.fullName) errors.push("Full name is required");
    if (!userDetails.email) errors.push("Email is required");
    if (!userDetails.phone) errors.push("Phone number is required");
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userDetails.email && !emailRegex.test(userDetails.email)) {
      errors.push("Invalid email format");
    }
    
    // Phone format validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (userDetails.phone && !phoneRegex.test(userDetails.phone.replace(/\s+/g, ''))) {
      errors.push("Invalid phone number format");
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitizedInput: {
      ...requestBody,
      userDetails: {
        ...userDetails,
        phone: userDetails.phone.replace(/\s+/g, ''), // Remove spaces from phone
      },
    },
  };
}

/**
 * Creates a standardized error response for validation failures
 * @param errors - Array of validation error messages
 * @param statusCode - HTTP status code (default: 400)
 * @returns Response object
 */
export function createValidationErrorResponse(errors: string[], statusCode: number = 400): Response {
  return Response.json(
    {
      error: "Validation failed",
      details: errors,
    },
    { status: statusCode }
  );
}
