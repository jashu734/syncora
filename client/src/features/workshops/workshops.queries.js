import { useQuery } from '@tanstack/react-query';
import { workshopKeys } from './workshops.keys.js';
import workshopsService from '../../services/workshops.service.js';

/**
 * Hook to fetch the full list of workshops.
 */
export function useWorkshopsQuery() {
  return useQuery({
    queryKey: workshopKeys.lists(),
    queryFn: () => workshopsService.getWorkshops(),
    staleTime: 5000,
    refetchOnWindowFocus: true
  });
}

/**
 * Hook to fetch single workshop details by ID.
 */
export function useWorkshopQuery(id) {
  return useQuery({
    queryKey: workshopKeys.detail(id),
    queryFn: () => workshopsService.getWorkshop(id),
    enabled: Boolean(id && !isNaN(Number(id))),
    staleTime: 5000
  });
}

/**
 * Hook to fetch the list of bookings for a workshop.
 */
export function useWorkshopBookingsQuery(workshopId) {
  return useQuery({
    queryKey: workshopKeys.bookings(workshopId),
    queryFn: () => workshopsService.getWorkshopBookings(workshopId),
    enabled: Boolean(workshopId && !isNaN(Number(workshopId))),
    staleTime: 5000
  });
}

/**
 * Hook to fetch bookings by student email.
 */
export function useMyBookingsQuery(email) {
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  return useQuery({
    queryKey: workshopKeys.myBookings(cleanEmail),
    queryFn: () => workshopsService.getMyBookings(cleanEmail),
    enabled: Boolean(cleanEmail && cleanEmail.includes('@')),
    staleTime: 5000
  });
}
