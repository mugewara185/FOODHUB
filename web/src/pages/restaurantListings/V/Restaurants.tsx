import React, { useState } from 'react';
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
  DeliveryDining,
  Star,
} from '@mui/icons-material';
// import RestaurantCard from '../../../features/restaurant/components/RestaurantCard';
import RestaurantCard from '../../../features/restaurants/components/RestaurantCard/Restaurants_Card';
import { MOCK_RESTAURANTS, CUISINES, DELIVERY_TIMES } from '../../../core/constants/food';
import { type Restaurant } from '../../../data/types/food';

const Restaurants: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Filter states
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [deliveryTime, setDeliveryTime] = useState<string>('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showOnlyVeg, setShowOnlyVeg] = useState(false);
  const [showOpenNow, setShowOpenNow] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const restaurantsPerPage = 12;

  // Filter restaurants
  const filteredRestaurants = MOCK_RESTAURANTS.filter(restaurant => {
    // Search filter
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Cuisine filter
    const matchesCuisine = selectedCuisines.length === 0 || 
                          restaurant.cuisine.some(c => selectedCuisines.includes(c));
    
    // Price filter
    const matchesPrice = restaurant.minOrder >= priceRange[0] && 
                        restaurant.minOrder <= priceRange[1];
    
    // Rating filter
    const matchesRating = !selectedRating || restaurant.rating >= selectedRating;
    
    // Delivery time filter
    const matchesDelivery = deliveryTime === 'all' || 
                           restaurant.deliveryTime === deliveryTime;
    
    // Veg filter
    const matchesVeg = !showOnlyVeg || restaurant.isVeg;
    
    // Open now filter
    const matchesOpen = !showOpenNow || restaurant.isOpen;
    
    return matchesSearch && matchesCuisine && matchesPrice && 
           matchesRating && matchesDelivery && matchesVeg && matchesOpen;
  });

  // Sort restaurants
  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'deliveryTime':
        return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
      case 'price':
        return a.minOrder - b.minOrder;
      case 'price_desc':
        return b.minOrder - a.minOrder;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Pagination
  const indexOfLastRestaurant = currentPage * restaurantsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - restaurantsPerPage;
  const currentRestaurants = sortedRestaurants.slice(
    indexOfFirstRestaurant, 
    indexOfLastRestaurant
  );
  const totalPages = Math.ceil(sortedRestaurants.length / restaurantsPerPage);

  const handleToggleFavorite = (restaurantId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(restaurantId)) {
        newFavorites.delete(restaurantId);
      } else {
        newFavorites.add(restaurantId);
      }
      return newFavorites;
    });
  };

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const clearAllFilters = () => {
    setSelectedCuisines([]);
    setPriceRange([0, 1000]);
    setSelectedRating(null);
    setDeliveryTime('all');
    setShowOnlyVeg(false);
    setShowOpenNow(false);
    setSortBy('rating');
  };

  const activeFiltersCount = [
    selectedCuisines.length,
    selectedRating ? 1 : 0,
    deliveryTime !== 'all' ? 1 : 0,
    showOnlyVeg ? 1 : 0,
    showOpenNow ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const FilterContent = () => (
    <Box sx={{ p: 3, width: isMobile ? 'auto' : 300 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
        {activeFiltersCount > 0 && (
          <Button onClick={clearAllFilters} size="small">
            Clear All
          </Button>
        )}
        {isMobile && (
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <Close />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

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
                    color={selectedCuisines.includes(cuisine.name) ? 'primary' : 'default'}
                    variant={selectedCuisines.includes(cuisine.name) ? 'filled' : 'outlined'}
                    sx={{ width: '100%' }}
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
                value={priceRange}
                onChange={(_, newValue) => setPriceRange(newValue as number[])}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={50}
                valueLabelFormat={(value) => `₹${value}`}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2">₹{priceRange[0]}</Typography>
                <Typography variant="body2">₹{priceRange[1]}+</Typography>
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
              value={selectedRating}
              onChange={(e) => setSelectedRating(Number(e.target.value))}
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
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
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
                    checked={showOnlyVeg}
                    onChange={(e) => setShowOnlyVeg(e.target.checked)}
                  />
                }
                label="Pure Veg"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showOpenNow}
                    onChange={(e) => setShowOpenNow(e.target.checked)}
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Restaurants Near You
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover the best food in your area
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper
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
      </Paper>

      <Grid container spacing={3}>
        {/* Filters - Desktop */}
        {!isMobile && (
          <Grid item md={3}>
            <Box sx={{ position: 'sticky', top: 20 }}>
              <FilterContent />
            </Box>
          </Grid>
        )}

        {/* Restaurants Grid */}
        <Grid item xs={12} md={9}>
          {/* Toolbar */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}>
            {/* Search */}
            <TextField
              placeholder="Search restaurants or cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flex: { xs: 1, md: 0.4 } }}
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
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value)}
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
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {selectedCuisines.map(cuisine => (
                <Chip
                  key={cuisine}
                  label={cuisine}
                  onDelete={() => handleCuisineToggle(cuisine)}
                  size="small"
                />
              ))}
              {selectedRating && (
                <Chip
                  label={`${selectedRating}+ Stars`}
                  onDelete={() => setSelectedRating(null)}
                  size="small"
                />
              )}
              {deliveryTime !== 'all' && (
                <Chip
                  label={deliveryTime}
                  onDelete={() => setDeliveryTime('all')}
                  size="small"
                />
              )}
              {showOnlyVeg && (
                <Chip
                  label="Pure Veg"
                  onDelete={() => setShowOnlyVeg(false)}
                  size="small"
                />
              )}
              {showOpenNow && (
                <Chip
                  label="Open Now"
                  onDelete={() => setShowOpenNow(false)}
                  size="small"
                />
              )}
              {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                <Chip
                  label={`₹${priceRange[0]} - ₹${priceRange[1]}+`}
                  onDelete={() => setPriceRange([0, 1000])}
                  size="small"
                />
              )}
            </Box>
          )}

          {/* Results Count */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {sortedRestaurants.length} restaurants found
          </Typography>

          {/* Restaurant Grid */}
          {currentRestaurants.length === 0 ? (
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
                onClick={clearAllFilters}
              >
                Clear Filters
              </Button>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {currentRestaurants.map((restaurant) => (
                  <Grid item xs={12} sm={6} lg={4} key={restaurant.id}>
                    <RestaurantCard
                      restaurant={restaurant}
                      isFavorite={favorites.has(restaurant.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, page) => setCurrentPage(page)}
                    color="primary"
                    size={isMobile ? 'medium' : 'large'}
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* Mobile Filter Drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{ sx: { width: '90%', maxWidth: 360 } }}
        >
          {/* <FilterContent /> */}
        </Drawer>
      )}
    </Container>
  );
};

export default Restaurants;