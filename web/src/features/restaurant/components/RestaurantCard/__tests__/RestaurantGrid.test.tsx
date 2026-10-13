import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Grid } from '@mui/material';
import { RestaurantsCard } from '../RestaurantCard_V';
import type { Restaurant } from '../../../../../core/types';

vi.mock('@/features/auth/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  }),
}));

describe('Restaurant Grid Layout Contract', () => {
  const dummyRestaurant: Restaurant = {
    id: 'r_grid_1',
    name: 'Grid Alignment Test',
    description: 'Fresh and authentic dishes',
    cuisine: ['Italian', 'Pizza'],
    rating: 4.5,
    deliveryTime: '20-30 min',
    deliveryFee: 25,
    minOrder: 100,
    image: '',
    address: '100 Main Street',
    isOpen: true,
    isFeatured: true,
    tags: ['Popular'],
    location: { lat: 12.97, lng: 77.59 },
  };

  it('renders cards within Grid size container without legacy prop warnings', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <MemoryRouter>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex' }}>
            <RestaurantsCard restaurant={dummyRestaurant} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex' }}>
            <RestaurantsCard restaurant={{ ...dummyRestaurant, id: 'r_grid_2', name: 'Second Restaurant', rating: 0 }} />
          </Grid>
        </Grid>
      </MemoryRouter>
    );

    // Verify no MUI legacy prop warnings
    const legacyWarnings = warnSpy.mock.calls
      .concat(errorSpy.mock.calls)
      .map((c) => c.join(' '))
      .filter((msg) => msg.includes('prop has been removed') || msg.includes('item prop'));

    expect(legacyWarnings).toHaveLength(0);

    // Verify grid items exist and contain the card shells
    const gridItems = container.querySelectorAll('.MuiGrid-root');
    expect(gridItems.length).toBeGreaterThan(0);

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
