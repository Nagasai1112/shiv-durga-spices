import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { field } from "./admin/field";

export function SignIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Sign in · Shivdurga Kerala Spices";
    api("/api/auth/me")
      .then(() => navigate("/admin", { replace: true }))
      .catch(() => {});
  }, [navigate]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <form onSubmit={submit} className="rounded-[2rem] border border-line bg-card p-8">
        <p className="text-xs tracking-[0.18em] text-saffron uppercase">Shop admin</p>
        <h1 className="mt-2 font-serif text-4xl">Sign in</h1>
        <p className="mt-2 text-sm text-ink/70">Use this to change rates, photos, and reviews. Customers do not need it.</p>
        <label className="mt-5 block text-sm">
          Sign-in name
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className={field} />
        </label>
        <label className="mt-3 block text-sm">
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className={field} />
        </label>
        {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
        <button type="submit" className="mt-5 w-full rounded-full bg-ink px-4 py-3 text-sm font-medium text-cream">
          Sign in
        </button>
      </form>
    </main>
  );
}
