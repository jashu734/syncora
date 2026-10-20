/**
 * Wraps asynchronous route handlers to ensure any rejected promises are forwarded
 * to Express centralized error-handling middleware.
 *
 * @param {Function} fn - Async Express route handler function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
