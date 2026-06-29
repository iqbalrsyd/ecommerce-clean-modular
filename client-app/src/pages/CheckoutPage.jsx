import { useState } from "react";
import { api } from "../api/client.js";

export default function CheckoutPage() {
  const [shipping, setShipping] = useState({
    line1: "", line2: "", city: "", region: "", postalCode: "", country: "US",
  });
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  async function submit(ev) {
    ev.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const order = await api("/checkout/orders", {
        method: "POST",
        body: { ...shipping, paymentMethodId, idempotencyKey: crypto.randomUUID() },
      });
      const intent = await api("/payment/payments/intents", {
        method: "POST",
        body: { orderId: order.data.orderId, idempotencyKey: crypto.randomUUID() },
      });
      setStatus({ orderId: order.data.orderId, paymentIntentId: intent.data.paymentIntentId });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1>Checkout</h1>
      <form onSubmit={submit}>
        <input placeholder="Address line 1" required value={shipping.line1} onChange={(e) => setShipping({ ...shipping, line1: e.target.value })} />
        <input placeholder="City" required value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
        <input placeholder="Region" required value={shipping.region} onChange={(e) => setShipping({ ...shipping, region: e.target.value })} />
        <input placeholder="Postal code" required value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} />
        <input placeholder="Country (ISO-2)" required value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} />
        <input placeholder="Payment method id" required value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} />
        <button type="submit" disabled={status === "submitting"}>Place order</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {status && typeof status === "object" && (
        <p>Order {status.orderId} created. Payment intent {status.paymentIntentId}.</p>
      )}
    </section>
  );
}
