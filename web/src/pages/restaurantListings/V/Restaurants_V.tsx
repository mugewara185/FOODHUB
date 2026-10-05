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

import RestaurantCard from '../../../features/restaurant/components/RestaurantCard/RestaurantCard_V';

import {
    CUISINES,
    DELIVERY_TIMES,
} from '../../../core/constants/food';

const SIDEBAR_WIDTH = 350;

const Restaurants: React.FC = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // ---------------------------------------------------------------------------
    // Local UI state
    // ---------------------------------------------------------------------------

    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState('');

    const [debounceTimer, setDebounceTimer] = useState<
        ReturnType<typeof setTimeout> | null
    >(null);

    // ---------------------------------------------------------------------------
    // Redux state
    // ---------------------------------------------------------------------------

    const paginatedRestaurants = useAppSelector(selectPaginatedRestaurants);
    const totalPages = useAppSelector(selectTotalPages);
    const activeFiltersCount = useAppSelector(selectActiveFiltersCount);

    const loading = useAppSelector(selectRestaurantLoading);
    const error = useAppSelector(selectRestaurantError);

    const filters = useAppSelector(
        (state) => state.restaurants.filters
    );

    const currentPage = useAppSelector(
        (state) => state.restaurants.pagination.currentPage
    );

    const filteredCount = useAppSelector(
        selectFilteredRestaurants
    ).length;

    // ---------------------------------------------------------------------------
    // Initial restaurant fetch
    // ---------------------------------------------------------------------------

    useEffect(() => {
        dispatch(fetchRestaurants());
    }, [dispatch]);

    // ---------------------------------------------------------------------------
    // Cleanup debounce timer
    // ---------------------------------------------------------------------------

    useEffect(() => {
        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    }, [debounceTimer]);

    // ---------------------------------------------------------------------------
    // Search
    // ---------------------------------------------------------------------------

    const handleSearchChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
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

    // ---------------------------------------------------------------------------
    // Filters
    // ---------------------------------------------------------------------------

    const handleCuisineToggle = (cuisine: string) => {
        dispatch(toggleCuisine(cuisine));
    };

    const handlePriceRangeChange = (
        _event: Event,
        newValue: number | number[]
    ) => {
        dispatch(
            setPriceRange(newValue as [number, number])
        );
    };

    const handleRatingChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        dispatch(setMinRating(Number(e.target.value)));
    };

    const handleDeliveryTimeChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        dispatch(setDeliveryTime(e.target.value));
    };

    const handleVegFilterChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        dispatch(setVegFilter(e.target.checked));
    };

    const handleOpenNowChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        dispatch(setOpenNowFilter(e.target.checked));
    };

    const handleSortChange = (
        e: SelectChangeEvent
    ) => {
        dispatch(setSortBy(e.target.value as any));
    };

    const handleClearFilters = () => {
        dispatch(clearFilters());
        setLocalSearch('');
    };

    const handlePageChange = (
        _event: React.ChangeEvent<unknown>,
        page: number
    ) => {
        dispatch(setCurrentPage(page));

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    // ---------------------------------------------------------------------------
    // Filter content
    // ---------------------------------------------------------------------------

    const FilterContent = () => (
        <Box
            sx={{
                p: 3,
                width: '100%',
                boxSizing: 'border-box',
            }}
        >
            <Stack spacing={3}>

                {/* Cuisine */}
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography fontWeight={600}>
                            Cuisine Type
                        </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                        <Grid container spacing={1}>
                            {CUISINES.map((cuisine) => {
                                const selected =
                                    filters.cuisines.includes(cuisine.name);

                                return (
                                    <Grid
                                        item
                                        xs={6}
                                        key={cuisine.id}
                                    >
                                        <Chip
                                            label={`${cuisine.icon} ${cuisine.name}`}
                                            onClick={() =>
                                                handleCuisineToggle(cuisine.name)
                                            }
                                            color={
                                                selected
                                                    ? 'primary'
                                                    : 'default'
                                            }
                                            variant={
                                                selected
                                                    ? 'filled'
                                                    : 'outlined'
                                            }
                                            sx={{
                                                width: '100%',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </AccordionDetails>
                </Accordion>

                {/* Price */}
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography fontWeight={600}>
                            Minimum Order
                        </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                        <Box sx={{ px: 2 }}>
                            <Slider
                                value={[
                                    filters.minPrice!,
                                    filters.maxPrice!,
                                ]}
                                onChange={handlePriceRangeChange}
                                valueLabelDisplay="auto"
                                min={0}
                                max={1000}
                                step={50}
                                valueLabelFormat={(value) =>
                                    `₹${value}`
                                }
                            />

                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mt: 1,
                                }}
                            >
                                <Typography variant="body2">
                                    ₹{filters.minPrice}
                                </Typography>

                                <Typography variant="body2">
                                    ₹{filters.maxPrice}+
                                </Typography>
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* Rating */}
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography fontWeight={600}>
                            Rating
                        </Typography>
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
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                            }}
                                        >
                                            <Rating
                                                value={rating}
                                                readOnly
                                                size="small"
                                            />

                                            <Typography variant="body2">
                                                & up
                                            </Typography>
                                        </Box>
                                    }
                                />
                            ))}
                        </RadioGroup>
                    </AccordionDetails>
                </Accordion>

                {/* Delivery time */}
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography fontWeight={600}>
                            Delivery Time
                        </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                        <RadioGroup
                            value={filters.deliveryTime}
                            onChange={handleDeliveryTimeChange}
                        >
                            <FormControlLabel
                                value="all"
                                control={<Radio />}
                                label="Any time"
                            />

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

                {/* Additional filters */}
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography fontWeight={600}>
                            More Filters
                        </Typography>
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

    // ---------------------------------------------------------------------------
    // Error state
    // ---------------------------------------------------------------------------

    if (error) {
        return (
            <Container
                maxWidth="lg"
                sx={{ py: 4 }}
            >
                <Alert severity="error">
                    {error}
                </Alert>
            </Container>
        );
    }

    // ---------------------------------------------------------------------------
    // Page
    // ---------------------------------------------------------------------------

    return (
        <Container
            maxWidth="xl"
            sx={{
                py: 4,
                height: 'calc(100vh - 140px)',
                boxSizing: 'border-box',
                overflow: isMobile
                    ? 'visible'
                    : 'hidden',
            }}
        >

            {/* ===================================================================== */}
            {/* Main page layout                                                      */}
            {/* ===================================================================== */}

            <Box
                sx={{
                    display: 'flex',
                    gap: 3,
                    height: '94%',
                    minWidth: 0,
                }}
            >

                {/* =================================================================== */}
                {/* DESKTOP FILTER SIDEBAR                                              */}
                {/* =================================================================== */}

                {!isMobile && (
                    <Box
                        sx={{
                            /*
                             * Fixed sidebar sizing.
                             *
                             * flex-basis = 350px
                             * grow       = 0
                             * shrink     = 0
                             *
                             * Therefore the number/size of restaurant cards
                             * cannot change the sidebar width.
                             */
                            flex: `0 0 ${SIDEBAR_WIDTH}px`,

                            width: SIDEBAR_WIDTH,
                            minWidth: SIDEBAR_WIDTH,
                            maxWidth: SIDEBAR_WIDTH,

                            alignSelf: 'flex-start',

                            /*
                             * The sidebar itself doesn't participate in the
                             * restaurant content scrolling.
                             */
                            minHeight: 0,
                        }}
                    >

                        {/* Sidebar header */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    minWidth: 0,
                                }}
                            >
                                <FilterList />

                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                >
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
                                <Button
                                    onClick={handleClearFilters}
                                    size="small"
                                >
                                    Clear All
                                </Button>
                            )}
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* Sidebar scrolling area */}
                        <Box
                            sx={{
                                width: '100%',
                                maxHeight: 'calc(100vh - 220px)',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                pr: 0.5,

                                /*
                                 * Prevent scrollbar/layout jitter from affecting
                                 * the fixed sidebar dimensions.
                                 */
                                boxSizing: 'border-box',
                            }}
                        >
                            <FilterContent />
                        </Box>
                    </Box>
                )}

                {/* =================================================================== */}
                {/* RESTAURANT CONTENT AREA                                             */}
                {/* =================================================================== */}

                <Box
                    sx={{
                        /*
                         * Take all remaining horizontal space.
                         */
                        flex: '1 1 auto',

                        /*
                         * Critical for flex children containing grids.
                         * Without minWidth: 0, long content can force
                         * the flex item beyond its available width.
                         */
                        minWidth: 0,

                        /*
                         * Allows the restaurant content to establish
                         * its own vertical scrolling region.
                         */
                        minHeight: 0,

                        display: 'flex',
                        flexDirection: 'column',

                        overflow: 'hidden',

                        pr: 1,
                    }}
                >

                    {/* =============================================================== */}
                    {/* Toolbar                                                         */}
                    {/* =============================================================== */}

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 2,
                            flexWrap: 'wrap',
                            gap: 2,
                            flexShrink: 0,
                        }}
                    >

                        {/* Search */}
                        <TextField
                            placeholder="Search restaurants or cuisines..."
                            value={localSearch}
                            onChange={handleSearchChange}
                            size="small"
                            sx={{
                                flex: {
                                    xs: 1,
                                    md: 0.5,
                                    lg: 0.4,
                                },
                                minWidth: 220,
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                alignItems: 'center',
                            }}
                        >

                            {/* Mobile filter button */}
                            {isMobile && (
                                <Badge
                                    badgeContent={activeFiltersCount}
                                    color="primary"
                                >
                                    <Button
                                        variant="outlined"
                                        startIcon={<FilterList />}
                                        onClick={() =>
                                            setFilterDrawerOpen(true)
                                        }
                                    >
                                        Filters
                                    </Button>
                                </Badge>
                            )}

                            {/* Sort */}
                            <FormControl
                                size="small"
                                sx={{ minWidth: 150 }}
                            >
                                <InputLabel>
                                    Sort by
                                </InputLabel>

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
                                    <MenuItem value="rating">
                                        Rating: High to Low
                                    </MenuItem>

                                    <MenuItem value="deliveryTime">
                                        Delivery Time
                                    </MenuItem>

                                    <MenuItem value="price">
                                        Price: Low to High
                                    </MenuItem>

                                    <MenuItem value="price_desc">
                                        Price: High to Low
                                    </MenuItem>

                                    <MenuItem value="name">
                                        Name: A to Z
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* =============================================================== */}
                    {/* Active filters                                                   */}
                    {/* =============================================================== */}

                    {activeFiltersCount > 0 && (
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                flexWrap: 'wrap',
                                mt: 1,
                                mb: 2,
                                flexShrink: 0,
                            }}
                        >

                            {filters.searchQuery && (
                                <Chip
                                    label={`Search: ${filters.searchQuery}`}
                                    onDelete={() => {
                                        dispatch(
                                            setSearchQuery('')
                                        );

                                        setLocalSearch('');
                                    }}
                                    size="small"
                                />
                            )}

                            {filters.cuisines.map((cuisine) => (
                                <Chip
                                    key={cuisine}
                                    label={cuisine}
                                    onDelete={() =>
                                        handleCuisineToggle(cuisine)
                                    }
                                    size="small"
                                />
                            ))}

                            {filters.minRating && (
                                <Chip
                                    label={`${filters.minRating}+ Stars`}
                                    onDelete={() =>
                                        dispatch(setMinRating(null))
                                    }
                                    size="small"
                                />
                            )}

                            {filters.deliveryTime !== 'all' && (
                                <Chip
                                    label={filters.deliveryTime}
                                    onDelete={() =>
                                        dispatch(
                                            setDeliveryTime('all')
                                        )
                                    }
                                    size="small"
                                />
                            )}

                            {filters.isVeg && (
                                <Chip
                                    label="Pure Veg"
                                    onDelete={() =>
                                        dispatch(
                                            setVegFilter(false)
                                        )
                                    }
                                    size="small"
                                />
                            )}

                            {filters.isOpen && (
                                <Chip
                                    label="Open Now"
                                    onDelete={() =>
                                        dispatch(
                                            setOpenNowFilter(false)
                                        )
                                    }
                                    size="small"
                                />
                            )}

                            {(filters.minPrice! > 0 ||
                                filters.maxPrice! < 1000) && (
                                    <Chip
                                        label={`₹${filters.minPrice} - ₹${filters.maxPrice}+`}
                                        onDelete={() =>
                                            dispatch(
                                                setPriceRange([0, 1000])
                                            )
                                        }
                                        size="small"
                                    />
                                )}
                        </Box>
                    )}

                    {/* =============================================================== */}
                    {/* Restaurant results                                               */}
                    {/* =============================================================== */}

                    <Box
                        sx={{
                            /*
                             * This is the only vertical scrolling region
                             * on desktop.
                             */
                            flex: '1 1 auto',
                            minHeight: 0,

                            overflowY: 'auto',
                            overflowX: 'hidden',

                            pr: 1,
                            pt: 1,
                        }}
                    >

                        {/* Loading */}
                        {loading ? (
                            <Grid container spacing={3}>
                                {[1, 2, 3, 4, 5, 6].map(
                                    (item) => (
                                        <Grid
                                            item
                                            xs={12}
                                            sm={6}
                                            md={4}
                                            key={item}
                                        >
                                            <Skeleton
                                                variant="rectangular"
                                                height={200}
                                                sx={{
                                                    borderRadius: 2,
                                                }}
                                            />

                                            <Skeleton
                                                variant="text"
                                                height={40}
                                                sx={{ mt: 1 }}
                                            />

                                            <Skeleton
                                                variant="text"
                                                width="60%"
                                            />

                                            <Skeleton
                                                variant="text"
                                                width="40%"
                                            />
                                        </Grid>
                                    )
                                )}
                            </Grid>
                        ) : paginatedRestaurants.length === 0 ? (

                            /* Empty state */
                            <Box
                                sx={{
                                    textAlign: 'center',
                                    py: 8,
                                }}
                            >
                                <RestaurantIcon
                                    sx={{
                                        fontSize: 80,
                                        color: 'text.secondary',
                                        mb: 2,
                                    }}
                                />

                                <Typography
                                    variant="h6"
                                    color="text.secondary"
                                >
                                    No restaurants found
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Try adjusting your filters or
                                    search query
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

                            /* Restaurant cards */
                            <Grid
                                container
                                spacing={3}
                            >
                                {paginatedRestaurants.map(
                                    (restaurant) => (
                                        <Grid
                                            item
                                            xs={12}
                                            sm={6}
                                            md={4}
                                            key={restaurant.id}
                                        >
                                            <RestaurantCard
                                                restaurant={restaurant}
                                            />
                                        </Grid>
                                    )
                                )}
                            </Grid>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ===================================================================== */}
            {/* Pagination                                                            */}
            {/* ===================================================================== */}

            {totalPages > 1 && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mt: 2,
                        flexShrink: 0,
                    }}
                >
                    <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        size={
                            isMobile
                                ? 'medium'
                                : 'large'
                        }
                    />
                </Box>
            )}

            {/* ===================================================================== */}
            {/* Mobile Filter Drawer                                                  */}
            {/* ===================================================================== */}

            {isMobile && (
                <Drawer
                    anchor="left"
                    open={filterDrawerOpen}
                    onClose={() =>
                        setFilterDrawerOpen(false)
                    }
                    PaperProps={{
                        sx: {
                            width: '90%',
                            maxWidth: 360,
                        },
                    }}
                >
                    {/* Drawer header */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 2,
                            pt: 2,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <FilterList />

                            <Typography
                                variant="h6"
                                fontWeight={700}
                            >
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

                        <IconButton
                            onClick={() =>
                                setFilterDrawerOpen(false)
                            }
                        >
                            <Close />
                        </IconButton>
                    </Box>

                    <Divider sx={{ mt: 1 }} />

                    <Box
                        sx={{
                            overflowY: 'auto',
                            flex: 1,
                        }}
                    >
                        <FilterContent />
                    </Box>
                </Drawer>
            )}
        </Container>
    );
};

export default Restaurants;