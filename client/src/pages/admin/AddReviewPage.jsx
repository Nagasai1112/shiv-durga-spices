import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { field } from "./field";

export function AddReviewPage() {
  const navigate = useNavigate();
  const [quote, setQuote] = useState("");
  const [label, setLabel] = useState("Verified customer");
  const [stars, setStars] = useState(5);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Add a review · Admin";
  }, []);

  async function create(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/admin/reviews", {
        method: "POST",
        body: JSON.stringify({ quote, label, stars: Number(stars) }),
      });
      navigate("/admin/reviews", { state: { notice: "Review added. You can attach the WhatsApp screenshot on this page." } });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1 className="font-serif text-5xl">Add a review</h1>
      <p className="mt-3 max-w-xl text-ink/75">Add the customer’s words and stars. After it is saved, open Reviews to attach the WhatsApp screenshot.</p>
      <form onSubmit={create} className="mt-6 rounded-[2rem] border border-line bg-card p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            Customer’s words
            <textarea value={quote} onChange={(event) => setQuote(event.target.value)} rows="3" className={field} required />
          </label>
          <label className="text-sm">
            Label
            <input value={label} onChange={(event) => setLabel(event.target.value)} className={field} />
          </label>
          <label className="text-sm">
            Stars
            <select value={stars} onChange={(event) => setStars(Number(event.target.value))} className={field}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
        <button type="submit" className="mt-4 rounded-full bg-saffron px-4 py-2 text-sm font-medium text-white">
          Add review
        </button>
      </form>
    </section>
  );
}
