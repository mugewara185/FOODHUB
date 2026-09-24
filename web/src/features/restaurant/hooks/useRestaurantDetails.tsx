import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
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
  const [mockData, setMockData] = useState<{ restaurants: any[], menus: any[], reviews: any[] } | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      import("@/data/dummyData").then((m) => {
        setMockData({ restaurants: m.restaurants, menus: m.menus, reviews: m.reviews });
      });
    }
  }, []);

  // Derived domain data from dummyData (swap out with API later)
  const restaurant = useMemo(() => mockData?.restaurants.find((r) => r.id === id), [id, mockData]);
  const items = useMemo(() => mockData?.menus.filter((m) => m.restaurantId === id) || [], [id, mockData]);
  const restaurantReviews = useMemo(() => mockData?.reviews.filter((rv) => rv.restaurantId === id) || [], [id, mockData]);

 //notes: sets and removes cartUpdate functinalities effeciently i.e.., reduces memory usage, 
  useEffect(() => {
    const handler = () => setCartPreview(readCart());
    window.addEventListener("cartUpdated", handler);
    return () => window.removeEventListener("cartUpdated", handler);
  }, []);

  // Simple simulated load function - useful if you later swap to async API.
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      // placeholder for future API call(s)
      // await someFetch(...)
    } finally {
      setLoading(false);
    }
  }, []);

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
