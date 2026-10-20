import { Router } from 'express';
import { z } from 'zod';
import { bookingsController } from '../controllers/bookingsController.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// Validation Schemas
const bookingIdParams = z.object({
  id: z.coerce.number().int().positive('Booking ID must be a positive integer.')
});

const myBookingsQuery = z.object({
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address.')
    .transform((e) => e.toLowerCase())
});

// Routes
router.get(
  '/my',
  validateRequest({ query: myBookingsQuery }),
  bookingsController.getMyBookings
);

router.delete(
  '/:id',
  validateRequest({ params: bookingIdParams }),
  bookingsController.cancelBooking
);

export default router;
