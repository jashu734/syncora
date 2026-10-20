import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workshopKeys } from './workshops.keys.js';
import workshopsService from '../../services/workshops.service.js';

/**
 * Mutation hook for booking a workshop seat.
 * Invalidates workshop lists and details upon successful booking to guarantee
 * updated seat counts and attendee lists across the application.
 */
export function useCreateBookingMutation(workshopId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentName, studentEmail }) =>
      workshopsService.createBooking(workshopId, { studentName, studentEmail }),
    onSuccess: (data) => {
      // Invalidate workshop list and the specific workshop's details & bookings
      queryClient.invalidateQueries({ queryKey: workshopKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workshopKeys.detail(workshopId) });
      queryClient.invalidateQueries({ queryKey: workshopKeys.bookings(workshopId) });
      if (data?.studentEmail) {
        queryClient.invalidateQueries({
          queryKey: workshopKeys.myBookings(data.studentEmail)
        });
      }
    }
  });
}

/**
 * Mutation hook for cancelling a workshop booking.
 * Restores seat count and updates attendee rosters in cache.
 */
export function useCancelBookingMutation(workshopId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId) => workshopsService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workshopKeys.lists() });
      if (workshopId) {
        queryClient.invalidateQueries({ queryKey: workshopKeys.detail(workshopId) });
        queryClient.invalidateQueries({ queryKey: workshopKeys.bookings(workshopId) });
      } else {
        queryClient.invalidateQueries({ queryKey: workshopKeys.all });
      }
      queryClient.invalidateQueries({ queryKey: ['bookings', 'my'] });
    }
  });
}
