import type {
  FoodItem,
  Restaurant,
} from "../types";

import restaurants from "./restaurants";

import {
  foodImages,
} from "../seeds/Images";

const foodNames = [
  "Chicken Burger",
  "Veg Burger",
  "Margherita Pizza",
  "Pepperoni Pizza",
  "Paneer Butter Masala",
  "Chicken Biryani",
  "Hakka Noodles",
  "Fried Rice",
  "Tandoori Chicken",
  "Pasta Alfredo",
  "Ice Cream Sundae",
  "Chocolate Shake",
];

const categories = [
  "Burger",
  "Pizza",
  "Indian",
  "Chinese",
  "Dessert",
  "Beverage",
];

const ingredientsPool = [
  "Cheese",
  "Chicken",
  "Paneer",
  "Tomato",
  "Onion",
  "Garlic",
  "Butter",
  "Cream",
  "Spices",
  "Capsicum",
];

export const generateFoodItems = (
  restaurantData: Restaurant[],
  itemsPerRestaurant = 8
): FoodItem[] =>
  restaurantData.flatMap(
    (restaurant, restaurantIndex) =>
      Array.from({
        length: itemsPerRestaurant,
      }).map((_, itemIndex) => {
        const globalIndex =
          restaurantIndex *
          itemsPerRestaurant +
          itemIndex;

        const basePrice =
          Math.floor(
            Math.random() * 300
          ) + 120;

        return {
          id: `f${globalIndex + 1}`,

          restaurantId:
            restaurant.id,

          restaurantName:
            restaurant.name,

          name: `${foodNames[
            globalIndex %
            foodNames.length
            ]
            } Special`,

          description: `Freshly prepared ${foodNames[
            globalIndex %
            foodNames.length
            ]
            } with premium ingredients and authentic flavors.`,

          category:
            categories[
            globalIndex %
            categories.length
            ],

          cuisine:
            restaurant.cuisine,

          price: basePrice,

          originalPrice:
            Math.random() > 0.5
              ? basePrice + 80
              : undefined,

          image:
            foodImages[
            globalIndex %
            foodImages.length
            ],

          rating: parseFloat(
            (
              Math.random() * 2 +
              3
            ).toFixed(1)
          ),

          isVeg:
            Math.random() > 0.5,

          isSpicy:
            Math.random() > 0.6,

          isBestSeller:
            Math.random() > 0.75,

          isAvailable:
            Math.random() > 0.1,

          preparationTime: `${Math.floor(
            Math.random() * 20
          ) + 10
            } min`,

          ingredients:
            ingredientsPool
              .sort(
                () =>
                  0.5 -
                  Math.random()
              )
              .slice(0, 5),

          addons: [
            {
              id: `addon-${globalIndex}-1`,
              name: "Extra Cheese",
              price: 40,
              isAvailable: true,
            },
            {
              id: `addon-${globalIndex}-2`,
              name: "Coke",
              price: 60,
              isAvailable: true,
            },
          ],

          variants: [
            {
              id: `variant-${globalIndex}-1`,
              name: "Regular",
              price: basePrice,
            },
            {
              id: `variant-${globalIndex}-2`,
              name: "Medium",
              price:
                basePrice + 80,
            },
            {
              id: `variant-${globalIndex}-3`,
              name: "Large",
              price:
                basePrice + 160,
            },
          ],

          dietaryInfo: {
            calories:
              Math.floor(
                Math.random() * 600
              ) + 200,

            protein:
              Math.floor(
                Math.random() * 40
              ) + 10,

            carbs:
              Math.floor(
                Math.random() * 100
              ) + 20,

            fat:
              Math.floor(
                Math.random() * 40
              ) + 5,
          },
        };
      })
  );

const foodItems =
  generateFoodItems(
    restaurants,
    80
  );
// console.log("%cGenerated food items:", "color: #7f15ad;", foodItems);
export default foodItems;
