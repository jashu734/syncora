/**
 * Custom operational error class for standardizing HTTP error responses
 * and distinguishing expected domain rejections from unhandled server exceptions.
 */
export class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 404, 409)
   * @param {string} code - Machine-readable error code (e.g. 'SOLD_OUT', 'VALIDATION_ERROR')
   * @param {string} message - Human-readable error message
   * @param {any} [details] - Optional validation details
   */
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
