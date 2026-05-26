import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
  fetchRestaurantById,
  selectSelectedRestaurant,
  selectMenuCategories,
  selectRestaurantLoading,
  selectRestaurantError,
  toggleFavorite,
  selectFavorites,
} from '../restaurantSlice';
import {
  addToCart,
  selectCartItems,
  selectCartRestaurant,
  selectIsCartEmpty,
  selectCartTotals,
  updateQuantity,
  clearCart,
} from '../../cart/cartSlice';
import { showToast, selectCartDrawerOpen } from '../../ui/uiSlice';
import type { CustomizedCartItem, FoodItem } from '@core/types';

const calculateCustomizationPrice = (customizedItem: CustomizedCartItem) => {
  // console.log('calculateCustomizationPrice:', { customizedItem });
  const addons = customizedItem.selectedAddons as Array<{ price?: number }> | undefined;
  const addonTotal = addons?.reduce((sum, addon) => sum + (addon.price ?? 0), 0) ?? 0;
  const variantTotal = customizedItem.selectedVariant?.price ?? 0;
  // return customizedItem.foodItem.price + addonTotal + variantTotal;
  return addonTotal + variantTotal;
};

const buildCustomizedItemName = (customizedItem: CustomizedCartItem) => {
  const label = customizedItem.foodItem.name;
  const variantLabel = customizedItem.selectedVariant?.name;
  return variantLabel ? `${label} (${variantLabel})` : label;
};

