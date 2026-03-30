import type { FoodItem } from "../../core/types";

export const mockFoodItems: FoodItem[] =
  [
    {
      id: "f1",
      name: "Classic Margherita Pizza",
      description: "Fresh mozzarella, basil, and tomato sauce on a crispy base.",
      price: 299,
      originalPrice: 349,
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=450&fit=crop&q=80",
      category: "Pizza",
      restaurantId: "r11",
      restaurantName: "Pizza Palace",
      isVeg: true,
      isSpicy: false,
      isBestSeller: true,
      isAvailable: true,
      rating: 4.5,

      addons: [
        { id: "a1", name: "Extra Cheese", price: 50, isAvailable: true },
        { id: "a2", name: "Olives", price: 30, isAvailable: true },
      ],

      variants: [
        { id: "v1", name: "Regular", price: 299 },
        { id: "v2", name: "Medium", price: 399 },
        { id: "v3", name: "Large", price: 499 },
      ],

      ingredients: ["Flour", "Cheese", "Tomato", "Basil"],

      dietaryInfo: {
        calories: 250,
        protein: 10,
        carbs: 30,
        fat: 8,
      },
    },

    {
      id: "f2",
      name: "Chicken Burger",
      description: "Juicy grilled chicken patty with lettuce and mayo.",
      price: 199,
      image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=450&fit=crop&q=80",
      category: "Burger",
      restaurantId: "r11",
      restaurantName: "Burger Hub",
      isVeg: false,
      isSpicy: true,
      isBestSeller: true,
      isAvailable: true,
      rating: 4.3,

      addons: [
        { id: "a3", name: "Extra Patty", price: 80, isAvailable: true },
        { id: "a4", name: "Cheese Slice", price: 40, isAvailable: true },
      ],

      variants: [
        { id: "v4", name: "Single", price: 199 },
        { id: "v5", name: "Double", price: 279 },
      ],

      ingredients: ["Chicken", "Bun", "Lettuce", "Mayo"],

      dietaryInfo: {
        calories: 320,
        protein: 20,
        carbs: 25,
        fat: 15,
      },
    },

    {
      id: "f3",
      name: "Paneer Butter Masala",
      description: "Rich creamy curry with soft paneer cubes.",
      price: 249,
      image: "https://images.unsplash.com/photo-1604908176997-4318b3e0cfe6?w=800&h=450&fit=crop&q=80",
      category: "Indian",
      restaurantId: "r11",
      restaurantName: "Spice Kitchen",
      isVeg: true,
      isSpicy: false,
      isBestSeller: false,
      isAvailable: true,
      rating: 4.4,

      // addons: [
      //   { id: "a5", name: "Extra Paneer", price: 60, isAvailable: true },
      //   { id: "a6", name: "Butter Topping", price: 30, isAvailable: true },
      // ],

      // variants: [
      //   { id: "v6", name: "Half", price: 249 },
      //   { id: "v7", name: "Full", price: 399 },
      // ],

      ingredients: ["Paneer", "Tomato", "Butter", "Cream"],

      dietaryInfo: {
        calories: 400,
        protein: 18,
        carbs: 20,
        fat: 25,
      },
    },

    {
      id: "f4",
      name: "Veg Fried Rice",
      description: "Stir-fried rice with vegetables and soy sauce.",
      price: 179,
      image: "https://images.unsplash.com/photo-1512058564366-c9e3f5f93f8b?w=800&h=450&fit=crop&q=80",
      category: "Chinese",
      restaurantId: "r11",
      restaurantName: "Wok Express",
      isVeg: true,
      isSpicy: true,
      isBestSeller: false,
      isAvailable: true,
      rating: 4.2,

      // addons: [
      //   { id: "a7", name: "Extra Sauce", price: 20, isAvailable: true },
      //   { id: "a8", name: "Spring Roll", price: 50, isAvailable: true },
      // ],

      variants: [
        { id: "v8", name: "Regular", price: 179 },
        { id: "v9", name: "Large", price: 249 },
      ],

      ingredients: ["Rice", "Vegetables", "Soy Sauce"],

      dietaryInfo: {
        calories: 300,
        protein: 8,
        carbs: 50,
        fat: 10,
      },
    },

    {
      id: "f5",
      name: "Chocolate Milkshake",
      description: "Rich chocolate shake topped with whipped cream.",
      price: 149,
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&h=450&fit=crop&q=80",
      category: "Beverage",
      restaurantId: "r11",
      restaurantName: "Cool Drinks Co.",
      isVeg: true,
      isSpicy: false,
      isBestSeller: true,
      isAvailable: true,
      rating: 4.6,

      addons: [
        { id: "a9", name: "Extra Chocolate", price: 30, isAvailable: true },
        { id: "a10", name: "Ice Cream Scoop", price: 50, isAvailable: true },
      ],

      variants: [
        { id: "v10", name: "Regular", price: 149 },
        { id: "v11", name: "Large", price: 199 },
      ],

      ingredients: ["Milk", "Chocolate", "Sugar"],

      dietaryInfo: {
        calories: 350,
        protein: 6,
        carbs: 45,
        fat: 15,
      },
    },
  ];