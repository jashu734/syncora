import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

/**
 * Centralized four-argument Express error handling middleware.
 * Ensures strict security: no stack traces, SQL strings, or credentials leak to clients.
 */
export const errorHandler = (err, req, res, next) => {
  // If headers have already been sent to client, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Handled Operational Errors (AppError instances)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {})
      }
    });
  }

  // 2. Prisma Database Specific Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: {
          code: 'ALREADY_BOOKED',
          message: 'You have already booked a seat for this workshop.'
        }
      });
    }

    // P2025: Record to update or delete not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'The requested record could not be found.'
        }
      });
    }
  }

  // 3. JSON body parsing syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload in request body.'
      }
    });
  }

  // 4. Unexpected / Internal Server Errors
  // Safely log the error internally without exposing it to the response
  console.error('[UNEXPECTED_SERVER_ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.'
    }
  });
};

export default errorHandler;
