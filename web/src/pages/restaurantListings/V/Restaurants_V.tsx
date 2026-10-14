import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Drawer,
  IconButton,
  Rating,
  Divider,
  Stack,
  Pagination,
  useMediaQuery,
  useTheme,
  Badge,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Paper,
  type SelectChangeEvent,
} from '@mui/material';

import {
  Search,
  FilterList,
  Sort,
  ExpandMore,
  Close,
  Restaurant as RestaurantIcon,
  Refresh,
  Star,
  AccessTime,
  LocalOffer,
  CheckCircle,
} from '@mui/icons-material';

import { useAppDispatch, useAppSelector } from '@/app/store';

import {
  fetchRestaurants,
  setSearchQuery,
  toggleCuisine,
  setPriceRange,
  setMinRating,
  setDeliveryTime,
  setVegFilter,
  setOpenNowFilter,
  setFeaturedOnly,
  setSortBy,
  clearFilters,
  setCurrentPage,
  selectPaginatedRestaurants,
  selectFilteredRestaurants,
  selectAllRestaurants,
  selectTotalPages,
  selectActiveFiltersCount,
  selectRestaurantLoading,
  selectIsInitialLoading,
  selectRestaurantError,
  selectHasVegData,
} from '@/features/restaurant/restaurantSlice';

import RestaurantCard from '@/features/restaurant/components/RestaurantCard/RestaurantCard_V';
import { RestaurantCardSkeleton } from '@/features/restaurant/components/RestaurantCard';
import { useRestaurantUrlState } from '@/features/restaurant/hooks/useRestaurantUrlState';
import { CUISINES } from '@/core/constants/food';

const SIDEBAR_WIDTH = 290;

