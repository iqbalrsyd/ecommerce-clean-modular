import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [error, setError] = useState(null);

  async function submit(ev) {
    ev.preventDefault();
    setError(null);
    try {
      await register(form.email, form.password, form.displayName);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1>Create account</h1>
      <form onSubmit={submit}>
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email" />
        <input type="text" required minLength={1} maxLength={120} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="display name" />
        <input type="password" required minLength={12} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="password (12+ chars, mixed)" />
        <button type="submit">Create account</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
