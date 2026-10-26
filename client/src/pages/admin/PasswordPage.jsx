import { useEffect, useState } from "react";
import { api } from "../../api";
import { field } from "./field";

export function PasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Password · Admin";
  }, []);

  async function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api("/api/admin/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1 className="font-serif text-5xl">Change the admin password</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        Choose a new password before the website is public. Next time, open /sign-in. The sign-in name is admin.
      </p>
      <form onSubmit={save} className="mt-6 rounded-[2rem] border border-line bg-card p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Current password
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={field} />
          </label>
          <label className="text-sm">
            New password
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={field} />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
        {message && <p className="mt-3 text-sm text-leaf">{message}</p>}
        <button type="submit" className="mt-4 rounded-full border border-line px-4 py-2 text-sm">
          Update password
        </button>
      </form>
    </section>
  );
}
