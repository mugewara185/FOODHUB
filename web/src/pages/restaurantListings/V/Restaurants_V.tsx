import React, { useEffect, useState } from 'react';
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
  Paper,
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
  Skeleton,
  Alert,
  type SelectChangeEvent,
} from '@mui/material';
import {
  Search,
  FilterList,
  Sort,
  LocationOn,
  AccessTime,
  ExpandMore,
  Close,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
  fetchRestaurants,
  setSearchQuery,
  toggleCuisine,
  setPriceRange,
  setMinRating,
  setDeliveryTime,
  setVegFilter,
  setOpenNowFilter,
  setSortBy,
  clearFilters,
  setCurrentPage,
  selectPaginatedRestaurants,
  selectTotalPages,
  selectActiveFiltersCount,
  selectRestaurantLoading,
  selectRestaurantError,
  selectFilteredRestaurants,
} from '../../../features/restaurant/restaurantSlice';
// import RestaurantCard from '../../../features/restaurant/components/RestaurantCard';
import RestaurantCard from '../../../features/restaurant/components/RestaurantCard/RestaurantCard_V';
import { CUISINES, DELIVERY_TIMES } from '../../../core/constants/food';

const Restaurants: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  // Local UI state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
//   const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
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

  // Fetch restaurants on mount
  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      dispatch(setSearchQuery(value));
    }, 500);
    
    setDebounceTimer(timer);
  };

  const handleCuisineToggle = (cuisine: string) => {
    dispatch(toggleCuisine(cuisine));
  };

  const handlePriceRangeChange = (_: Event, newValue: number | number[]) => {
    dispatch(setPriceRange(newValue as [number, number]));
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setMinRating(Number(e.target.value)));
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

  const handleSortChange = (e: SelectChangeEvent) => {
    dispatch(setSortBy(e.target.value as any));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setLocalSearch('');
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    dispatch(setCurrentPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine grid column sizes based on screen size
  const getGridColumns = () => {
    if (isMobile) return 12;        // Mobile: 1 column
    if (isTablet) return 6;         // Tablet: 2 columns
    return 4;                        // Desktop: 3 columns
  };

  const FilterContent = () => (
    <Box sx={{ p: 3, width: isMobile ? 'auto' : '100%' }}>
      <Stack spacing={3}>
        {/* Cuisine Filter */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>Cuisine Type</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={1}>
              {CUISINES.map((cuisine) => (
                <Grid item xs={6} key={cuisine.id}>
                  <Chip
                    label={`${cuisine.icon} ${cuisine.name}`}
                    onClick={() => handleCuisineToggle(cuisine.name)}
                    color={filters.cuisines.includes(cuisine.name) ? 'primary' : 'default'}
                    variant={filters.cuisines.includes(cuisine.name) ? 'filled' : 'outlined'}
                    sx={{ width: '100%', cursor: 'pointer' }}
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Price Range Filter */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>Minimum Order</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 2 }}>
              <Slider
                value={[filters.minPrice!, filters.maxPrice!]}
                onChange={handlePriceRangeChange}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={50}
                valueLabelFormat={(value) => `₹${value}`}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2">₹{filters.minPrice}</Typography>
                <Typography variant="body2">₹{filters.maxPrice}+</Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Rating Filter */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>Rating</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <RadioGroup
              value={filters.minRating}
              onChange={handleRatingChange}
            >
              {[4, 3, 2, 1].map((rating) => (
                <FormControlLabel
                  key={rating}
                  value={rating}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={rating} readOnly size="small" />
                      <Typography variant="body2">& up</Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </AccordionDetails>
        </Accordion>

        {/* Delivery Time Filter */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>Delivery Time</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <RadioGroup
              value={filters.deliveryTime}
              onChange={handleDeliveryTimeChange}
            >
              <FormControlLabel value="all" control={<Radio />} label="Any time" />
              {DELIVERY_TIMES.map((time) => (
                <FormControlLabel
                  key={time}
                  value={time}
                  control={<Radio />}
                  label={time}
                />
              ))}
            </RadioGroup>
          </AccordionDetails>
        </Accordion>

        {/* Additional Filters */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>More Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.isVeg}
                    onChange={handleVegFilterChange}
                  />
                }
                label="Pure Veg"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.isOpen}
                    onChange={handleOpenNowChange}
                  />
                }
                label="Open Now"
              />
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{
       py: 4,
       height: 'calc(100vh - 140px)',
       overflow: `${!isMobile ? 'hidden' :''}`
        }}>
      {/* Header */}
      {/* <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Restaurants Near You
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover the best food in your area
        </Typography>
      </Box> */}

      {/* Location Bar */}
      {/* <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 2,
          mb: 4,
          borderRadius: 3,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <LocationOn color="action" />
          <Typography variant="body2" color="text.secondary">
            Delivering to:
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            Home - 123 Main Street
          </Typography>
        </Box>
        <Button size="small">Change</Button>
      </Paper> */}

{/* //ts  */}
      {/* Main Content Grid */}
      <Grid container spacing={3} wrap='nowrap' height={'94%'}>
        {/* Filters - Desktop (Left Column) */}
        {!isMobile && (
          <Grid item xs={12} md={3} lg={3}
            sx={{
                flexShrink:0,
                width:350, //dev-c:fixed width
                alignSelf: 'flex-start'
            }}
          >
            {/* Header  */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent:'space-between' }}>
              <Box sx={{display:'flex', alignItems:'center', gap:1}}>
                <FilterList />
                <Typography variant="h6" fontWeight={700}>
                  Filters
                </Typography>
                {activeFiltersCount > 0 && (
                  <Chip 
                  label={activeFiltersCount} 
                  size="small" 
                  color="primary" 
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems:'center' ,  }}>
                {activeFiltersCount > 0 && (
                  <Button onClick={handleClearFilters} size="small">
                    Clear All
                  </Button>
                )}
                {isMobile && (
                  <IconButton onClick={() => setFilterDrawerOpen(false)}>
                    <Close />
                  </IconButton>
                )}
              </Box>
            </Box>
                  <Divider sx={{ m: 1 }} />
            <Box sx={{ 
              // position: 'sticky', top: 0, 
              // border:'2px solid blue' ,
              width:'100%',
              maxHeight:'60vh',
              overflow:'auto'
              }}>
              <FilterContent />
            </Box>
          </Grid>
        )}

        {/* Restaurants Grid (Right Column) */}
        <Grid item xs={12} md={9} lg={9} sx={{
          minWidth:0,
          // height:'70.8vh',
          // maxHeight:'calc(100vh - 100px)',
          // overflowY:'auto',
          display:'flex',
          flexDirection:'column',
          pr:1,
        }}>
          {/* Toolbar */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mt: 2,
            flexWrap: 'wrap',
            gap: 2,
          }}>
            {/* Search */}
            <TextField
              placeholder="Search restaurants or cuisines..."
              value={localSearch}
              onChange={handleSearchChange}
              size="small"
              sx={{ flex: { xs: 1, md: 0.5, lg: 0.4 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Mobile Filter Button */}
              {isMobile && (
                <Badge badgeContent={activeFiltersCount} color="primary">
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={() => setFilterDrawerOpen(true)}
                  >
                    Filters
                  </Button>
                </Badge>
              )}

              {/* Sort */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort by"
                  onChange={handleSortChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <Sort />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="rating">Rating: High to Low</MenuItem>
                  <MenuItem value="deliveryTime">Delivery Time</MenuItem>
                  <MenuItem value="price">Price: Low to High</MenuItem>
                  <MenuItem value="price_desc">Price: High to Low</MenuItem>
                  <MenuItem value="name">Name: A to Z</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3, mt:1 }}>
              {filters.searchQuery && (
                <Chip
                  label={`Search: ${filters.searchQuery}`}
                  onDelete={() => {
                    dispatch(setSearchQuery(''));
                    setLocalSearch('');
                  }}
                  size="small"
                />
              )}
              {filters.cuisines.map(cuisine => (
                <Chip
                  key={cuisine}
                  label={cuisine}
                  onDelete={() => handleCuisineToggle(cuisine)}
                  size="small"
                />
              ))}
              {filters.minRating && (
                <Chip
                  label={`${filters.minRating}+ Stars`}
                  onDelete={() => dispatch(setMinRating(null))}
                  size="small"
                />
              )}
              {filters.deliveryTime !== 'all' && (
                <Chip
                  label={filters.deliveryTime}
                  onDelete={() => dispatch(setDeliveryTime('all'))}
                  size="small"
                />
              )}
              {filters.isVeg && (
                <Chip
                  label="Pure Veg"
                  onDelete={() => dispatch(setVegFilter(false))}
                  size="small"
                />
              )}
              {filters.isOpen && (
                <Chip
                  label="Open Now"
                  onDelete={() => dispatch(setOpenNowFilter(false))}
                  size="small"
                />
              )}
              {(filters.minPrice! > 0 || filters.maxPrice! < 1000) && (
                <Chip
                  label={`₹${filters.minPrice} - ₹${filters.maxPrice}+`}
                  onDelete={() => dispatch(setPriceRange([0, 1000]))}
                  size="small"
                />
              )}
            </Box>
          )}

          {/* Results Count */}
          {/* <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {loading ? 'Loading...' : `${filteredCount} restaurants found`}
          </Typography> */}

          {/* Restaurant Grid */}
          {loading ? (
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item}>
                  <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                  <Skeleton variant="text" height={40} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Grid>
              ))}
            </Grid>
          ) : paginatedRestaurants.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <RestaurantIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No restaurants found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or search query
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </Box>
          ) : (
             <Box sx={{ 
              // position: 'sticky', top: 0, 
              // border:'2px solid blue' ,
              mt:1,
              width:'100%',
              // maxHeight:'60vh',
              overflow:`auto` //dev-implement: should add infinite scrolling for mobile
              }}>
              <Grid container spacing={3} sx={{
                // overflow:'auto'
              }}>
                {paginatedRestaurants.map((restaurant) => (
                  <Grid item xs={12} sm={6} md={4} letterSpacing={0} key={restaurant.id}>
                    <RestaurantCard restaurant={restaurant} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Grid>
      </Grid>
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, position:'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
             }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? 'medium' : 'large'}
              />
            </Box>
          )}

      {/* Mobile Filter Drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{ sx: { width: '90%', maxWidth: 360 } }}
        >
          <FilterContent />
        </Drawer>
      )}
    </Container>
  );
};

export default Restaurants;

// {
//   1.To implement:
//   ->add filters from url
// }