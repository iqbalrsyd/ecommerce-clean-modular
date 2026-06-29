import { buildCartRouter } from "./routes/cart.js";
import * as cartDomain from "./domain/cart.js";

export default function cartModule(ctx) {
  return {
    name: "cart",
    version: "1.0.0",
    services: {
      getCartForUser: (cartId, userId) => cartDomain.getCartForUser(cartId, userId, ctx),
    },
    emits: ["cart.created", "cart.updated"],
    listens: ["order.paid"],
    routes: () => buildCartRouter(ctx),
  };
}
