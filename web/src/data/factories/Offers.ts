import restaurants from "./restaurants";

import type { Offer } from "../types";

const offerTitles = [
  "50% OFF",
  "Buy 1 Get 1",
  "Free Delivery",
  "Flat ₹100 OFF",
];

export const generateOffers =
  (): Offer[] =>
    restaurants.flatMap(
      (restaurant, index) => ({
        id: `offer-${index}`,

        restaurantId:
          restaurant.id,

        restaurantName:
          restaurant.name,

        title:
          offerTitles[
            index %
              offerTitles.length
          ],

        description:
          "Limited period offer",

        discount:
          (index % 5 + 1) * 10,

        expiryDate: new Date(
          Date.now() +
            7 *
              24 *
              60 *
              60 *
              1000
        ).toISOString(),
      })
    );

const offers =
  generateOffers();

export default offers;