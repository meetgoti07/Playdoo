/**
 * Enhanced error handling for booking operations
 * Provides detailed error reporting and logging for debugging
 */

export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  value?: any;
}

export interface BookingError {
  requestId: string;
  timestamp: string;
  operation: string;
  userId?: string;
  bookingId?: string;
  errors: ErrorDetails[];
  metadata?: Record<string, any>;
}

/**
 * Creates a standardized error response with detailed logging
 */
export function createBookingErrorResponse(
  operation: string,
  errors: ErrorDetails[],
  statusCode: number = 400,
  metadata?: Record<string, any>
): Response {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  const bookingError: BookingError = {
    requestId,
    timestamp,
    operation,
    errors,
    metadata,
  };

  // Log the error for debugging
  globalThis?.logger?.error({
    meta: {
      requestId,
      operation,
      statusCode,
      ...metadata,
    },
    err: { errors },
    message: `Booking operation failed: ${operation}`,
  });

  return Response.json(
    {
      error: "Booking operation failed",
      details: errors.map(e => e.message),
      code: errors[0]?.code || "UNKNOWN_ERROR",
      requestId,
    },
    { status: statusCode }
  );
}

/**
 * Error codes for different types of booking failures
 */
export const BookingErrorCodes = {
  // Date/Time related errors
  INVALID_DATE: 'INVALID_DATE',
  INVALID_TIME: 'INVALID_TIME',
  INVALID_DATETIME_COMBINATION: 'INVALID_DATETIME_COMBINATION',
  BOOKING_IN_PAST: 'BOOKING_IN_PAST',
  INVALID_TIME_RANGE: 'INVALID_TIME_RANGE',
  
  // Booking state errors
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  BOOKING_EXPIRED: 'BOOKING_EXPIRED',
  BOOKING_NOT_AVAILABLE: 'BOOKING_NOT_AVAILABLE',
  INVALID_BOOKING_STATUS: 'INVALID_BOOKING_STATUS',
  
  // Time slot errors
  TIMESLOT_NOT_FOUND: 'TIMESLOT_NOT_FOUND',
  TIMESLOT_NOT_AVAILABLE: 'TIMESLOT_NOT_AVAILABLE',
  TIMESLOT_BLOCKED: 'TIMESLOT_BLOCKED',
  TIMESLOT_BOOKED: 'TIMESLOT_BOOKED',
  
  // Payment errors
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_ALREADY_COMPLETED: 'PAYMENT_ALREADY_COMPLETED',
  INVALID_PAYMENT_STATUS: 'INVALID_PAYMENT_STATUS',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Creates specific error details for common booking scenarios
 */
export const BookingErrors = {
  invalidDate: (field: string, value: any): ErrorDetails => ({
    code: BookingErrorCodes.INVALID_DATE,
    message: `Invalid date value for ${field}. Please provide a valid date.`,
    field,
    value,
  }),

  invalidTime: (field: string, value: any): ErrorDetails => ({
    code: BookingErrorCodes.INVALID_TIME,
    message: `Invalid time value for ${field}. Please provide a valid time.`,
    field,
    value,
  }),

  bookingInPast: (): ErrorDetails => ({
    code: BookingErrorCodes.BOOKING_IN_PAST,
    message: "Cannot create or modify bookings for past dates.",
  }),

  invalidTimeRange: (): ErrorDetails => ({
    code: BookingErrorCodes.INVALID_TIME_RANGE,
    message: "End time must be after start time.",
  }),

  bookingNotFound: (bookingId: string): ErrorDetails => ({
    code: BookingErrorCodes.BOOKING_NOT_FOUND,
    message: "Booking not found or you don't have permission to access it.",
    field: "bookingId",
    value: bookingId,
  }),

  bookingExpired: (): ErrorDetails => ({
    code: BookingErrorCodes.BOOKING_EXPIRED,
    message: "Booking has expired. Please create a new booking.",
  }),

  timeSlotNotAvailable: (): ErrorDetails => ({
    code: BookingErrorCodes.TIMESLOT_NOT_AVAILABLE,
    message: "Selected time slot is no longer available.",
  }),

  paymentAlreadyCompleted: (): ErrorDetails => ({
    code: BookingErrorCodes.PAYMENT_ALREADY_COMPLETED,
    message: "Payment has already been completed for this booking.",
  }),

  cannotCancelBooking: (reason: string): ErrorDetails => ({
    code: BookingErrorCodes.INVALID_BOOKING_STATUS,
    message: `Cannot cancel booking: ${reason}`,
  }),

  invalidInput: (field: string, reason: string): ErrorDetails => ({
    code: BookingErrorCodes.INVALID_INPUT,
    message: `Invalid ${field}: ${reason}`,
    field,
  }),

  missingField: (field: string): ErrorDetails => ({
    code: BookingErrorCodes.MISSING_REQUIRED_FIELD,
    message: `${field} is required.`,
    field,
  }),

  systemError: (operation: string): ErrorDetails => ({
    code: BookingErrorCodes.DATABASE_ERROR,
    message: `System error during ${operation}. Please try again or contact support.`,
  }),
};

/**
 * Wraps async booking operations with error handling
 */
export async function withBookingErrorHandling<T>(
  operation: string,
  asyncFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  try {
    return await asyncFn();
  } catch (error) {
    const requestId = crypto.randomUUID();
    
    globalThis?.logger?.error({
      meta: {
        requestId,
        operation,
        ...metadata,
      },
      err: error,
      message: `Unexpected error in booking operation: ${operation}`,
    });

    throw createBookingErrorResponse(
      operation,
      [BookingErrors.systemError(operation)],
      500,
      { requestId, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Validates and throws appropriate errors for booking operations
 */
export function validateOrThrow(
  condition: boolean,
  errorDetail: ErrorDetails,
  operation: string,
  metadata?: Record<string, any>
): void {
  if (!condition) {
    throw createBookingErrorResponse(operation, [errorDetail], 400, metadata);
  }
}

/**
 * Validates multiple conditions and collects all errors
 */
export function validateMultipleOrThrow(
  validations: Array<{ condition: boolean; error: ErrorDetails }>,
  operation: string,
  metadata?: Record<string, any>
): void {
  const errors = validations
    .filter(v => !v.condition)
    .map(v => v.error);
    
  if (errors.length > 0) {
    throw createBookingErrorResponse(operation, errors, 400, metadata);
  }
}
