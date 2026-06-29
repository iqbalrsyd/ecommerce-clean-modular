import { buildCheckoutRouter } from "./routes/checkout.js";
import { computeTotals, createOrderFromCart } from "./domain/checkout.js";

export default function checkoutModule(ctx) {
  return {
    name: "checkout",
    version: "1.0.0",
    services: {
      computeTotals,
      createOrderFromCart: (params) => createOrderFromCart(params, ctx),
    },
    emits: ["order.created"],
    listens: ["payment.succeeded", "payment.failed"],
    routes: () => buildCheckoutRouter(ctx),
  };
}
