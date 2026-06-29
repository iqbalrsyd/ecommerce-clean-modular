/* Use textContent only — never set innerHTML. */
export default function ProductCard({ product }) {
  return (
    <article>
      <h2>{product.name}</h2>
      <p>{product.description}</p>
    </article>
  );
}
