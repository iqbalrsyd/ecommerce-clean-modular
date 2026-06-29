import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/catalog/products", { method: "GET" })
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <h1>Shop</h1>
      {error && <p role="alert">{error}</p>}
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            <Link to={`/products/${p.id}`}>{p.name}</Link>
            <span> — {(p.priceCents / 100).toFixed(2)} {p.currency}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
