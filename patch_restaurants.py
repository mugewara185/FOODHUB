import re

with open('web/src/pages/restaurantListings/V/Restaurants_V.tsx', 'r') as f:
    c = f.read()

# Add imports
c = c.replace(
    "import { Restaurants_Card, RestaurantsCard } from '@features/restaurant/components/RestaurantCard';",
    "import { Restaurants_Card, RestaurantsCard } from '@features/restaurant/components/RestaurantCard';\nimport { AsyncBoundary } from '@/shared/components/ui/AsyncState';"
)

c = c.replace(
    "const loading = useAppSelector(selectRestaurantLoading);",
    "const fetchStatus = useAppSelector(selectFetchStatus);\n  const loading = fetchStatus === 'loading';"
)


# Replace rendering block
start_str = "{loading ? ("
end_str = "</Grid>\n              </>"

idx_start = c.find(start_str)
if idx_start != -1:
    idx_end = c.find("</Grid>", idx_start)
    idx_end = c.find("</>", idx_end) + 3

    replacement = """<AsyncBoundary
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
          </AsyncBoundary>"""

    c = c[:idx_start] + replacement + c[idx_end+1:]

with open('web/src/pages/restaurantListings/V/Restaurants_V.tsx', 'w') as f:
    f.write(c)
