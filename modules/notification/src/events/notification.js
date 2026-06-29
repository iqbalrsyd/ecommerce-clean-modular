import { Events } from "@ecom/shared-events";

export function handleNotificationEvents(ctx) {
  ctx.bus.on(Events.ORDER_PAID, async ({ orderId, userId }) => {
    await ctx.logger.info({ event: "order.paid", orderId, userId }, "send order-paid email");
  });
  ctx.bus.on(Events.PAYMENT_FAILED, async ({ paymentIntentId }) => {
    await ctx.logger.warn({ event: "payment.failed", paymentIntentId }, "send payment-failed email");
  });
  ctx.bus.on(Events.PRODUCT_REVIEW_CREATED, async ({ productId, userId }) => {
    await ctx.logger.info({ event: "review.created", productId, userId }, "send review-received email");
  });
}
