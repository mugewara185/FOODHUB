import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Paper,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear,
  History,
  TrendingUp,
  Restaurant,
  LocalDining,
} from '@mui/icons-material';
import RestaurantCard from '../components/restaurant/RestaurantCard';
import FoodItemCard from '../components/food/FoodItemCard';
import { MOCK_RESTAURANTS, MOCK_FOOD_ITEMS } from '../core/constants/food';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([
    'Butter Chicken',
    'Pizza',
    'Burgers',
    'Sushi',
  ]);
  const [trendingSearches] = useState<string[]>([
    'Biryani',
    'Momos',
    'Pasta',
    'Noodles',
    'Ice Cream',
  ]);

  // Mock search results
  const restaurantResults = MOCK_RESTAURANTS.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const foodResults = MOCK_FOOD_ITEMS.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
      // Add to search history
      if (!searchHistory.includes(q)) {
        setSearchHistory(prev => [q, ...prev.slice(0, 4)]);
      }
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  const handleSearchHistoryClick = (query: string) => {
    setSearchQuery(query);
    setSearchParams({ q: query });
  };

  const handleRemoveHistory = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Search Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Search for restaurants & food
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
          Find your favorite dishes from 500+ restaurants
        </Typography>

        <Box component="form" onSubmit={handleSearch}>
          <TextField
            fullWidth
            placeholder="Search 'Butter Chicken', 'Pizza', 'Burgers'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} edge="end">
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      {/* No Search Query - Show Suggestions */}
      {!searchQuery && (
        <Grid container spacing={4}>
          {/* Search History */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Recent Searches
                </Typography>
              </Box>
              {searchHistory.length > 0 && (
                <Button size="small" onClick={handleClearHistory}>
                  Clear All
                </Button>
              )}
            </Box>

            {searchHistory.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No recent searches
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={1}>
                {searchHistory.map((item, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => handleSearchHistoryClick(item)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <History fontSize="small" color="action" />
                      <Typography>{item}</Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleRemoveHistory(index, e)}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            )}
          </Grid>

          {/* Trending Searches */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUp color="primary" />
              <Typography variant="h6" fontWeight={700}>
                Trending Now
              </Typography>
            </Box>

            <Grid container spacing={1}>
              {trendingSearches.map((item, index) => (
                <Grid item key={index}>
                  <Chip
                    label={item}
                    onClick={() => handleSearchHistoryClick(item)}
                    color="primary"
                    variant="outlined"
                    sx={{ cursor: 'pointer' }}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Popular Cuisines */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Popular Cuisines
              </Typography>
              <Grid container spacing={2}>
                {['Indian', 'Chinese', 'Italian', 'Mexican', 'Japanese', 'Thai'].map((cuisine) => (
                  <Grid item xs={6} sm={4} key={cuisine}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderRadius: 2,
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                      onClick={() => handleSearchHistoryClick(cuisine)}
                    >
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {cuisine === 'Indian' && '🍛'}
                        {cuisine === 'Chinese' && '🥡'}
                        {cuisine === 'Italian' && '🍝'}
                        {cuisine === 'Mexican' && '🌮'}
                        {cuisine === 'Japanese' && '🍣'}
                        {cuisine === 'Thai' && '🍜'}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {cuisine}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Search Results */}
      {searchQuery && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              aria-label="search results tabs"
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Restaurant />
                    <span>Restaurants</span>
                    <Chip
                      label={restaurantResults.length}
                      size="small"
                      color="primary"
                    />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalDining />
                    <span>Food Items</span>
                    <Chip
                      label={foodResults.length}
                      size="small"
                      color="primary"
                    />
                  </Box>
                }
              />
            </Tabs>
          </Box>

          {/* Search Stats */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Found {activeTab === 0 ? restaurantResults.length : foodResults.length} results for "{searchQuery}"
          </Typography>

          <TabPanel value={activeTab} index={0}>
            {restaurantResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Restaurant sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No restaurants found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try searching with different keywords
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {restaurantResults.map((restaurant) => (
                  <Grid item xs={12} sm={6} lg={4} key={restaurant.id}>
                    <RestaurantCard
                      restaurant={restaurant}
                      isFavorite={false}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {foodResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <LocalDining sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No food items found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try searching with different keywords
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {foodResults.map((foodItem) => (
                  <FoodItemCard
                    key={foodItem.id}
                    foodItem={foodItem}
                    quantity={0}
                  />
                ))}
              </Stack>
            )}
          </TabPanel>
        </>
      )}
    </Container>
  );
};

export default Search;