import { bookingsService } from '../services/bookingsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const bookingsController = {
  /**
   * POST /api/workshops/:id/bookings
   */
  createBooking: asyncHandler(async (req, res) => {
    const workshopId = Number(req.params.id);
    const { studentName, studentEmail } = req.body;

    const booking = await bookingsService.createBooking(workshopId, studentName, studentEmail);

    return res.status(201).json({
      data: booking
    });
  }),

  /**
   * GET /api/workshops/:id/bookings
   */
  getBookingsByWorkshop: asyncHandler(async (req, res) => {
    const workshopId = Number(req.params.id);
    const bookings = await bookingsService.getBookingsByWorkshop(workshopId);

    return res.status(200).json({
      data: bookings
    });
  }),

  /**
   * DELETE /api/bookings/:id
   */
  cancelBooking: asyncHandler(async (req, res) => {
    const bookingId = Number(req.params.id);
    const result = await bookingsService.cancelBooking(bookingId);

    return res.status(200).json({
      data: result
    });
  }),

  /**
   * GET /api/bookings/my?email=...
   */
  getMyBookings: asyncHandler(async (req, res) => {
    const email = req.query.email;
    const bookings = await bookingsService.getBookingsByEmail(email);

    return res.status(200).json({
      data: bookings
    });
  })
};

export default bookingsController;