export function useRestaurantLogic(id?: string) {
  // const ref= React.useRef(0);
  // console.log('%cuseRestauratnLogic:hook()','color:red',ref.current++,':',id)
  // ref.current++
  const dispatch = useAppDispatch();

  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const SelectedRestaurant = useAppSelector(selectSelectedRestaurant);
  const categories = useAppSelector(selectMenuCategories);
  const items = useAppSelector((state) => state.restaurants.menuItems);
  const loading = useAppSelector(selectRestaurantLoading);
  const error = useAppSelector(selectRestaurantError);
  const favorites = useAppSelector(selectFavorites);

  const cartItems = useAppSelector(selectCartItems);
  const cartRestaurant = useAppSelector(selectCartRestaurant);
  const isCartEmpty = useAppSelector(selectIsCartEmpty);
  const cartTotals = useAppSelector(selectCartTotals);
  const isCartDrawerOpen = useAppSelector(selectCartDrawerOpen);

  const isRestaurantFavorite = useMemo(
    () => Boolean(SelectedRestaurant && favorites.includes(SelectedRestaurant.id)),
    [favorites, SelectedRestaurant]
  );

  const cartItemQuantities = useMemo(() => {
    return cartItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.foodItemId] = (acc[item.foodItemId] ?? 0) + item.quantity;
      return acc;
    }, {});
  }, [cartItems]);

  const getItemQuantity = useCallback(
    (foodItemId: string) => cartItemQuantities[foodItemId] ?? 0,
    [cartItemQuantities]
  );

  const isCartRestaurantMismatch = useMemo(
    () => !isCartEmpty && Boolean(SelectedRestaurant?.id && cartRestaurant.id && cartRestaurant.id !== SelectedRestaurant.id),
    [cartRestaurant.id, isCartEmpty, SelectedRestaurant]
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchRestaurantById(id));
    }
  }, [id, dispatch]);

  const handleAddToCart = useCallback(
    (foodItem: FoodItem, quantity = 1) => {
      if (!foodItem.isAvailable) {
        dispatch(showToast({ message: 'This item is currently unavailable.', type: 'warning' }));
        return;
      }

      if (!SelectedRestaurant) {
        dispatch(showToast({ message: 'Unable to add item: Restaurant not loaded.', type: 'error' }));
        return;
      }

      if (isCartRestaurantMismatch) {
        const confirmed = window.confirm(
          'Your cart contains items from a different Restaurant. Do you want to clear it and add this item?'
        );

        if (!confirmed) {
          return;
        }

        dispatch(clearCart());
      }

      if (foodItem.addons?.length || foodItem.variants?.length) {
        setSelectedFoodItem(foodItem);
        setModalOpen(true);
        return;
      }

      dispatch(
        addToCart({
          foodItemId: foodItem.id,
          name: foodItem.name,
          price: foodItem.price,
          quantity,
          image: foodItem.image,
          restaurantId: SelectedRestaurant.id,
          restaurantName: SelectedRestaurant.name,
          isVeg: foodItem.isVeg,
        })
      );

      dispatch(showToast({ message: `${foodItem.name} added to cart`, type: 'success' }));
    },
    [dispatch, isCartRestaurantMismatch, SelectedRestaurant]
  );

  const handleAddCustomizedItem = useCallback(
    (customizedItem: CustomizedCartItem) => {
      if (!SelectedRestaurant) {
        dispatch(showToast({ message: 'Unable to add customized item: SelectedRestaurant not loaded.', type: 'error' }));
        return;
      }

      const price = calculateCustomizationPrice(customizedItem);
      const name = buildCustomizedItemName(customizedItem);

      dispatch(
        addToCart({
          foodItemId: customizedItem.foodItem.id,
          name,
          price,
          quantity: customizedItem.quantity,
          image: customizedItem.foodItem.image,
          restaurantId: SelectedRestaurant.id,
          restaurantName: SelectedRestaurant.name,
          isVeg: customizedItem.foodItem.isVeg,
          specialInstructions: customizedItem.specialInstructions,
          addons: customizedItem.selectedAddons,
        })
      );

      setSelectedFoodItem(null);
      setModalOpen(false);

      dispatch(
        showToast({
          message: `${customizedItem.quantity}x ${customizedItem.foodItem.name} added to cart`,
          type: 'success',
        })
      );
    },
    [dispatch, SelectedRestaurant]
  );

  const handleToggleFavorite = useCallback(
    (targetId?: string) => {
      // console.log('clicked handleToggleFavorite-->')
      // const restaurantId = SelectedRestaurant?.id || targetId;
      const restaurantId = SelectedRestaurant?.id ;
      const shouldToggleRestaurantFavorite = !targetId || targetId === restaurantId;
      console.log({restaurantId, shouldToggleRestaurantFavorite})
      if (!restaurantId) {
        dispatch(showToast({ message: 'Please load a SelectedRestaurant before toggling favorites.', type: 'info' }));
        return;
      }

      if (!shouldToggleRestaurantFavorite) {
        dispatch(
          showToast({
            message: 'Item favorites are not yet persisted. SelectedRestaurant favorites are supported for now.',
            type: 'info',
          })
        );
        return;
      }
      // console.log("dispatch toggel fav")
      dispatch(toggleFavorite(restaurantId));
      dispatch(
        showToast({
          message: isRestaurantFavorite ? 'Removed SelectedRestaurant from favorites' : 'Added SelectedRestaurant to favorites',
          type: 'success',
        })
      );
    },
    [dispatch, isRestaurantFavorite, SelectedRestaurant]
  );

  const handleUpdateQuantity = useCallback(
    (foodItemId: string, quantity: number) => {
      const existingCartItem = cartItems.find((ci) => ci.foodItemId === foodItemId);
      if (!existingCartItem) return;
      dispatch(updateQuantity({ itemId: existingCartItem.id, quantity }));
    },
    [cartItems, dispatch]
  );

  const closeCustomizationModal = useCallback(() => {
    setModalOpen(false);
    setSelectedFoodItem(null);
  }, []);

  return {
    SelectedRestaurant,
    categories,
    items,
    loading,
    error,
    cartItems,
    cartTotals,
    isFavorite: isRestaurantFavorite,
    modalOpen,
    selectedFoodItem,
    isCartDrawerOpen,
    isCartRestaurantMismatch,
    getItemQuantity,
    handleAddToCart,
    handleAddCustomizedItem,
    handleToggleFavorite,
    handleUpdateQuantity,
    setModalOpen,
    closeCustomizationModal,
  };
}
