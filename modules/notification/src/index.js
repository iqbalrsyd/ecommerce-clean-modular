import { handleNotificationEvents } from "./events/notification.js";

export default function notificationModule(ctx) {
  handleNotificationEvents(ctx);
  return {
    name: "notification",
    version: "1.0.0",
    services: {},
    emits: [],
    listens: ["order.paid", "payment.failed", "product.review.created"],
    routes: () => null,
  };
}
