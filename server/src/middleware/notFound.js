import { AppError } from '../utils/AppError.js';

/**
 * 404 Handler for unmatched routes.
 */
export const notFound = (req, res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`));
};

export default notFound;
