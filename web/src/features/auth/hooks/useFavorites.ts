import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { toggleFavoriteThunk, toggleFoodFavoriteThunk } from '../authSlice';
import { showToast } from '../../ui/uiSlice';

export type FavoriteTarget = 
  | { kind: 'restaurant'; id: string }
  | { kind: 'foodItem'; id: string };

export function useFavorites() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const isFavorite = useCallback(
    (target: FavoriteTarget): boolean => {
      if (!user) return false;

      switch (target.kind) {
        case 'restaurant':
          return user.favoriteRestaurants?.includes(target.id) ?? false;
        case 'foodItem':
          return user.favoriteFoodItems?.includes(target.id) ?? false;
        default:
          return false;
      }
    },
    [user]
  );

  const toggleFavorite = useCallback(
    async (target: FavoriteTarget): Promise<void> => {
      if (!user) {
        dispatch(showToast({ message: 'Please log in to manage favorites', type: 'info' }));
        return;
      }

      const currentlyFavorited = isFavorite(target);

      try {
        switch (target.kind) {
          case 'restaurant':
            await dispatch(toggleFavoriteThunk(target.id)).unwrap();
            break;
          case 'foodItem':
            await dispatch(toggleFoodFavoriteThunk(target.id)).unwrap();
            break;
        }

        dispatch(
          showToast({
            message: currentlyFavorited ? 'Removed from favorites' : 'Added to favorites',
            type: 'success',
          })
        );
      } catch (error: any) {
        dispatch(
          showToast({
            message: error?.message || error || 'Failed to update favorites',
            type: 'error',
          })
        );
      }
    },
    [dispatch, isFavorite, user]
  );

  return { isFavorite, toggleFavorite };
}