export const Restaurants: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ---------------------------------------------------------------------------
  // Local UI State
  // ---------------------------------------------------------------------------
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);

  // ---------------------------------------------------------------------------
  // Redux Selectors
  // ---------------------------------------------------------------------------
  const allRestaurants = useAppSelector(selectAllRestaurants);
  const filteredRestaurants = useAppSelector(selectFilteredRestaurants);
  const paginatedRestaurants = useAppSelector(selectPaginatedRestaurants);
  const totalPages = useAppSelector(selectTotalPages);
  const activeFiltersCount = useAppSelector(selectActiveFiltersCount);

  const initialLoading = useAppSelector(selectIsInitialLoading);
  const loading = useAppSelector(selectRestaurantLoading);
  const error = useAppSelector(selectRestaurantError);
  const hasVegData = useAppSelector(selectHasVegData);

  const filters = useAppSelector((state) => state.restaurants.filters);
  const currentPage = useAppSelector((state) => state.restaurants.pagination.currentPage);

  // ---------------------------------------------------------------------------
  // URL Synchronization Contract (S04)
  // ---------------------------------------------------------------------------
  useRestaurantUrlState(isSearchDebouncing);

  // Local search input state, initialized and synchronized with Redux filter
  const [localSearch, setLocalSearch] = useState(filters.searchQuery || '');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local search in sync when Redux search changes externally (e.g. URL popstate or clear)
  useEffect(() => {
    setLocalSearch(filters.searchQuery || '');
  }, [filters.searchQuery]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Initial data fetch (guarded by slice condition for 60s cache)
  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    setIsSearchDebouncing(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      dispatch(setSearchQuery(value));
      setIsSearchDebouncing(false);
    }, 400);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setIsSearchDebouncing(false);
    dispatch(setSearchQuery(''));
  };

  const handleCuisineToggle = useCallback((cuisine: string) => {
    dispatch(toggleCuisine(cuisine));
  }, [dispatch]);

  const handlePriceRangeChange = (_event: Event, newValue: number | number[]) => {
    dispatch(setPriceRange(newValue as [number, number]));
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    dispatch(setMinRating(val === filters.minRating ? null : val));
  };

  const handleDeliveryTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDeliveryTime(e.target.value));
  };

  const handleVegFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setVegFilter(e.target.checked));
  };

  const handleOpenNowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setOpenNowFilter(e.target.checked));
  };

  const handleFeaturedOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setFeaturedOnly(e.target.checked));
  };

  const handleSortChange = (e: SelectChangeEvent) => {
    dispatch(setSortBy(e.target.value as any));
  };

  const handleClearAllFilters = () => {
    handleClearSearch();
    dispatch(clearFilters());
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    dispatch(setCurrentPage(page));
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleRetry = () => {
    dispatch(fetchRestaurants({ force: true }));
  };

  // ---------------------------------------------------------------------------
  // Filter Content Component (Shared between Desktop Sidebar and Mobile Drawer)
  // ---------------------------------------------------------------------------
  const filterContent = useMemo(() => (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      <Stack spacing={2.5}>
        {/* Quick Highlights / Status */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'background.paper',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.primary' }}>
            Quick Filters
          </Typography>
          <FormGroup sx={{ gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.featuredOnly || false}
                  onChange={handleFeaturedOnlyChange}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="body2" fontWeight={500}>
                    Featured Only
                  </Typography>
                  <Chip label="Popular" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.6875rem' }} />
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.isOpen}
                  onChange={handleOpenNowChange}
                  size="small"
                  color="success"
                />
              }
              label={
                <Typography variant="body2" fontWeight={500}>
                  Open Now
                </Typography>
              }
            />

            {/* Pure Veg filter rendered only when truthful boolean isVeg data exists (D-13) */}
            {hasVegData && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.isVeg}
                    onChange={handleVegFilterChange}
                    size="small"
                    color="success"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={500}>
                    Pure Veg
                  </Typography>
                }
              />
            )}
          </FormGroup>
        </Paper>

        {/* Cuisine Type */}
        <Accordion
          defaultExpanded
          disableGutters
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px !important',
            '&:before': { display: 'none' },
            boxShadow: 'none',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RestaurantIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={700}>
                Cuisines
              </Typography>
              {filters.cuisines.length > 0 && (
                <Chip
                  label={filters.cuisines.length}
                  size="small"
                  color="primary"
                  sx={{ height: 20, fontSize: '0.75rem' }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
            <Grid container spacing={1}>
              {CUISINES.map((cuisine) => {
                const isSelected = filters.cuisines.includes(cuisine.name);
                return (
                  <Grid size={6} key={cuisine.id}>
                    <Chip
                      label={`${cuisine.icon} ${cuisine.name}`}
                      onClick={() => handleCuisineToggle(cuisine.name)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      icon={isSelected ? <CheckCircle fontSize="small" /> : undefined}
                      sx={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        cursor: 'pointer',
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                        },
                      }}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Delivery Time */}
        <Accordion
          defaultExpanded
          disableGutters
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px !important',
            '&:before': { display: 'none' },
            boxShadow: 'none',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={700}>
                Delivery Time
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
            <RadioGroup
              value={filters.deliveryTime || 'all'}
              onChange={handleDeliveryTimeChange}
            >
              <FormControlLabel
                value="all"
                control={<Radio size="small" />}
                label={<Typography variant="body2">Any duration</Typography>}
              />
              <FormControlLabel
                value="30"
                control={<Radio size="small" />}
                label={<Typography variant="body2">Within 30 mins</Typography>}
              />
              <FormControlLabel
                value="40"
                control={<Radio size="small" />}
                label={<Typography variant="body2">Within 40 mins</Typography>}
              />
              <FormControlLabel
                value="50"
                control={<Radio size="small" />}
                label={<Typography variant="body2">Within 50 mins</Typography>}
              />
              <FormControlLabel
                value="60"
                control={<Radio size="small" />}
                label={<Typography variant="body2">Within 60 mins</Typography>}
              />
            </RadioGroup>
          </AccordionDetails>
        </Accordion>

        {/* Rating */}
        <Accordion
          defaultExpanded
          disableGutters
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px !important',
            '&:before': { display: 'none' },
            boxShadow: 'none',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star fontSize="small" sx={{ color: 'warning.main' }} />
              <Typography variant="subtitle2" fontWeight={700}>
                Rating
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
            <RadioGroup
              value={filters.minRating ?? ''}
              onChange={handleRatingChange}
            >
              {[4, 3, 2, 1].map((rating) => (
                <FormControlLabel
                  key={rating}
                  value={rating}
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={rating} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary">
                        & up
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </AccordionDetails>
        </Accordion>

        {/* Minimum Order (Price Range) */}
        <Accordion
          defaultExpanded
          disableGutters
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px !important',
            '&:before': { display: 'none' },
            boxShadow: 'none',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalOffer fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={700}>
                Minimum Order
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
            <Box sx={{ px: 1, pt: 1 }}>
              <Slider
                value={[filters.minPrice ?? 0, filters.maxPrice ?? 1000]}
                onChange={handlePriceRangeChange}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={50}
                valueLabelFormat={(value) => `₹${value}`}
                color="primary"
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  ₹{filters.minPrice ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  ₹{filters.maxPrice ?? 1000}+
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  ), [
    filters,
    hasVegData,
    handleCuisineToggle,
  ]);

  // ---------------------------------------------------------------------------
  // Render: Error State
  // ---------------------------------------------------------------------------
  if (error && allRestaurants.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'error.light',
            bgcolor: 'error.lighter',
            textAlign: 'center',
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          <Alert severity="error" sx={{ mb: 3, justifyContent: 'center' }}>
            {typeof error === 'string' ? error : (error as any).message || 'Unable to load restaurants'}
          </Alert>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            We encountered a network problem while connecting to the kitchen catalogue.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
            onClick={handleRetry}
            sx={{ px: 3, py: 1, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Retry Loading
          </Button>
        </Paper>
      </Container>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Main Listing Page
  // ---------------------------------------------------------------------------
  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 2.5, sm: 3.5, md: 5 },
        px: { xs: 2, sm: 3, md: 4 },
        boxSizing: 'border-box',
      }}
    >
      {/* =================================================================== */}
      {/* 1. Page Discovery Header                                            */}
      {/* =================================================================== */}
      <Box
        sx={{
          mb: { xs: 2.5, sm: 3, md: 4 },
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1.5,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.25rem' },
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                  lineHeight: 1.2,
                }}
              >
                Explore Restaurants
              </Typography>
              {!initialLoading && (
                <Chip
                  label={`${filteredRestaurants.length} ${filteredRestaurants.length === 1 ? 'place' : 'places'}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600, height: 24 }}
                />
              )}
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                fontSize: { xs: '0.875rem', sm: '0.95rem' },
              }}
            >
              Discover top-rated dining, fast delivery, and authentic cuisines near you.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* =================================================================== */}
      {/* 2. Main Page Layout (Desktop Sidebar + Results Column)              */}
      {/* =================================================================== */}
      <Box
        sx={{
          display: 'flex',
          gap: { md: 3.5, lg: 4 },
          alignItems: 'flex-start',
        }}
      >
        {/* ================================================================= */}
        {/* Desktop Filter Sidebar                                            */}
        {/* ================================================================= */}
        {!isMobile && (
          <Box
            component="aside"
            aria-label="Restaurant filters"
            sx={{
              flex: `0 0 ${SIDEBAR_WIDTH}px`,
              width: SIDEBAR_WIDTH,
              minWidth: SIDEBAR_WIDTH,
              maxWidth: SIDEBAR_WIDTH,
              position: 'sticky',
              top: 84,
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto',
              overflowX: 'hidden',
              pr: 1,
              pb: 2,
              '&::-webkit-scrollbar': {
                width: 6,
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'divider',
                borderRadius: 3,
              },
            }}
          >
            {/* Sidebar header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterList color="primary" />
                <Typography variant="h6" fontWeight={700} fontSize="1.125rem">
                  Filters
                </Typography>
                {activeFiltersCount > 0 && (
                  <Chip
                    label={activeFiltersCount}
                    size="small"
                    color="primary"
                    sx={{ height: 22, fontWeight: 700 }}
                  />
                )}
              </Box>

              {activeFiltersCount > 0 && (
                <Button
                  onClick={handleClearAllFilters}
                  size="small"
                  color="secondary"
                  sx={{ textTransform: 'none', fontWeight: 600, minHeight: 32 }}
                >
                  Clear All
                </Button>
              )}
            </Box>

            {filterContent}
          </Box>
        )}

        {/* ================================================================= */}
        {/* Results Area                                                      */}
        {/* ================================================================= */}
        <Box
          component="main"
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* =============================================================== */}
          {/* Toolbar (Search, Filter Trigger on Mobile, Sort Selector)        */}
          {/* =============================================================== */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 2,
              mb: 2.5,
            }}
          >
            {/* Search Input */}
            <TextField
              placeholder="Search restaurants, cuisines, or tags..."
              value={localSearch}
              onChange={handleSearchChange}
              size="small"
              fullWidth
              sx={{
                flex: { xs: 1, sm: 1, md: 0.6, lg: 0.5 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                endAdornment: localSearch ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch} aria-label="Clear search">
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                justifyContent: { xs: 'space-between', sm: 'flex-end' },
              }}
            >
              {/* Mobile Filter Trigger */}
              {isMobile && (
                <Badge badgeContent={activeFiltersCount} color="primary">
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={() => setFilterDrawerOpen(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      minHeight: 40,
                      px: 2,
                    }}
                  >
                    Filters
                  </Button>
                </Badge>
              )}

              {/* Sort Dropdown */}
              <FormControl size="small" sx={{ minWidth: 165 }}>
                <InputLabel id="restaurant-sort-label">Sort by</InputLabel>
                <Select
                  labelId="restaurant-sort-label"
                  id="restaurant-sort-select"
                  value={filters.sortBy || 'rating'}
                  label="Sort by"
                  onChange={handleSortChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <Sort fontSize="small" color="action" />
                    </InputAdornment>
                  }
                  sx={{ borderRadius: 2, bgcolor: 'background.paper' }}
                >
                  <MenuItem value="rating">Rating: High to Low</MenuItem>
                  <MenuItem value="deliveryTime">Delivery Time</MenuItem>
                  <MenuItem value="price">Min. order: Low to High</MenuItem>
                  <MenuItem value="price_desc">Min. order: High to Low</MenuItem>
                  <MenuItem value="name">Name: A to Z</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* =============================================================== */}
          {/* Active Filter Chips                                              */}
          {/* =============================================================== */}
          {activeFiltersCount > 0 && (
            <Box
              data-testid="active-filter-chips"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                mb: 3,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mr: 0.5 }}>
                Active:
              </Typography>

              {filters.searchQuery && (
                <Chip
                  label={`Search: "${filters.searchQuery}"`}
                  onDelete={handleClearSearch}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}

              {filters.featuredOnly && (
                <Chip
                  label="Featured Only"
                  onDelete={() => dispatch(setFeaturedOnly(false))}
                  size="small"
                  color="primary"
                />
              )}

              {filters.cuisines.map((cuisine) => (
                <Chip
                  key={cuisine}
                  label={cuisine}
                  onDelete={() => handleCuisineToggle(cuisine)}
                  size="small"
                  color="primary"
                />
              ))}

              {filters.minRating && (
                <Chip
                  label={`${filters.minRating}★ & up`}
                  onDelete={() => dispatch(setMinRating(null))}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}

              {filters.deliveryTime && filters.deliveryTime !== 'all' && (
                <Chip
                  label={`Within ${filters.deliveryTime} mins`}
                  onDelete={() => dispatch(setDeliveryTime('all'))}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}

              {filters.isOpen && (
                <Chip
                  label="Open Now"
                  onDelete={() => dispatch(setOpenNowFilter(false))}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}

              {filters.isVeg && (
                <Chip
                  label="Pure Veg"
                  onDelete={() => dispatch(setVegFilter(false))}
                  size="small"
                  color="success"
                />
              )}

              {((filters.minPrice ?? 0) > 0 || (filters.maxPrice ?? 1000) < 1000) && (
                <Chip
                  label={`Order: ₹${filters.minPrice ?? 0} - ₹${filters.maxPrice ?? 1000}+`}
                  onDelete={() => dispatch(setPriceRange([0, 1000]))}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}

              <Button
                size="small"
                onClick={handleClearAllFilters}
                sx={{
                  ml: 'auto',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  py: 0.25,
                  minHeight: 24,
                }}
              >
                Clear all
              </Button>
            </Box>
          )}

          {/* =============================================================== */}
          {/* Restaurant Results Grid                                         */}
          {/* =============================================================== */}
          {initialLoading ? (
            /* Loading skeletons matching responsive card layout */
            <Grid container spacing={{ xs: 2.5, sm: 3 }}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Grid
                  size={{ xs: 12, sm: 6, md: 6, lg: 4 }}
                  key={item}
                  sx={{ display: 'flex' }}
                >
                  <RestaurantCardSkeleton />
                </Grid>
              ))}
            </Grid>
          ) : paginatedRestaurants.length === 0 ? (
            /* Truthful empty state distinguishing filters vs empty catalogue */
            <Paper
              variant="outlined"
              sx={{
                textAlign: 'center',
                py: { xs: 6, md: 8 },
                px: 3,
                borderRadius: 3,
                borderStyle: 'dashed',
                borderColor: 'divider',
              }}
            >
              <RestaurantIcon
                sx={{
                  fontSize: { xs: 56, md: 72 },
                  color: 'text.secondary',
                  mb: 2,
                  opacity: 0.6,
                }}
              />
              <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                {allRestaurants.length === 0 ? 'No restaurants available' : 'No restaurants match your filters'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mb: 3 }}>
                {allRestaurants.length === 0
                  ? 'We are actively expanding our partner kitchens. Please check back shortly.'
                  : 'Try loosening your cuisine selections, broadening delivery duration, or resetting the search term.'}
              </Typography>
              {activeFiltersCount > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleClearAllFilters}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1, borderRadius: 2 }}
                >
                  Reset All Filters
                </Button>
              )}
            </Paper>
          ) : (
            /* Loaded Restaurant Cards */
            <Grid container spacing={{ xs: 2.5, sm: 3 }}>
              {paginatedRestaurants.map((restaurant) => (
                <Grid
                  size={{ xs: 12, sm: 6, md: 6, lg: 4 }}
                  key={restaurant.id}
                  sx={{ display: 'flex' }}
                >
                  <RestaurantCard restaurant={restaurant} />
                </Grid>
              ))}
            </Grid>
          )}

          {/* =============================================================== */}
          {/* Pagination                                                      */}
          {/* =============================================================== */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: { xs: 4, md: 6 },
                pt: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? 'medium' : 'large'}
                showFirstButton
                showLastButton
                aria-label="Restaurant pagination navigation"
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* =================================================================== */}
      {/* Mobile Filter Drawer                                                */}
      {/* =================================================================== */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: '85%',
              maxWidth: 360,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {/* Drawer Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList color="primary" />
              <Typography variant="h6" fontWeight={700}>
                Filters
              </Typography>
              {activeFiltersCount > 0 && (
                <Chip
                  label={activeFiltersCount}
                  size="small"
                  color="primary"
                  sx={{ height: 22, fontWeight: 700 }}
                />
              )}
            </Box>
            <IconButton onClick={() => setFilterDrawerOpen(false)} aria-label="Close filters">
              <Close />
            </IconButton>
          </Box>

          {/* Drawer Scrollable Body */}
          <Box sx={{ overflowY: 'auto', p: 2, flex: 1 }}>
            {filterContent}
          </Box>

          {/* Drawer Sticky Footer with Clear and Apply Actions */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              gap: 1.5,
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={handleClearAllFilters}
              disabled={activeFiltersCount === 0}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              onClick={() => setFilterDrawerOpen(false)}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Show {filteredRestaurants.length} Results
            </Button>
          </Box>
        </Drawer>
      )}
    </Container>
  );
};

export default Restaurants;