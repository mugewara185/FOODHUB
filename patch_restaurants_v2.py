import os

path = 'web/src/pages/restaurantListings/V/Restaurants_V.tsx'
with open(path, 'r') as f:
    c = f.read()


c = c.replace(
'''import {
  fetchRestaurants,
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
} from '../../../features/restaurant/restaurantSlice';''',
'''import {
  fetchRestaurants,
  selectPaginatedRestaurants,
  selectTotalPages,
  selectActiveFiltersCount,
  selectFetchStatus,
  selectRestaurantError,
  selectFilteredRestaurants,
  toggleCuisine, // import actions if needed for removing filter chips
  setVegFilter,
  setOpenNowFilter,
  setDeliveryTime
} from '../../../features/restaurant/restaurantSlice';'''
)

c = c.replace(
"import { Restaurants_Card, RestaurantsCard } from '@features/restaurant/components/RestaurantCard';",
"import { Restaurants_Card, RestaurantsCard } from '@features/restaurant/components/RestaurantCard';\nimport { AsyncBoundary } from '@/shared/components/ui/AsyncState';"
)

c = c.replace(
"const loading = useAppSelector(selectRestaurantLoading);",
"const fetchStatus = useAppSelector(selectFetchStatus);\n  const loading = fetchStatus === 'loading';"
)

c = c.replace(
"{loading ? 'Finding restaurants...' : `${filteredCount} restaurants found`}",
"{filteredCount} restaurants found"
)

start_idx = c.find("{loading ? (")
end_idx = c.find("</Grid>\n      </Grid>")

if start_idx != -1 and end_idx != -1:
    replacement = '''<AsyncBoundary
            status={fetchStatus}
            error={error}
            hasData={paginatedRestaurants.length > 0}
            onRetry={() => dispatch(fetchRestaurants())}
            loadingComponent={<SkeletonGrid count={6} columns={{ xs: 12, sm: 6, md: 4 }} />}
            emptyComponent={
              <EmptyState
                icon={<RestaurantIcon />}
                title="No restaurants found"
                description="Try adjusting your filters or search query to find what you're looking for."
                action={{ label: 'Clear Filters', onClick: handleClearFilters }}
              />
            }
          >
            <Grid container spacing={3}>
              {paginatedRestaurants.map((restaurant) => (
                <Grid item xs={getGridColumns()} key={restaurant.id || (restaurant as any)._id}>
                  <Restaurants_Card restaurant={restaurant} />
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
          </AsyncBoundary>
        '''
    c = c[:start_idx] + replacement + c[end_idx:]

with open(path, 'w') as f:
    f.write(c)
print("Patched Restaurants_V.tsx")
