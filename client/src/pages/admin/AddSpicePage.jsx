import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useCatalog } from "../../catalog";
import { field } from "./field";
import { PackPrices } from "./PackPrices";

export function AddSpicePage() {
  const navigate = useNavigate();
  const { reload } = useCatalog();
  const blank = {
    name: "",
    category: "Whole",
    description: "",
    prices: { 100: "", 250: "", 500: "", 1000: "" },
    costPerKg: "",
    inStock: true,
    bestSeller: false,
  };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Add a spice · Admin";
  }, []);

  async function create(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          prices: {
            100: Number(form.prices[100]),
            250: Number(form.prices[250]),
            500: Number(form.prices[500]),
            1000: Number(form.prices[1000]),
          },
          costPerKg: form.costPerKg === "" ? 0 : Number(form.costPerKg),
        }),
      });
      await reload();
      navigate("/admin/spices", { state: { notice: `${form.name} was added to the shop.` } });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1 className="font-serif text-5xl">Add a spice</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        This page only adds a new spice. Set the selling price of each pack, and the buying price you paid today. To change one that is already in the shop, open Spices.
      </p>
      <form onSubmit={create} className="mt-6 rounded-[2rem] border border-line bg-card p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={field} required />
          </label>
          <label className="text-sm">
            Category
            <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={field} />
          </label>
          <label className="text-sm md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows="2"
              placeholder="One line customers see under the spice name."
              className={field}
            />
          </label>
          <label className="flex items-end gap-2 pb-3 text-sm">
            <input
              type="checkbox"
              checked={form.bestSeller}
              onChange={(event) => setForm({ ...form, bestSeller: event.target.checked })}
            />
            Show in Our Best Sellers
          </label>
          <PackPrices
            prices={form.prices}
            costPerKg={form.costPerKg}
            onChange={(grams, value) => setForm({ ...form, prices: { ...form.prices, [grams]: value } })}
            onCost={(value) => setForm({ ...form, costPerKg: value })}
          />
        </div>
        {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
        <button type="submit" className="mt-4 rounded-full bg-saffron px-4 py-2 text-sm font-medium text-white">
          Add spice
        </button>
      </form>
    </section>
  );
}
