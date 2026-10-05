import os

path = 'web/src/pages/Orders/Orders.tsx'
with open(path, 'r') as f:
    c = f.read()


c = c.replace(
'''import {
  fetchOrdersThunk,
  cancelOrderThunk,
  selectOrders,
  selectOrdersLoading,
  selectOrderCancelling,
  selectOrderError,
} from '@/features/orders/orderSlice';''',
'''import {
  fetchOrdersThunk,
  cancelOrderThunk,
  selectOrders,
  selectFetchStatus,
  selectOrderCancelling,
  selectOrderError,
} from '@/features/orders/orderSlice';'''
)

c = c.replace(
"import type { Order } from '@/core/types';",
"import type { Order } from '@/core/types';\nimport { AsyncBoundary } from '@/shared/components/ui/AsyncState';\nimport { SkeletonGrid } from '@/shared/components/ui/SkeletonGrid';\nimport EmptyState from '@/shared/components/ui/EmptyState';"
)

c = c.replace(
"const isLoading = useAppSelector(selectOrdersLoading);",
"const fetchStatus = useAppSelector(selectFetchStatus);"
)

c = c.replace(
'''      {/* Loading indicator */}
      {isLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Error alert */}
      {orderError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {orderError}
        </Alert>
      )}''',
""
)


# Replace the giant render block from <Grid container spacing={3}> ... </Grid>
# We'll use start/end index

start_idx = c.find("<Grid container spacing={3}>")
end_idx = c.find("        {/* Mobile bottom nav spacer */}")

if start_idx != -1 and end_idx != -1:
    replacement = '''<AsyncBoundary 
          status={fetchStatus} 
          error={orderError} 
          hasData={orders.length > 0} 
          onRetry={() => dispatch(fetchOrdersThunk())}
          loadingComponent={<SkeletonGrid count={4} columns={{ xs: 12 }} />}
          emptyComponent={
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <EmptyState 
                  title="No orders found" 
                  description="Ready to order? Check out our restaurants" 
                  icon={<ShoppingBag sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />} 
                  action={{ label: 'Browse Restaurants', onClick: () => navigate('/restaurants') }} 
                />
              </Grid>
            </Grid>
          }
        >
          <Grid container spacing={3}>
            {filteredOrders.length === 0 && orders.length > 0 ? (
               <Grid item xs={12}>
                 <EmptyState title="No orders match this filter" icon={<ShoppingBag sx={{ fontSize: 80, color: 'text.secondary' }}/>} />
               </Grid>
            ) : (
            filteredOrders.map((order) => (
              <Grid item xs={12} key={order.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'visible',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => theme.shadows[4],
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" fontWeight={700}>
                            {order.restaurant?.name || 'Restaurant'}
                          </Typography>
                          <Chip
                            label={order.status.replace('_', ' ').toUpperCase()}
                            color={getStatusColor(order.status) as any}
                            size="small"
                            sx={{ fontWeight: 600, borderRadius: 2 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Order #{order.id.slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        ${order.totalAmount.toFixed(2)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      {order.items.map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            {item.quantity}x {item.name || 'Item'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ${(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        fullWidth
                        sx={{ borderRadius: 2 }}
                      >
                        View Details
                      </Button>
                      
                      {['pending_owner', 'confirmed'].includes(order.status) && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={(e) => handleCancelClick(e, order.id)}
                          disabled={isCancelling}
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          Cancel Order
                        </Button>
                      )}

                      {order.status === 'delivered' && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => navigate(`/orders/${order.id}/review`)}
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          Rate Order
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
            )}
          </Grid>
        </AsyncBoundary>
'''
    c = c[:start_idx] + replacement + c[end_idx:]

with open(path, 'w') as f:
    f.write(c)
print("Patched Orders.tsx")
