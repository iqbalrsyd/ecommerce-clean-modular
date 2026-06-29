import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState(null);

  async function load(nextCursor = null) {
    try {
      const q = nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : "";
      const res = await api(`/order/orders${q}`);
      setOrders((prev) => [...prev, ...res.data]);
      setCursor(res.paging.nextCursor);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section>
      <h1>Orders</h1>
      {error && <p role="alert">{error}</p>}
      <ul>
        {orders.map((o) => (
          <li key={o.id}>#{o.id} — {o.status} — {(o.totalCents / 100).toFixed(2)} {o.currency}</li>
        ))}
      </ul>
      {cursor && <button onClick={() => load(cursor)}>Load more</button>}
    </section>
  );
}
