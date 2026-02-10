import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Divider,
  TextField,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  LocalFireDepartment,
} from '@mui/icons-material';
import { type CartItem } from '../../types/food';

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

const CartItemComponent: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const itemPrice = item.foodItem.price;
  const addonsPrice = item.selectedAddons.reduce(
    (sum, addon) => sum + addon.price,
    0
  );
  const variantPrice = item.selectedVariant?.price || 0;
  const totalItemPrice = (itemPrice + addonsPrice + variantPrice) * item.quantity;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Food Image */}
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: 2,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={item.foodItem.image}
            alt={item.foodItem.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>

        {/* Food Details */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {item.foodItem.name}
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight={700}>
              ₹{totalItemPrice}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip
              label={item.foodItem.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
              size="small"
              color={item.foodItem.isVeg ? 'success' : 'error'}
              variant="outlined"
            />
            {item.foodItem.isSpicy && (
              <Chip
                icon={<LocalFireDepartment sx={{ fontSize: 14 }} />}
                label="Spicy"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>

          {/* Selected Addons */}
          {item.selectedAddons.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Addons:{' '}
              {item.selectedAddons.map((addon) => addon.name).join(', ')}
            </Typography>
          )}

          {/* Selected Variant */}
          {item.selectedVariant && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Size: {item.selectedVariant.name}
            </Typography>
          )}

          {/* Special Instructions */}
          {item.specialInstructions && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Note: {item.specialInstructions}
            </Typography>
          )}

          {/* Quantity Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <Remove fontSize="small" />
              </IconButton>
              <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
                {item.quantity}
              </Typography>
              <IconButton
                size="small"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Box>

            <IconButton
              color="error"
              onClick={() => onRemove(item.id)}
            >
              <Delete />
            </IconButton>
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};

export default CartItemComponent;