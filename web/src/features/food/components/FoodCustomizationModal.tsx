import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Add,
  Remove,
  Close,
  LocalFireDepartment,
} from '@mui/icons-material';
import { type FoodItem, type Addon, type Variant } from '../../../data/types/food';

interface FoodCustomizationModalProps {
  open: boolean;
  foodItem: FoodItem;
  onClose: () => void;
  onAddToCart: (customizedItem: {
    foodItem: FoodItem;
    quantity: number;
    selectedAddons: Addon[];
    selectedVariant?: Variant;
    specialInstructions?: string;
  }) => void;
}

const FoodCustomizationModal: React.FC<FoodCustomizationModalProps> = ({
  open,
  foodItem,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    foodItem.variants?.[0]
  );
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Calculate total price
  const calculateTotal = () => {
    const variantPrice = selectedVariant?.price || foodItem.price;
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return (variantPrice + addonsPrice) * quantity;
  };

  // Handle addon selection
  const handleAddonToggle = (addon: Addon) => {
    setSelectedAddons(prev => {
      const isSelected = prev.some(a => a.id === addon.id);
      if (isSelected) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  // Handle add to cart
  const handleAdd = () => {
    onAddToCart({
      foodItem,
      quantity,
      selectedAddons,
      selectedVariant,
      specialInstructions: specialInstructions.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            Customize {foodItem.name}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Food Image and Basic Info */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              height: 200,
              borderRadius: 2,
              overflow: 'hidden',
              mb: 2,
            }}
          >
            <img
              src={foodItem.image}
              alt={foodItem.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              {foodItem.name}
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight={700}>
              ₹{calculateTotal()}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {foodItem.description}
          </Typography>

          {/* Tags */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label={foodItem.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
              size="small"
              color={foodItem.isVeg ? 'success' : 'error'}
            />
            {foodItem.isSpicy && (
              <Chip
                icon={<LocalFireDepartment sx={{ fontSize: 14 }} />}
                label="Spicy"
                size="small"
                color="warning"
              />
            )}
            <Typography variant="caption" color="text.secondary">
              {foodItem.dietaryInfo.calories} cal
            </Typography>
          </Stack>
        </Box>

        {/* Variants Selection */}
        {foodItem.variants && foodItem.variants.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Choose Size
            </Typography>
            <RadioGroup
              value={selectedVariant?.id}
              onChange={(e) => {
                const variant = foodItem.variants?.find(v => v.id === e.target.value);
                setSelectedVariant(variant);
              }}
            >
              {foodItem.variants.map((variant) => (
                <FormControlLabel
                  key={variant.id}
                  value={variant.id}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>{variant.name}</Typography>
                      <Typography fontWeight={600}>₹{variant.price}</Typography>
                    </Box>
                  }
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    mx: 0,
                    px: 2,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                />
              ))}
            </RadioGroup>
          </Box>
        )}

        {/* Addons Selection */}
        {foodItem.addons && foodItem.addons.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Add Extra (Optional)
            </Typography>
            <Stack spacing={1}>
              {foodItem.addons.map((addon) => (
                <Box
                  key={addon.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.5,
                    border: 1,
                    borderColor: selectedAddons.some(a => a.id === addon.id)
                      ? 'primary.main'
                      : 'divider',
                    borderRadius: 1,
                    bgcolor: selectedAddons.some(a => a.id === addon.id)
                      ? 'primary.light'
                      : 'transparent',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                  onClick={() => handleAddonToggle(addon)}
                >
                  <Box>
                    <Typography fontWeight={500}>{addon.name}</Typography>
                    {!addon.isAvailable && (
                      <Typography variant="caption" color="error">
                        Not Available
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight={600}>₹{addon.price}</Typography>
                    <Checkbox
                      checked={selectedAddons.some(a => a.id === addon.id)}
                      color="primary"
                      disabled={!addon.isAvailable}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Special Instructions */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Special Instructions
          </Typography>
          <TextField
            placeholder="Any specific requests? (e.g., less spicy, no onions)"
            multiline
            rows={3}
            fullWidth
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
          />
        </Box>

        {/* Quantity Selector */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Quantity
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              size="small"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Remove />
            </IconButton>
            <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
              {quantity}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Add />
            </IconButton>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleAdd}
          sx={{ borderRadius: 2 }}
        >
          Add to Cart • ₹{calculateTotal()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FoodCustomizationModal;