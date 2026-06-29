import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);

  async function submit(ev) {
    ev.preventDefault();
    setError(null);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1>Log in</h1>
      <form onSubmit={submit}>
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email" />
        <input type="password" required minLength={1} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="password" />
        <button type="submit">Log in</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
