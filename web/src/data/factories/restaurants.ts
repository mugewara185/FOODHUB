import type { Restaurant } from "../types";
import { restaurantNames } from "../seeds/restaurantNames";
import { cuisinesList } from "../seeds/cuisines";
import { locations } from "../seeds/locations";
import { foodImages, restaurantImages } from "../seeds/Images";
// import {restaurants, menuItems} from "../../assets';
const deliveryTimes = ["20-30 min", "30-40 min", "40-50 min"];
const tagsPool = ["Popular", "Fast Delivery", "Best Seller", "Top Rated"];

export const generateRestaurants = (count = 60): Restaurant[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: `r${i + 1}`,
    name: restaurantNames[i % restaurantNames.length],
    description: `Delicious ${cuisinesList[i % cuisinesList.length].join(
      ", "
    )} food with fresh ingredients.`,
    cuisine: cuisinesList[i % cuisinesList.length],
    rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
    deliveryTime: deliveryTimes[i % deliveryTimes.length],
    deliveryFee: Math.floor(Math.random() * 50) + 20,
    minOrder: Math.floor(Math.random() * 200) + 100,
    // image: `/assets/restaurants/restaurant${(i % 10) + 1}.jpg`,
    // bannerImage: `/assets/restaurants/banner${(i % 10) + 1}.jpg`,
    // image: `https://source.unsplash.com/600x400/?restaurant,food,${cuisinesList[i % cuisinesList.length][0]}`,
    // bannerImage: `https://source.unsplash.com/1200x400/?restaurant,food`,
    image: foodImages[i % foodImages.length],
    bannerImage: restaurantImages[i % restaurantImages.length],
    address: locations[i % locations.length],
    isOpen: Math.random() > 0.2,
    isFeatured: Math.random() > 0.7,
    tags: [
      tagsPool[i % tagsPool.length],
      cuisinesList[i % cuisinesList.length][0],
    ],
  }));

const getRestaurants = generateRestaurants();

export default getRestaurants;