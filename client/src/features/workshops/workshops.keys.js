/**
 * Consistent TanStack Query key factory for caching and selective invalidation.
 */
export const workshopKeys = {
  all: ['workshops'],
  lists: () => [...workshopKeys.all, 'list'],
  details: () => [...workshopKeys.all, 'detail'],
  detail: (id) => [...workshopKeys.details(), Number(id)],
  bookings: (id) => [...workshopKeys.detail(id), 'bookings'],
  myBookings: (email) => ['bookings', 'my', email ? email.toLowerCase().trim() : '']
};

export default workshopKeys;
