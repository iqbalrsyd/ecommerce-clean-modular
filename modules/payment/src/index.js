import { buildPaymentRouter } from "./routes/payment.js";
import { createPaymentIntentForOrder } from "./domain/payment.js";

export default function paymentModule(ctx) {
  return {
    name: "payment",
    version: "1.0.0",
    services: {
      createPaymentIntentForOrder: (params) => createPaymentIntentForOrder(params, ctx),
    },
    emits: ["payment.succeeded", "payment.failed"],
    listens: ["order.created"],
    routes: () => buildPaymentRouter(ctx),
  };
}
