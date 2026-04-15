import React from 'react';
import {
  Box,
  Stack,
  Grid,
  Chip,
  Slider,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormGroup,
  Checkbox,
  Rating,
} from '@mui/material';
import { FilterGroup } from '../../../ui/components';
import { CUISINES, DELIVERY_TIMES } from '../../../../core/constants/food';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import {
  toggleCuisine,
  setPriceRange,
  setMinRating,
  setDeliveryTime,
  setVegFilter,
  setOpenNowFilter,
} from '../../restaurantSlice';

const RestaurantFilters: React.FC = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.restaurants.filters);

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

  return (
    <Stack spacing={3}>
      {/* Cuisine Filter */}
      <FilterGroup label="Cuisine Type" defaultExpanded>
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
      </FilterGroup>

      {/* Price Range Filter */}
      <FilterGroup label="Minimum Order" defaultExpanded>
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
      </FilterGroup>

      {/* Rating Filter */}
      <FilterGroup label="Rating" defaultExpanded>
        <RadioGroup
          value={filters.minRating || ''}
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
      </FilterGroup>

      {/* Delivery Time Filter */}
      <FilterGroup label="Delivery Time" defaultExpanded>
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
              label={`Under ${time} mins`}
            />
          ))}
        </RadioGroup>
      </FilterGroup>

      {/* More Filters */}
      <FilterGroup label="More Filters" defaultExpanded>
        <FormGroup >
          <FormControlLabel
            control={<Checkbox checked={filters.isVeg} onChange={handleVegFilterChange} />}
            label="Pure Veg"
          />
          <FormControlLabel
            control={<Checkbox checked={filters.isOpen} onChange={handleOpenNowChange} />}
            label="Open Now"
          />
        </FormGroup>
      </FilterGroup>
    </Stack>
  );
};

export default RestaurantFilters;
