import { users } from "./users";
import type { Notification } from "../types";

const notificationTypes = [
  "order",
  "offer",
  "delivery",
  "restaurant",
  "system",
] as const;

const messages = [
  "Your order has been confirmed.",
  "Your order is out for delivery.",
  "50% OFF on selected restaurants.",
  "A restaurant you follow has a new offer.",
  "System maintenance scheduled tonight.",
];

export const generateNotifications = (
  perUser = 8
): Notification[] =>
  users.flatMap((user, userIndex) =>
    Array.from({ length: perUser }).map(
      (_, i) => ({
        id: `notification-${userIndex}-${i}`,

        userId: user.id,

        type:
          notificationTypes[
            i % notificationTypes.length
          ],

        title: "Notification",

        message:
          messages[
            i % messages.length
          ],

        isRead: Math.random() > 0.5,

        createdAt: new Date(
          Date.now() -
            Math.random() *
              1000000000
        ).toISOString(),
      })
    )
  );

const notifications =
  generateNotifications();

export default notifications;