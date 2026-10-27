import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { ConfirmModal } from "../../components/ConfirmModal";
import { phoneLabel, rupees } from "../../format";

const PAGE_SIZE = 10;

const columns = [
  { key: "code", label: "Order code" },
  { key: "confirmedAt", label: "Added" },
  { key: "createdAt", label: "Placed" },
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "door", label: "Door" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "district", label: "District" },
  { key: "pin", label: "PIN" },
  { key: "landmark", label: "Landmark" },
  { key: "note", label: "Note" },
  { key: "items", label: "Spices" },
  { key: "spiceTotal", label: "Spice total" },
  { key: "offer", label: "Offer" },
  { key: "deliveryCharge", label: "Delivery" },
  { key: "total", label: "Total" },
];

function when(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function spiceLine(order) {
  return order.items.map((item) => `${item.name}, ${item.label} × ${item.qty}`).join("; ");
}

function spicePreview(order) {
  const items = order.items || [];
  if (!items.length) return "—";
  const first = `${items[0].name}, ${items[0].label} × ${items[0].qty}`;
  if (items.length === 1) return first;
  return `${first}, +${items.length - 1}`;
}

function offerLine(order) {
  if (!order.discount) return "";
  return `${order.offerTitle} ${order.offerPercent}% (−${rupees(order.discount)})`;
}

function sortValue(order, key) {
  if (key === "items") return spiceLine(order);
  if (key === "offer") return offerLine(order);
  if (key === "confirmedAt" || key === "createdAt") return order[key] || "";
  return order[key] ?? "";
}

function compare(left, right, key) {
  const a = sortValue(left, key);
  const b = sortValue(right, key);
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "en", { numeric: true, sensitivity: "base" });
}

export function OrdersPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("confirmedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [pending, setPending] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    return api("/api/admin/orders")
      .then((next) => {
        setOrders(next);
        setPage((current) => Math.min(current, Math.max(1, Math.ceil(next.length / PAGE_SIZE))));
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    document.title = "Orders · Admin";
    load();
  }, []);

  const sorted = useMemo(() => {
    if (!orders) return [];
    const copy = [...orders];
    copy.sort((left, right) => compare(left, right, sortKey) * (sortDir === "asc" ? 1 : -1));
    return copy;
  }, [orders, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);
  const pageIds = rows.map((order) => order.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = pageIds.some((id) => selected.has(id));

  function toggleSort(key) {
    setPage(1);
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "confirmedAt" || key === "createdAt" || key === "total" || key === "spiceTotal" ? "desc" : "asc");
  }

  function togglePage() {
    setSelected((current) => {
      const next = new Set(current);
      if (allOnPage) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleOne(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirmDelete() {
    if (!pending || deleting) return;
    const ids = pending.ids;
    setPending(null);
    setDeleting(true);
    setError("");
    try {
      await api("/api/admin/orders/delete", { method: "POST", body: JSON.stringify({ ids }) });
      setSelected(new Set());
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <h1 className="font-serif text-5xl">Orders</h1>
      <p className="mt-3 max-w-2xl text-ink/75">
        Only orders you add from the WhatsApp link are listed here. A customer tap on Order on WhatsApp stays off this list until the customer agrees to pay and you add it.
      </p>
      {error && <p className="mt-6 text-sm text-maroon">{error}</p>}
      {orders && orders.length === 0 && <p className="mt-6 text-sm text-ink/70">No confirmed orders yet.</p>}
      {orders && orders.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/70">
              {orders.length} confirmed {orders.length === 1 ? "order" : "orders"}
              {selected.size > 0 ? ` · ${selected.size} selected` : ""}
            </p>
            <button
              type="button"
              disabled={selected.size === 0 || deleting}
              onClick={() =>
                setPending({
                  ids: [...selected],
                  title: selected.size === 1 ? "Delete this order?" : `Delete these ${selected.size} orders?`,
                  message: "They will leave the order list. The WhatsApp chats stay as they are.",
                })
              }
              className="rounded-full bg-maroon px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Delete selected
            </button>
          </div>
          <div className="mt-4 overflow-x-auto rounded-[2rem] border border-line bg-card">
            <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
              <thead className="border-b border-line text-xs tracking-wide text-ink/60 uppercase">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allOnPage}
                      ref={(node) => {
                        if (node) node.indeterminate = someOnPage && !allOnPage;
                      }}
                      onChange={togglePage}
                      aria-label="Select all orders on this page"
                    />
                  </th>
                  {columns.map((column) => (
                    <th key={column.key} className="px-3 py-3 font-medium" aria-sort={sortKey === column.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 text-left">
                        {column.label}
                        {sortKey === column.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                      </button>
                    </th>
                  ))}
                  <th className="px-3 py-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <tr key={order.id} className="border-t border-line align-top">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(order.id)}
                        onChange={() => toggleOne(order.id)}
                        aria-label={`Select ${order.code}`}
                      />
                    </td>
                    <td className="px-3 py-3 font-medium whitespace-nowrap">{order.code}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{when(order.confirmedAt)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{when(order.createdAt)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{order.name}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <a className="text-leaf" href={`tel:+91${order.phone}`}>
                        {phoneLabel(order.phone)}
                      </a>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{order.door}</td>
                    <td className="max-w-[16rem] px-3 py-3">{order.address}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{order.city}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{order.district}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{order.pin}</td>
                    <td className="max-w-[12rem] px-3 py-3">{order.landmark || "—"}</td>
                    <td className="max-w-[14rem] px-3 py-3">{order.note || "—"}</td>
                    <td className="px-3 py-3">
                      <span className="block max-w-[14rem] truncate" title={spiceLine(order)}>
                        {spicePreview(order)}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{rupees(order.spiceTotal)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{offerLine(order) || "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{order.deliveryCharge ? rupees(order.deliveryCharge) : "Free"}</td>
                    <td className="px-3 py-3 font-medium whitespace-nowrap">{rupees(order.total)}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPending({
                            ids: [order.id],
                            title: `Delete ${order.code} for ${order.name}?`,
                            message: "This order will leave the list. The WhatsApp chat stays as it is.",
                          })
                        }
                        className="text-sm text-maroon"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-ink/70">
              Showing {start + 1}–{start + rows.length} of {sorted.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)}
                className="rounded-full border border-line bg-card px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {safePage} of {pageCount}
              </span>
              <button
                type="button"
                disabled={safePage === pageCount}
                onClick={() => setPage(safePage + 1)}
                className="rounded-full border border-line bg-card px-4 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
      <ConfirmModal
        open={Boolean(pending)}
        title={pending?.title || ""}
        message={pending?.message || ""}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />
    </section>
  );
}
