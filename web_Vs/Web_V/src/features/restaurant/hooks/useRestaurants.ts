// import { useAppQuery, useAppMutation, queryKeys } from '../../../../core/hooks/useQuery';
// import { RestaurantAPI } from '../../../../core/api/api.service';
// import { Restaurant, RestaurantFilters, PaginatedResponse } from '../types/restaurant.types';

// export function useRestaurants(filters?: RestaurantFilters) {
//   return useAppQuery<PaginatedResponse<Restaurant>>(
//     queryKeys.restaurants.all(filters),
//     () => RestaurantAPI.getAll(filters),
//     {
//       staleTime: 5 * 60 * 1000, // 5 minutes
//       cacheTime: 10 * 60 * 1000, // 10 minutes
//       keepPreviousData: true, // Keep previous data while fetching new data
//     }
//   );
// }

// export function useRestaurant(id: string) {
//   return useAppQuery<Restaurant>(
//     queryKeys.restaurants.detail(id),
//     () => RestaurantAPI.getById(id),
//     {
//       enabled: !!id, // Only run if id exists
//       staleTime: 2 * 60 * 1000, // 2 minutes
//     }
//   );
// }

// export function useUpdateRestaurant() {
//   return useAppMutation(
//     ({ id, data }: { id: string; data: Partial<Restaurant> }) =>
//       RestaurantAPI.update(id, data),
//     {
//       invalidateQueries: [queryKeys.restaurants.all(), queryKeys.restaurants.detail],
//       showSuccessToast: true,
//       successMessage: 'Restaurant updated successfully',
//     }
//   );
// }