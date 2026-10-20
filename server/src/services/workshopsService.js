import { prisma } from '../prisma.js';
import { AppError } from '../utils/AppError.js';

/**
 * Service handling workshop data retrieval.
 */
export const workshopsService = {
  /**
   * Retrieves all workshops with real-time seat availability and booking counts.
   * @returns {Promise<Array>} List of workshops
   */
  async getAllWorkshops() {
    const workshops = await prisma.workshop.findMany({
      orderBy: { startsAt: 'asc' },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    return workshops;
  },

  /**
   * Retrieves a single workshop by ID with current availability.
   * @param {number} id - Workshop ID
   * @returns {Promise<Object>} Workshop details
   */
  async getWorkshopById(id) {
    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!workshop) {
      throw new AppError(404, 'WORKSHOP_NOT_FOUND', 'Workshop not found.');
    }

    return workshop;
  }
};

export default workshopsService;
