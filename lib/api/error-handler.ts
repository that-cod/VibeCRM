/**
 * @fileoverview Standardized error handling for API routes
 * 
 * Reasoning:
 * - Consistent error response format across all endpoints
 * - Better error messages for debugging and user feedback
 * - Security: Don't expose sensitive information in production
 */

import { NextResponse } from "next/server";

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
  code?: string;
}

/**
 * Standard error codes for common scenarios
 */
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  AI_ERROR: "AI_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMIT: "RATE_LIMIT",
  CONFLICT: "CONFLICT",
} as const;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  options?: {
    message?: string;
    details?: unknown;
    code?: string;
  }
): NextResponse<ApiError> {
  const isDev = process.env.NODE_ENV === "development";
  
  const response: ApiError = {
    error,
    code: options?.code,
  };

  // Include detailed message in development or if explicitly provided
  if (options?.message) {
    response.message = options.message;
  }

  // Only include details in development mode
  if (isDev && options?.details) {
    response.details = options.details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Handle authentication errors
 */
export function unauthorizedError(message = "Authentication required"): NextResponse<ApiError> {
  return createErrorResponse(
    "Unauthorized",
    401,
    { message, code: ErrorCodes.UNAUTHORIZED }
  );
}

/**
 * Handle forbidden errors (authenticated but not allowed)
 */
export function forbiddenError(message = "You don't have permission to access this resource"): NextResponse<ApiError> {
  return createErrorResponse(
    "Forbidden",
    403,
    { message, code: ErrorCodes.FORBIDDEN }
  );
}

/**
 * Handle not found errors
 */
export function notFoundError(resource = "Resource"): NextResponse<ApiError> {
  return createErrorResponse(
    "Not Found",
    404,
    { message: `${resource} not found`, code: ErrorCodes.NOT_FOUND }
  );
}

/**
 * Handle validation errors
 */
export function validationError(message: string, details?: unknown): NextResponse<ApiError> {
  return createErrorResponse(
    "Validation Error",
    400,
    { message, details, code: ErrorCodes.VALIDATION_ERROR }
  );
}

/**
 * Handle database errors
 */
export function databaseError(message = "Database operation failed", details?: unknown): NextResponse<ApiError> {
  return createErrorResponse(
    "Database Error",
    500,
    { message, details, code: ErrorCodes.DATABASE_ERROR }
  );
}

/**
 * Handle AI/LLM errors
 */
export function aiError(message = "AI service error", details?: unknown): NextResponse<ApiError> {
  return createErrorResponse(
    "AI Error",
    500,
    { message, details, code: ErrorCodes.AI_ERROR }
  );
}

/**
 * Handle conflict errors (e.g., duplicate resources)
 */
export function conflictError(message: string): NextResponse<ApiError> {
  return createErrorResponse(
    "Conflict",
    409,
    { message, code: ErrorCodes.CONFLICT }
  );
}

/**
 * Handle rate limit errors
 */
export function rateLimitError(message = "Rate limit exceeded"): NextResponse<ApiError> {
  return createErrorResponse(
    "Rate Limit Exceeded",
    429,
    { message, code: ErrorCodes.RATE_LIMIT }
  );
}

/**
 * Handle generic internal errors
 */
export function internalError(message = "Internal server error", details?: unknown): NextResponse<ApiError> {
  return createErrorResponse(
    "Internal Server Error",
    500,
    { message, details, code: ErrorCodes.INTERNAL_ERROR }
  );
}

/**
 * Wrap async API route handlers with error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiError>> {
  return handler().catch((error: Error) => {
    console.error("API Error:", error);
    return internalError(
      "An unexpected error occurred",
      process.env.NODE_ENV === "development" ? error.message : undefined
    );
  });
}
