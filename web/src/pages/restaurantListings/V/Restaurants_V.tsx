import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Pagination,
  useMediaQuery,
  useTheme,
  Alert,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
  fetchRestaurants,
  setSearchQuery,
  setSortBy,
  clearFilters,
  setCurrentPage,
  selectPaginatedRestaurants,
  selectTotalPages,
  selectActiveFiltersCount,
  selectRestaurantLoading,
  selectRestaurantError,
  selectFilteredRestaurants,
  toggleCuisine, // import actions if needed for removing filter chips
  setVegFilter,
  setOpenNowFilter,
  setDeliveryTime
} from '../../../features/restaurant/restaurantSlice';

import { RestaurantCard, RestaurantFilters } from '../../../features/restaurant/components';

import {
  ListToolbar,
  ActiveFiltersRow,
  FilterPanel,
  SkeletonGrid,
  EmptyState,
  PageHeader
} from '../../../features/ui/components';

import type { ActiveFilterChip } from '../../../features/ui/components';
import { Restaurant as RestaurantIcon } from '@mui/icons-material';

const Restaurants: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  // Local UI state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // Redux state
  const paginatedRestaurants = useAppSelector(selectPaginatedRestaurants);
  const totalPages = useAppSelector(selectTotalPages);
  const activeFiltersCount = useAppSelector(selectActiveFiltersCount);
  const loading = useAppSelector(selectRestaurantLoading);
  const error = useAppSelector(selectRestaurantError);
  const filters = useAppSelector((state) => state.restaurants.filters);
  const currentPage = useAppSelector((state) => state.restaurants.pagination.currentPage);
  const filteredCount = useAppSelector(selectFilteredRestaurants).length;

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      dispatch(setSearchQuery(value));
    }, 500);
    setDebounceTimer(timer);
  };

  const handleSortChange = (value: string) => {
    dispatch(setSortBy(value as any));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setLocalSearch('');
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    dispatch(setCurrentPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getGridColumns = () => {
    if (isMobile) return 12;      
    if (isTablet) return 6;        
    return 4;                      
  };

  // Convert active filters to simple chips you can omit
  const activeFilterChips: ActiveFilterChip[] = [];
  filters.cuisines.forEach(c => {
    activeFilterChips.push({ key: `cuisine-${c}`, label: c, onDelete: () => dispatch(toggleCuisine(c)) });
  });
  if (filters.isVeg) {
    activeFilterChips.push({ key: 'veg', label: 'Pure Veg', onDelete: () => dispatch(setVegFilter(false)) });
  }
  if (filters.isOpen) {
    activeFilterChips.push({ key: 'open', label: 'Open Now', onDelete: () => dispatch(setOpenNowFilter(false)) });
  }
  if (filters.deliveryTime !== 'all') {
    activeFilterChips.push({ key: 'time', label: `< ${filters.deliveryTime} mins`, onDelete: () => dispatch(setDeliveryTime('all')) });
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Restaurants Delivery in Mumbai"
        subtitle="Explore top-rated restaurants, cafes, and more"
      />

      <ListToolbar
        searchValue={localSearch}
        onSearchChange={handleSearchChange}
        sortValue={filters.sortBy}
        onSortChange={handleSortChange}
        sortOptions={[
          { value: 'rating', label: 'Rating: High to Low' },
          { value: 'deliveryTime', label: 'Delivery Time' },
          { value: 'price', label: 'Price: Low to High' },
          { value: 'price_desc', label: 'Price: High to Low' },
          { value: 'name', label: 'Name: A to Z' },
        ]}
        activeFilterCount={activeFiltersCount}
        onFilterOpen={() => setFilterDrawerOpen(true)}
        showMobileFilter={isMobile}
        searchPlaceholder="Search for restaurants, cuisines..."
      />

      <ActiveFiltersRow filters={activeFilterChips} />

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {!isMobile && (
          <Grid item xs={12} md={3}>
            <FilterPanel
              activeFilterCount={activeFiltersCount}
              onClearAll={handleClearFilters}
              variant="sidebar"
              sx={{ position: 'sticky', top: 20 }}
            >
              <RestaurantFilters />
            </FilterPanel>
          </Grid>
        )}

        {isMobile && (
          <FilterPanel
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            activeFilterCount={activeFiltersCount}
            onClearAll={handleClearFilters}
            variant="drawer"
          >
            <RestaurantFilters />
          </FilterPanel>
        )}

        <Grid item xs={12} md={9}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              {loading ? 'Finding restaurants...' : `${filteredCount} restaurants found`}
            </Typography>
          </Box>

          {loading ? (
             <SkeletonGrid 
               count={6} 
               columns={{ xs: 12, sm: 6, md: 4 }} 
             />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : paginatedRestaurants.length === 0 ? (
            <EmptyState
              icon={<RestaurantIcon />}
              title="No restaurants found"
              description="Try adjusting your filters or search query to find what you're looking for."
              action={{ label: 'Clear Filters', onClick: handleClearFilters }}
            />
          ) : (
            <>
              <Grid container spacing={3}>
                {paginatedRestaurants.map((restaurant) => (
                  <Grid item xs={getGridColumns()} key={restaurant.id}>
                    <RestaurantCard restaurant={restaurant} />
                  </Grid>
                ))}
              </Grid>

              {totalPages > 1 && (
                <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? "small" : "large"}
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Restaurants;