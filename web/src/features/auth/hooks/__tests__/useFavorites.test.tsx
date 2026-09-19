import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFavorites } from '../useFavorites';
import * as hooks from '../../../../app/store/hooks';
import * as authSlice from '../../authSlice';
import * as uiSlice from '../../../ui/uiSlice';

vi.mock('../../../../app/store/hooks', () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));

describe('useFavorites', () => {
  let mockDispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    mockDispatch = vi.fn().mockImplementation((thunk) => {
      // Mock unwrap for thunks
      return { unwrap: () => Promise.resolve() };
    });
    vi.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch);
  });

  const setupMockStore = (user: any) => {
    vi.spyOn(hooks, 'useAppSelector').mockImplementation((selector) => {
      return selector({ auth: { user } } as any);
    });
  };

  it('isFavorite returns true for existing restaurant favorites', () => {
    setupMockStore({ favoriteRestaurants: ['rest-123'] });
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavorite({ kind: 'restaurant', id: 'rest-123' })).toBe(true);
    expect(result.current.isFavorite({ kind: 'restaurant', id: 'rest-456' })).toBe(false);
  });

  it('isFavorite returns true for existing food favorites', () => {
    setupMockStore({ favoriteFoodItems: ['food-123'] });
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavorite({ kind: 'foodItem', id: 'food-123' })).toBe(true);
    expect(result.current.isFavorite({ kind: 'foodItem', id: 'food-456' })).toBe(false);
  });

  it('toggleFavorite dispatches correct thunk for restaurant', async () => {
    setupMockStore({ favoriteRestaurants: [] });
    const { result } = renderHook(() => useFavorites());
    
    await act(async () => {
      await result.current.toggleFavorite({ kind: 'restaurant', id: 'rest-123' });
    });

    expect(mockDispatch).toHaveBeenCalled();
  });

  it('toggleFavorite dispatches correct thunk for foodItem', async () => {
    setupMockStore({ favoriteFoodItems: [] });
    const { result } = renderHook(() => useFavorites());
    
    await act(async () => {
      await result.current.toggleFavorite({ kind: 'foodItem', id: 'food-123' });
    });

    expect(mockDispatch).toHaveBeenCalled();
  });

  it('fails safely when user is not authenticated', async () => {
    setupMockStore(null);
    const { result } = renderHook(() => useFavorites());
    
    await act(async () => {
      await result.current.toggleFavorite({ kind: 'foodItem', id: 'food-123' });
    });

    expect(result.current.isFavorite({ kind: 'foodItem', id: 'food-123' })).toBe(false);
  });
});
