import { AppError } from '../utils/AppError.js';

/**
 * Middleware factory for validating Express request parts (body, params, query) using Zod.
 *
 * @param {Object} schemas - Schema mapping object { body?, params?, query? }
 * @returns {Function} Express middleware function
 */
export const validateRequest = (schemas) => {
  return async (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (err) {
      if (err.errors) {
        const issues = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return next(
          new AppError(
            400,
            'VALIDATION_ERROR',
            issues.length > 0 ? issues[0].message : 'Invalid request payload',
            issues
          )
        );
      }
      next(err);
    }
  };
};

export default validateRequest;
