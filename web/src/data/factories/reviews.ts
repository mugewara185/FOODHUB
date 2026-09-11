import { faker } from "@faker-js/faker";

import type { Review } from "../types";

import users from "./users";
import orders from "./orders";
import foodItems from "./foodItems";
import restaurants from "./restaurants";

const reviewTitles = [
  "Excellent Food",
  "Highly Recommended",
  "Worth Every Penny",
  "Amazing Taste",
  "Could Be Better",
  "Loved It",
  "Very Fresh",
  "Fast Delivery",
  "Will Order Again",
  "Great Experience",
];

export const generateReviews = (
  count = 100
): Review[] =>
  Array.from({ length: count }).map((_, i) => {
    const order = orders[i % orders.length];

    const user =
      users.find(
        u => u.id === order.userId
      ) ?? users[0];

    const restaurant =
      restaurants.find(
        r =>
          r.id === order.restaurantId
      ) ?? restaurants[0];

    const randomOrderItem =
      order.items[
        Math.floor(
          Math.random() *
            order.items.length
        )
      ];

    const foodItem =
      foodItems.find(
        f =>
          f.id ===
          randomOrderItem.foodItemId
      );

    const createdAt =
      faker.date.recent({
        days: 180,
      });

    return {
      id: `review-${i + 1}`,

      userId: user.id,

      userName: user.name,

      restaurantId:
        restaurant.id,

      restaurantName:
        restaurant.name,

      orderId: order.id,

      foodItemId:
        foodItem?.id,

      rating: Number(
        faker.number
          .float({
            min: 2.5,
            max: 5,
            multipleOf: 0.1,
          })
          .toFixed(1)
      ),

      title:
        reviewTitles[
          i % reviewTitles.length
        ],

      comment:
        faker.helpers.arrayElement([
          faker.lorem.sentence(),
          faker.lorem.paragraph(),
          faker.lorem.sentences(2),
        ]),

      photos:
        Math.random() > 0.8
          ? [
              faker.image.urlPicsumPhotos(),
            ]
          : [],

      helpful:
        faker.number.int({
          min: 0,
          max: 50,
        }),

      unhelpful:
        faker.number.int({
          min: 0,
          max: 10,
        }),

      createdAt:
        createdAt.toISOString(),

      updatedAt:
        createdAt.toISOString(),
    };
  });

const reviews =
  generateReviews();

export default reviews;