import React, { useState, useMemo } from 'react';
import { Box, Tabs, Tab, Stack } from '@mui/material';
import type { Category, CustomizedCartItem, FoodItem } from '@core/types';
import FoodItemCard from '../../../food/components/FoodItemCard';
import { EmptyState } from '../../../ui/components';
import { RestaurantMenu as RestaurantMenuIcon } from '@mui/icons-material';

export interface RestaurantMenuProps {
  categories: Category[];
  items: FoodItem[]; 
  onAddToCart: (item: FoodItem) => void;
  onAddToCartWithCustomization: (customizedItem: CustomizedCartItem) => void;
  onToggleFavorite: (foodItemId: string) => void;
  onUpdateQuantity: (foodItemId: string, quantity: number) => void;
  getItemQuantity: (foodItemId: string) => number;
}

const RestaurantMenu: React.FC<RestaurantMenuProps> = ({
  categories,
  items,
  onAddToCart,
  onAddToCartWithCustomization,
  onToggleFavorite,
  onUpdateQuantity,
  getItemQuantity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCategories = useMemo(() => {
    if (selectedCategory === 'all') {
      return categories.filter(category => 
        items.some(item => item.category.toLowerCase() === category.name.toLowerCase())
      );
    }
    return categories.filter(c => c.id === selectedCategory);
  }, [categories, items, selectedCategory]);

  return (
    <Box sx={{ mt: 4 }}>
      {/* Categories Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={(_, v) => setSelectedCategory(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" value="all" />
          {categories.map((c) => (
            <Tab key={c.id} label={c.name} value={c.id} />
          ))}
        </Tabs>
      </Box>

      {/* Menu Items */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={<RestaurantMenuIcon />}
          title="No items found"
          description="This category has no items available right now."
        />
      ) : (
        <Stack spacing={4}>
          {filteredCategories.map((category) => {
             const categoryItems = items.filter(item => item.category.toLowerCase() === category.name.toLowerCase());
             if (categoryItems.length === 0) return null;

             return (
              <Box key={category.id} id={`category-${category.id}`}>
                <Stack spacing={3}>
                  {categoryItems.map((item) => (
                    <FoodItemCard
                      key={item.id}
                      foodItem={item}
                      onAddToCart={() => onAddToCart(item)}
                      onAddToCartWithCustomization={onAddToCartWithCustomization}
                      onToggleFavorite={onToggleFavorite}
                      onUpdateQuantity={onUpdateQuantity}
                      quantity={getItemQuantity(item.id)}
                    />
                  ))}
                </Stack>
              </Box>
             );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default RestaurantMenu;
