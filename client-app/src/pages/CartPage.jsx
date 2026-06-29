import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.jsx";

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    api("/cart/carts", { method: "POST" })
      .then((res) => setCart(res.data))
      .catch((err) => setError(err.message));
  }, [user]);

  if (!user) return <p>Please log in to view your cart.</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!cart) return <p>Loading…</p>;

  return (
    <section>
      <h1>Cart #{cart.id}</h1>
      <ul>
        {cart.items.map((it) => (
          <li key={it.productId}>Product {it.productId} × {it.quantity}</li>
        ))}
      </ul>
      <button onClick={() => navigate("/checkout")}>Checkout</button>
    </section>
  );
}
