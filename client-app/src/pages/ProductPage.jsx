import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.jsx";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviewBody, setReviewBody] = useState({ rating: 5, title: "", body: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    api(`/catalog/products/${id}`).then((res) => setProduct(res.data)).catch((err) => setError(err.message));
  }, [id]);

  async function submitReview(ev) {
    ev.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api(`/catalog/products/${id}/reviews`, { method: "POST", body: reviewBody });
      setReviewBody({ rating: 5, title: "", body: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!product) return <p>Loading…</p>;
  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>{(product.priceCents / 100).toFixed(2)} {product.currency}</p>
      {user ? (
        <form onSubmit={submitReview}>
          <label>Rating <input type="number" min="1" max="5" value={reviewBody.rating} onChange={(e) => setReviewBody({ ...reviewBody, rating: Number(e.target.value) })} required /></label>
          <label>Title <input value={reviewBody.title} onChange={(e) => setReviewBody({ ...reviewBody, title: e.target.value })} required maxLength={120} /></label>
          <label>Body <textarea value={reviewBody.body} onChange={(e) => setReviewBody({ ...reviewBody, body: e.target.value })} required maxLength={2000} /></label>
          <button type="submit" disabled={submitting}>Post review</button>
        </form>
      ) : (
        <p>Please log in to write a review.</p>
      )}
      {error && <p role="alert">{error}</p>}
    </article>
  );
}
