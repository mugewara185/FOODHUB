import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
// import { restaurants, menus, reviews } from "@/data/dummyData";
import { apiClient } from "@/services/http/apiClient";
import type { MenuItem, CartItem } from "@/data/types";

const LOCAL_CART_KEY = "miniZomCart";

function readCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeCart(cart: CartItem[]) {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
  // global event so other components can react
  window.dispatchEvent(new CustomEvent("cartUpdated"));
}

/**
 * Hook: encapsulate all data + cart logic + derived values for the RestaurantDetails page.
 */
export function useRestaurantDetails() {

  const { id } = useParams<{ id: string }>();
  const [cartPreview, setCartPreview] = useState<CartItem[]>(() => readCart());
  const [loading, setLoading] = useState<boolean>(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurantReviews, setRestaurantReviews] = useState<any[]>([]);

  // Fetch data from API
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch restaurant details
        const restaurantData = await apiClient.get(`/restaurants/${id}`);
        setRestaurant(restaurantData);

        // Fetch menu items for this restaurant
        const menuData = await apiClient.get(`/restaurants/${id}`);
        setItems(menuData.items || []);

        // Fetch reviews for this restaurant
        const reviewsData = await apiClient.get(`/reviews/restaurant/${id}`);
        setRestaurantReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
        // Fallback to dummy data for development
        // const restaurants = [];
        // const menus = [];
        // const reviews = [];
        // setRestaurant(restaurants.find((r) => r.id === id));
        // setItems(menus.filter((m) => m.restaurantId === id));
        // setRestaurantReviews(reviews.filter((rv) => rv.restaurantId === id));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

 //notes: sets and removes cartUpdate functinalities effeciently i.e.., reduces memory usage,
  useEffect(() => {
    const handler = () => setCartPreview(readCart());
    window.addEventListener("cartUpdated", handler);
    return () => window.removeEventListener("cartUpdated", handler);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (!id) return;
      // Fetch restaurant details
      const restaurantData = await apiClient.get(`/restaurants/${id}`);
      setRestaurant(restaurantData);

      // Fetch menu items for this restaurant
      const menuData = await apiClient.get(`/restaurants/${id}`);
      setItems(menuData.items || []);

      // Fetch reviews for this restaurant
      const reviewsData = await apiClient.get(`/reviews/restaurant/${id}`);
      setRestaurantReviews(reviewsData);
    } catch (error) {
      console.error("Error reloading restaurant data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const addToCart = useCallback((item: MenuItem) => {
    const cart = readCart();
    const found = cart.find((c) => c.id === item.id);
    if (found) {
      found.quantity += 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        quantity: 1,
        price: item.price,
        image: item.image,
      });
    }
    writeCart(cart);
    setCartPreview(cart);
  }, []);

  const cartTotal = useMemo(
    () => cartPreview.reduce((s, i) => s + i.price * i.quantity, 0),
    [cartPreview]
  );

  return {
    id,
    restaurant,
    items,
    restaurantReviews,
    cartPreview,
    cartTotal,
    addToCart,
    reload,
    loading,
  };
}

