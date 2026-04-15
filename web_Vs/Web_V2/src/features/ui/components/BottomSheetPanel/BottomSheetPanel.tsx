import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Drawer,
  Stack,
  Divider,
  type SxProps,
  type Theme,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';

export interface BottomSheetItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface BottomSheetPanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  items: BottomSheetItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  actionLabel?: string;
  onAction?: () => void;
  currencySymbol?: string;
  sx?: SxProps<Theme>;
}

const BottomSheetPanel: React.FC<BottomSheetPanelProps> = ({
  open,
  onClose,
  title = 'Your Cart',
  items,
  subtotal,
  deliveryFee,
  tax,
  total,
  actionLabel = 'Proceed to Checkout',
  onAction,
  currencySymbol = '₹',
  sx,
}) => {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          height: '80vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          ...sx,
        },
      }}
    >
      {/* Handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, pb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: 'grey.300',
            borderRadius: 2,
          }}
        />
      </Box>

      {/* Title */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart color="primary" />
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <Chip label={items.length} size="small" color="primary" />
        </Box>
      </Box>

      <Divider />

      {/* Items */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        {items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ShoppingCart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">Your cart is empty</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {items.map((item) => (
              <Box key={item.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography fontWeight={600}>
                      {item.quantity} × {item.name}
                    </Typography>
                    {item.specialInstructions && (
                      <Typography variant="caption" color="text.secondary">
                        Note: {item.specialInstructions}
                      </Typography>
                    )}
                  </Box>
                  <Typography fontWeight={600}>
                    {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Summary */}
      {items.length > 0 && (
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Item Total</Typography>
              <Typography>{currencySymbol}{subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Delivery Fee</Typography>
              <Typography>{currencySymbol}{deliveryFee}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Taxes & Charges</Typography>
              <Typography>{currencySymbol}{tax.toFixed(2)}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={700}>Total</Typography>
              <Typography variant="h6" color="primary.main" fontWeight={700}>
                {currencySymbol}{total.toFixed(2)}
              </Typography>
            </Box>
          </Stack>

          {onAction && (
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ borderRadius: 2 }}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default BottomSheetPanel;
