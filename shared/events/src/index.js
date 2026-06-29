import { EventEmitter } from "node:events";

class EventBus {
  constructor() {
    this.emitter = new EventEmitter({ captureRejections: true });
    this.emitter.on("error", (err) => {
      // Never let a misbehaving listener crash the process
      console.error("[event-bus] listener error:", err);
    });
  }

  on(event, handler) {
    this.emitter.on(event, async (payload) => {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[event-bus] handler for ${event} failed:`, err);
      }
    });
    return this;
  }

  async emit(event, payload) {
    await this.emitter.emitAsync(event, payload);
  }

  removeAll(event) {
    if (event) this.emitter.removeAllListeners(event);
    else this.emitter.removeAllListeners();
  }
}

export const bus = new EventBus();

export const Events = Object.freeze({
  CART_CREATED: "cart.created",
  CART_UPDATED: "cart.updated",
  ORDER_CREATED: "order.created",
  ORDER_PAID: "order.paid",
  ORDER_SHIPPED: "order.shipped",
  PAYMENT_SUCCEEDED: "payment.succeeded",
  PAYMENT_FAILED: "payment.failed",
  USER_REGISTERED: "user.registered",
  USER_LOGGED_IN: "user.logged_in",
  PRODUCT_REVIEW_CREATED: "product.review.created",
  NOTIFICATION_SEND: "notification.send",
});
