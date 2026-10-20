import apiClient from './apiClient.js';

export const workshopsService = {
  /**
   * Fetches the complete list of workshops.
   */
  async getWorkshops() {
    const res = await apiClient.get('/api/workshops');
    return res.data.data;
  },

  /**
   * Fetches detailed information for a single workshop by ID.
   */
  async getWorkshop(id) {
    const res = await apiClient.get(`/api/workshops/${id}`);
    return res.data.data;
  },

  /**
   * Fetches all registered bookings for a specific workshop.
   */
  async getWorkshopBookings(workshopId) {
    const res = await apiClient.get(`/api/workshops/${workshopId}/bookings`);
    return res.data.data;
  },

  /**
   * Submits a new workshop booking.
   */
  async createBooking(workshopId, { studentName, studentEmail }) {
    const res = await apiClient.post(`/api/workshops/${workshopId}/bookings`, {
      studentName,
      studentEmail
    });
    return res.data.data;
  },

  /**
   * Cancels a booking and restores the seat.
   */
  async cancelBooking(bookingId) {
    const res = await apiClient.delete(`/api/bookings/${bookingId}`);
    return res.data.data;
  },

  /**
   * Retrieves bookings for a student by email address.
   */
  async getMyBookings(email) {
    const res = await apiClient.get('/api/bookings/my', {
      params: { email }
    });
    return res.data.data;
  }
};

export default workshopsService;
