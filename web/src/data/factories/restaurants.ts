// import type { Restaurant as type1 } from "../typess";
import type { Restaurant as type2 } from "../types";
import { restaurantNames } from "../seeds/restaurantNames";
import { cuisinesList } from "../seeds/cuisines";
import { locations } from "../seeds/locations";
import { foodImages, restaurantImages } from "../seeds/Images";
// import {restaurants, menuItems} from "../../assets';
const deliveryTimes = ["20-30 min", "30-40 min", "40-50 min"];
const tagsPool = ["Popular", "Fast Delivery", "Best Seller", "Top Rated"];

export const generateRestaurants = (count = 60): type2[] =>
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
    minOrder: Math.floor(Math.random() * 200) + 400,
    // image: `/assets/restaurants/restaurant${(i % 10) + 1}.jpg`,
    // image: `https://source.unsplash.com/600x400/?restaurant,food,${cuisinesList[i % cuisinesList.length][0]}`,
    image: foodImages[i % foodImages.length],
    // bannerImage: `/assets/restaurants/banner${(i % 10) + 1}.jpg`,
    // bannerImage: `https://source.unsplash.com/1200x400/?restaurant,food`,
    bannerImage: restaurantImages[i % restaurantImages.length],
    address: locations[i % locations.length],
    isOpen: Math.random() > 0.2,
    isFeatured: Math.random() > 0.7,
    tags: [
      tagsPool[i % tagsPool.length],
      cuisinesList[i % cuisinesList.length][0],
    ],
    //missedout fields
     location: {
        lat: 12.9716 + (Math.random() - 0.5) * 0.1, // Sample lat offset
        lng: 77.5946 + (Math.random() - 0.5) * 0.1  // Sample lng offset
      },
      contact: {
        phone: `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`,
        email: `info@${restaurantNames[i % restaurantNames.length].toLowerCase().replace(/\s/g, '')}.com`
      },
      openingHours: [
        { day: "Monday - Friday", open: "09:00 AM", close: "11:00 PM" },
        { day: "Saturday - Sunday", open: "10:00 AM", close: "11:59 PM" }
      ]
  }));

const getRestaurants = generateRestaurants();

export default getRestaurants;

//make core/type default here