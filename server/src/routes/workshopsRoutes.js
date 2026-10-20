import { Router } from 'express';
import { z } from 'zod';
import { workshopsController } from '../controllers/workshopsController.js';
import { bookingsController } from '../controllers/bookingsController.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// Validation Schemas
const workshopIdParams = z.object({
  id: z.coerce.number().int().positive('Workshop ID must be a positive integer.')
});

const createBookingBody = z.object({
  studentName: z
    .string()
    .trim()
    .min(2, 'Student name must be at least 2 characters.')
    .max(100, 'Student name cannot exceed 100 characters.'),
  studentEmail: z
    .string()
    .trim()
    .email('Please provide a valid email address.')
    .transform((e) => e.toLowerCase())
});

// Routes
router.get('/', workshopsController.getAllWorkshops);

router.get(
  '/:id',
  validateRequest({ params: workshopIdParams }),
  workshopsController.getWorkshopById
);

router.post(
  '/:id/bookings',
  validateRequest({
    params: workshopIdParams,
    body: createBookingBody
  }),
  bookingsController.createBooking
);

router.get(
  '/:id/bookings',
  validateRequest({ params: workshopIdParams }),
  bookingsController.getBookingsByWorkshop
);

export default router;
