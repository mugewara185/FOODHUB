import { users } from "./users";
import restaurants from "./restaurants";
import foodItems from "./foodItems";

import type { Favorite } from "../types";

export const generateFavorites = () =>
  users.flatMap((user, userIndex) => [
    {
      id: `fav-r-${userIndex}`,

      userId: user.id,

      restaurantId:
        restaurants[
          userIndex %
            restaurants.length
        ].id,

      createdAt:
        new Date().toISOString(),
    },

    {
      id: `fav-f-${userIndex}`,

      userId: user.id,

      foodItemId:
        foodItems[
          userIndex %
            foodItems.length
        ].id,

      createdAt:
        new Date().toISOString(),
    },
  ]);

const favorites =
  generateFavorites();

export default favorites;