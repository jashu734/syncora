import { prisma } from '../prisma.js';
import { AppError } from '../utils/AppError.js';

/**
 * Service handling concurrency-safe workshop bookings and cancellations.
 */
export const bookingsService = {
  /**
   * Concurrency-Safe Booking Operation.
   *
   * Architectural & Concurrency Strategy:
   * 1. Uses a database transaction (`prisma.$transaction`) to enforce ACID guarantees.
   * 2. Executes an atomic conditional update (`updateMany` with `WHERE id = workshopId AND seatsLeft > 0`).
   *    In PostgreSQL, this acquires an exclusive row lock on the Workshop record and updates the seat
   *    count in a single database step.
   * 3. If affected row count === 0:
   *    - The transaction aborts early.
   *    - It checks whether the workshop was nonexistent (404 WORKSHOP_NOT_FOUND) or sold out (409 SOLD_OUT).
   * 4. If affected row count === 1:
   *    - The seat decrement succeeded under concurrency.
   *    - The booking record is created inside the same transaction.
   *    - If the student previously booked this workshop, PostgreSQL raises a unique constraint
   *      violation on `(workshopId, studentEmail)`. The transaction automatically rolls back,
   *      restoring the decremented seat count so no seat is permanently consumed.
   * 5. Returns the committed booking record.
   *
   * @param {number} workshopId - Validated workshop ID
   * @param {string} studentName - Student's full name (trimmed)
   * @param {string} studentEmail - Normalized student email address (trimmed, lowercase)
   * @returns {Promise<Object>} Created booking record
   */
  async createBooking(workshopId, studentName, studentEmail) {
    const normalizedEmail = studentEmail.trim().toLowerCase();
    const cleanName = studentName.trim();

    return await prisma.$transaction(async (tx) => {
      // Step 1: Atomic conditional seat decrement
      // Only decrements if the workshop exists AND seatsLeft is strictly greater than 0
      const updateResult = await tx.workshop.updateMany({
        where: {
          id: workshopId,
          seatsLeft: { gt: 0 }
        },
        data: {
          seatsLeft: { decrement: 1 }
        }
      });

      // Step 2: If no row was updated, either the workshop doesn't exist or is sold out
      if (updateResult.count === 0) {
        const workshop = await tx.workshop.findUnique({
          where: { id: workshopId },
          select: { id: true, seatsLeft: true }
        });

        if (!workshop) {
          throw new AppError(404, 'WORKSHOP_NOT_FOUND', 'Workshop not found.');
        }

        throw new AppError(409, 'SOLD_OUT', 'No seats are available for this workshop.');
      }

      // Step 3: Insert the booking record within the exact same transaction
      // Any unique constraint failure (duplicate student booking) will automatically trigger
      // a transaction rollback, reverting the seat decrement.
      const booking = await tx.booking.create({
        data: {
          workshopId,
          studentName: cleanName,
          studentEmail: normalizedEmail
        },
        include: {
          workshop: {
            select: {
              id: true,
              title: true,
              location: true,
              startsAt: true
            }
          }
        }
      });

      return booking;
    });
  },

  /**
   * Retrieves all bookings for a given workshop.
   *
   * @param {number} workshopId - Workshop ID
   * @returns {Promise<Array>} List of bookings
   */
  async getBookingsByWorkshop(workshopId) {
    // Verify workshop exists
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: { id: true }
    });

    if (!workshop) {
      throw new AppError(404, 'WORKSHOP_NOT_FOUND', 'Workshop not found.');
    }

    const bookings = await prisma.booking.findMany({
      where: { workshopId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        workshopId: true,
        studentName: true,
        studentEmail: true,
        createdAt: true
      }
    });

    return bookings;
  },

  /**
   * Retrieves all bookings associated with a specific student email address.
   *
   * @param {string} email - Normalized student email
   * @returns {Promise<Array>} List of user bookings
   */
  async getBookingsByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();

    const bookings = await prisma.booking.findMany({
      where: { studentEmail: normalizedEmail },
      orderBy: { createdAt: 'desc' },
      include: {
        workshop: {
          select: {
            id: true,
            title: true,
            instructor: true,
            location: true,
            startsAt: true,
            capacity: true,
            seatsLeft: true
          }
        }
      }
    });

    return bookings;
  },

  /**
   * Concurrency-Safe Booking Cancellation Operation.
   *
   * Architectural Strategy:
   * 1. Executes inside a transaction (`prisma.$transaction`).
   * 2. Finds and deletes the booking record first. If the record does not exist or was
   *    already cancelled concurrently, it throws 404 BOOKING_NOT_FOUND and prevents
   *    restoring seats multiple times (double-cancellation defense).
   * 3. Atomically increments `seatsLeft` by exactly 1 on the corresponding Workshop.
   * 4. Ensures atomic consistency: a seat is restored if and only if a booking was deleted.
   *
   * @param {number} bookingId - Booking ID to cancel
   * @returns {Promise<Object>} Cancellation result summary
   */
  async cancelBooking(bookingId) {
    return await prisma.$transaction(async (tx) => {
      // Step 1: Find booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found or already cancelled.');
      }

      // Step 2: Delete booking
      await tx.booking.delete({
        where: { id: bookingId }
      });

      // Step 3: Increment seat count atomically
      await tx.workshop.update({
        where: { id: booking.workshopId },
        data: {
          seatsLeft: { increment: 1 }
        }
      });

      return {
        message: 'Booking successfully cancelled and seat restored.',
        cancelledBookingId: bookingId,
        workshopId: booking.workshopId
      };
    });
  }
};

export default bookingsService;
