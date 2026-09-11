import { users } from "./users";

import type { Address } from "../types";

const labels = [
  "Home",
  "Work",
  "Other",
];

export const generateAddresses = () =>
  users.flatMap(
    (user, userIndex) =>
      Array.from({ length: 2 }).map(
        (_, i) => ({
          id: `address-${userIndex}-${i}`,

          userId: user.id,

          label:
            labels[
              i % labels.length
            ],

          address: `${100 + i}
            Main Street`,

          city: "Chennai",

          state: "Tamil Nadu",

          pincode: `6000${i}`,

          isDefault: i === 0,
        })
      )
  );

const addresses =
  generateAddresses();

export default addresses;