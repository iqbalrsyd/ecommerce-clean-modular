import { buildOrderRouter } from "./routes/order.js";
import { listOrdersForUser } from "./domain/order.js";

export default function orderModule(ctx) {
  return {
    name: "order",
    version: "1.0.0",
    services: {
      listOrdersForUser: (params) => listOrdersForUser(params, ctx),
    },
    emits: [],
    listens: ["payment.succeeded", "order.shipped"],
    routes: () => buildOrderRouter(ctx),
  };
}
