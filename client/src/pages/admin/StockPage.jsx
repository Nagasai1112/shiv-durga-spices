import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { rupees } from "../../format";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const palette = ["#3e5642", "#8a6240", "#9a4036", "#6d7a62", "#c4a574", "#5c4033", "#2f4a38", "#a36b52"];

function weight(grams) {
  const value = Number(grams) || 0;
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  if (abs < 1000) return `${sign}${Math.round(abs)} g`;
  const kg = Math.round((abs / 1000) * 100) / 100;
  return `${sign}${kg} kg`;
}

function fieldKg(grams) {
  const kg = Math.round(((Number(grams) || 0) / 1000) * 1000) / 1000;
  return String(kg);
}

function Pie({ slices, center, caption, label, format, columns = 2 }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (!total) return null;
  const r = 78;
  const cx = 100;
  const cy = 100;
  let angle = -Math.PI / 2;
  const parts = slices.map((slice, index) => {
    const color = slice.color || palette[index % palette.length];
    const sweep = (slice.value / total) * Math.PI * 2;
    if (slices.length === 1 || sweep >= Math.PI * 2 - 0.0001) {
      return { ...slice, full: true, color };
    }
    const start = angle;
    angle += sweep;
    const large = sweep > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    return { ...slice, d, full: false, color };
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <svg viewBox="0 0 200 200" className="h-36 w-36 shrink-0" role="img" aria-label={label}>
        {parts.map((part) =>
          part.full ? (
            <circle key={part.label} cx={cx} cy={cy} r={r} fill={part.color} />
          ) : (
            <path key={part.label} d={part.d} fill={part.color} />
          ),
        )}
        <circle cx={cx} cy={cy} r="46" fill="#f7f4ee" />
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-ink" style={{ fontSize: 18, fontFamily: "Fraunces, Georgia, serif" }}>
          {center}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="fill-ink/70" style={{ fontSize: 11 }}>
          {caption}
        </text>
      </svg>
      <ul className={`grid w-full gap-x-3 gap-y-1 text-xs ${columns === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {parts.map((part) => (
          <li key={part.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: part.color }} />
              <span>{part.label}</span>
            </span>
            <span className={part.color === "#9a4036" ? "text-maroon" : "text-ink/70"}>
              {format ? format(part.value) : part.value} · {Math.round((part.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function curveThrough(points) {
  if (!points.length) return "";
  let path = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] || points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] || next;
    const c1x = current[0] + (next[0] - previous[0]) / 6;
    const c2x = next[0] - (after[0] - current[0]) / 6;
    const low = Math.max(current[1], next[1]);
    const high = Math.min(current[1], next[1]);
    const c1y = Math.min(low, Math.max(high, current[1] + (next[1] - previous[1]) / 6));
    const c2y = Math.min(low, Math.max(high, next[1] - (after[1] - current[1]) / 6));
    path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${next[0].toFixed(1)} ${next[1].toFixed(1)}`;
  }
  return path;
}

function SalesCurve({ months: rows, bestMonth, field = "total", gradientId = "sale-fill", stroke = "#3e5642", peakColor = "#9a4036", label = "Sales through the year" }) {
  const width = 640;
  const height = 240;
  const padX = 28;
  const padTop = 28;
  const padBottom = 32;
  const amount = (month) => Number(month[field]) || 0;
  const max = Math.max(...rows.map(amount), 1);
  const points = rows.map((month, index) => {
    const x = padX + (index * (width - padX * 2)) / (rows.length - 1);
    const y = height - padBottom - (Math.max(amount(month), 0) / max) * (height - padTop - padBottom);
    return [x, y];
  });
  const line = curveThrough(points);
  const area = `${line} L ${points[points.length - 1][0].toFixed(1)} ${height - padBottom} L ${points[0][0].toFixed(1)} ${height - padBottom} Z`;
  const peak = amount(bestMonth || {}) > 0 ? points[bestMonth.month - 1] : null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={peakColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={peakColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point, index) => {
        const high = amount(bestMonth || {}) > 0 && rows[index].month === bestMonth.month;
        return (
          <g key={rows[index].month}>
            <circle cx={point[0]} cy={point[1]} r={high ? 6 : 3.5} fill={high ? peakColor : stroke} />
            {high && (
              <text x={point[0]} y={point[1] - 12} textAnchor="middle" fill={peakColor} style={{ fontSize: 12 }}>
                {rupees(amount(rows[index]))}
              </text>
            )}
            <text x={point[0]} y={height - 8} textAnchor="middle" fill="#3c3a32" opacity="0.7" style={{ fontSize: 11 }}>
              {months[index]}
            </text>
          </g>
        );
      })}
      {peak && <circle cx={peak[0]} cy={peak[1]} r="11" fill="none" stroke={peakColor} strokeOpacity="0.35" />}
    </svg>
  );
}

function axisTop(grams) {
  const raw = Math.max(grams, 100);
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

function barTop(x, y, w, h) {
  const radius = Math.min(8, w / 2, h / 2);
  const bottom = y + h;
  return `M ${x} ${bottom} V ${y + radius} Q ${x} ${y} ${x + radius} ${y} H ${x + w - radius} Q ${x + w} ${y} ${x + w} ${y + radius} V ${bottom} Z`;
}

function SoldBars({ rows }) {
  const plotted = rows.filter((row) => row.grams > 0);
  if (!plotted.length) return <p className="text-sm text-ink/70">No confirmed orders yet.</p>;
  const col = 108;
  const barW = 48;
  const padL = 54;
  const padR = 18;
  const padT = 26;
  const padB = 46;
  const plotH = 150;
  const width = padL + plotted.length * col + padR;
  const height = padT + plotH + padB;
  const top = axisTop(Math.max(...plotted.map((row) => row.grams)));
  const baseline = padT + plotH;
  const yOf = (grams) => baseline - (grams / top) * plotH;
  const ticks = [0, 0.5, 1].map((step) => ({ grams: top * step, y: yOf(top * step) }));
  const points = plotted.map((row, index) => [padL + col * index + col / 2, Math.min(yOf(row.grams), baseline - 8)]);
  const lead = Math.max(...plotted.map((row) => row.grams));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="mx-auto max-w-full"
        role="img"
        aria-label="Spices sold"
      >
        {ticks.map((tick) => (
          <g key={tick.grams}>
            <line x1={padL} x2={width - padR} y1={tick.y} y2={tick.y} stroke="#e4dccb" />
            <text x={padL - 8} y={tick.y + 4} textAnchor="end" fill="#3c3a32" opacity="0.65" style={{ fontSize: 11 }}>
              {weight(tick.grams)}
            </text>
          </g>
        ))}
        <line x1={padL} x2={width - padR} y1={baseline} y2={baseline} stroke="#cfc6b6" />
        {plotted.map((row, index) => {
          const x = points[index][0];
          const y = points[index][1];
          const color = row.grams === lead ? "#9a4036" : ["#3e5642", "#8a6240", "#6d7a62", "#c4a574", "#5c4033"][index % 5];
          const heightOf = Math.max(baseline - y, 6);
          const [first, ...rest] = row.name.split(" ");
          return (
            <g key={row.id || row.name}>
              <path d={barTop(x - barW / 2, baseline - heightOf, barW, heightOf)} fill={color} />
              <text x={x} y={y - 16} textAnchor="middle" fill={color} style={{ fontSize: 12, fontWeight: 600 }}>
                {weight(row.grams)}
              </text>
              <text x={x} y={baseline + 18} textAnchor="middle" fill="#3c3a32" style={{ fontSize: 12 }}>
                {first}
              </text>
              {rest.length > 0 && (
                <text x={x} y={baseline + 34} textAnchor="middle" fill="#3c3a32" style={{ fontSize: 12 }}>
                  {rest.join(" ")}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function StockPage() {
  const [report, setReport] = useState(null);
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load(year) {
    const query = year ? `?year=${year}` : "";
    return api(`/api/admin/stock${query}`)
      .then((next) => {
        setReport(next);
        setFields(Object.fromEntries(next.spices.map((spice) => [spice.id, fieldKg(spice.stockGrams)])));
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    document.title = "Stock · Admin";
    load();
  }, []);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const next = await api("/api/admin/stock", {
        method: "PUT",
        body: JSON.stringify({
          year: report?.year,
          items: (report?.spices || []).map((spice) => ({
            id: spice.id,
            kg: Number(fields[spice.id]),
          })),
        }),
      });
      setReport(next);
      setFields(Object.fromEntries(next.spices.map((spice) => [spice.id, fieldKg(spice.stockGrams)])));
      setMessage("Stock saved. New confirmed orders will come off these kilograms.");
      window.dispatchEvent(new Event("stock-changed"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const soldMost = report?.sold?.[0];
  const monthTotals = report?.months || [];
  const bestMonth = monthTotals.reduce((best, month) => (month.total > (best?.total || 0) ? month : best), null);
  const bestProfitMonth = monthTotals.reduce((best, month) => ((month.profit || 0) > (best?.profit || 0) ? month : best), null);
  const hitSlices = (report?.hits || []).map((hit) => ({ label: hit.label, value: hit.hits }));
  const flagged = (report?.spices || []).filter((spice) => spice.level && spice.level !== "ok");
  const stockSlices = (report?.spices || [])
    .filter((spice) => spice.stockGrams > 0)
    .map((spice) => ({
      label: spice.name,
      value: spice.stockGrams,
      color: spice.level === "low" ? "#9a4036" : undefined,
    }));
  const stockLeft = stockSlices.reduce((sum, slice) => sum + slice.value, 0);
  const profitSlices = (report?.spices || [])
    .filter((spice) => spice.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .map((spice) => ({ label: spice.name, value: spice.profit }));
  const profitTotal = (report?.spices || []).reduce((sum, spice) => sum + (spice.profit || 0), 0);
  const losses = (report?.spices || []).filter((spice) => spice.profit < 0);
  const costsMissing = (report?.spices || []).every((spice) => !spice.costPerKg);

  return (
    <section>
      <h1 className="font-serif text-4xl">Stock</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/75">
        Type the kilograms in the shop. A confirmed order takes that weight off. Deleting the order puts it back.
      </p>
      {error && <p className="mt-4 text-sm text-maroon">{error}</p>}
      {!report && !error && <p className="mt-6 text-sm text-ink/70">Loading stock…</p>}
      {report && (
        <>
          {flagged.length > 0 ? (
            <article className="mt-4 rounded-[2rem] border border-maroon/30 bg-[#f8efe9] p-4">
              <h2 className="font-serif text-2xl text-maroon">About to finish</h2>
              <p className="mt-2 text-sm text-ink/75">
                A spice shows here when less than {weight(report.lowGrams)} is left. Finished means the shelf is empty.
              </p>
              <div className="mt-4 space-y-3">
                {flagged.map((spice) => (
                  <div key={spice.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{spice.name}</span>
                      <span className="text-maroon">{spice.level === "out" ? "Finished" : weight(spice.stockGrams)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/80">
                      <div
                        className="h-full rounded-full bg-maroon"
                        style={{ width: spice.stockGrams > 0 ? `${Math.max(8, (spice.stockGrams / report.lowGrams) * 100)}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : (
            <p className="mt-4 rounded-[2rem] border border-line bg-card px-4 py-3 text-sm text-leaf">
              Every spice still has at least {weight(report.lowGrams)} left.
            </p>
          )}

          <form onSubmit={save} className="mt-4 overflow-x-auto rounded-[2rem] border border-line bg-card">
            <div className="min-w-[36rem] lg:min-w-0">
            <div className="grid gap-x-6 lg:grid-cols-2">
            {report.spices.map((spice) => (
              <div key={spice.id} className="grid grid-cols-[1.2fr_0.9fr_auto] items-center gap-2 border-t border-line px-4 py-2 text-sm first:border-t-0 lg:[&:nth-child(2)]:border-t-0">
                <span>
                  <span className="font-medium">{spice.name}</span>
                  {spice.level === "out" && <span className="ml-2 text-xs text-maroon">Finished</span>}
                  {spice.level === "low" && <span className="ml-2 text-xs text-maroon">Low</span>}
                </span>
                <label className="flex items-center gap-2">
                  <input
                    value={fields[spice.id] ?? ""}
                    onChange={(event) => setFields((current) => ({ ...current, [spice.id]: event.target.value.replace(/[^\d.]/g, "") }))}
                    inputMode="decimal"
                    aria-label={`${spice.name} kilograms`}
                    className="w-full rounded-full border border-line bg-cream px-3 py-1.5"
                  />
                  <span className="text-ink/60">kg</span>
                </label>
                <span className="w-14 text-right text-ink/70">{weight(spice.soldGrams)}</span>
              </div>
            ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
              <button type="submit" disabled={busy} className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream disabled:opacity-60">
                {busy ? "Saving…" : "Save stock"}
              </button>
              {message && <p className="text-sm text-leaf">{message}</p>}
            </div>
            </div>
          </form>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-line bg-card p-4">
              <h2 className="font-serif text-2xl">Profit</h2>
              <p className="mt-1 text-sm text-ink/70">
                What customers paid for each pack, minus the buying price on that spice, after the festival discount. Delivery is not counted.{" "}
                {costsMissing ? (
                  <>
                    Buying price is still ₹0, so this is the full selling price. Set it on <Link to="/admin/spices" className="text-leaf">Spices</Link>.
                  </>
                ) : (
                  "Sales already confirmed use the buying price saved on the spice."
                )}
              </p>
              <div className="mt-3">
                {profitSlices.length ? (
                  <Pie slices={profitSlices} center={rupees(profitTotal)} caption="profit" label="Profit by spice" format={rupees} columns={1} />
                ) : (
                  <p className="text-sm text-ink/70">
                    {profitTotal < 0 ? `The sold spices are at a loss of ${rupees(Math.abs(profitTotal))}.` : "Confirmed orders will fill this chart."}
                  </p>
                )}
                {losses.length > 0 && (
                  <p className="mt-3 text-sm text-maroon">
                    Left off the pie because the cost was higher than the sold price: {losses.map((spice) => `${spice.name} (${rupees(spice.profit)})`).join(", ")}.
                  </p>
                )}
              </div>
            </article>
            <article className="rounded-[2rem] border border-line bg-card p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl">Profit in {report.year}</h2>
                  <p className="mt-1 text-sm text-ink/70">
                    {bestProfitMonth?.profit
                      ? `${months[bestProfitMonth.month - 1]} was highest, ${rupees(bestProfitMonth.profit)}.`
                      : "Confirmed orders in this year will draw the curve."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => load(year)}
                      className={`rounded-full px-3 py-1.5 text-sm ${year === report.year ? "bg-ink text-cream" : "border border-line bg-cream"}`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                {bestProfitMonth?.profit ? (
                  <SalesCurve
                    months={monthTotals}
                    bestMonth={bestProfitMonth}
                    field="profit"
                    gradientId="profit-fill"
                    stroke="#3e5642"
                    peakColor="#8a6240"
                    label={`Profit in ${report.year}`}
                  />
                ) : (
                  <p className="text-sm text-ink/70">No profit in this year yet.</p>
                )}
              </div>
            </article>
            <article className="rounded-[2rem] border border-line bg-card p-4">
              <h2 className="font-serif text-2xl">In the shop now</h2>
              <p className="mt-1 text-sm text-ink/70">Share of kilograms left. Maroon means under {weight(report.lowGrams)}.</p>
              <div className="mt-3">
                {stockSlices.length ? (
                  <Pie
                    slices={stockSlices}
                    center={weight(stockLeft)}
                    caption="left"
                    label="Stock still in the shop"
                    format={weight}
                  />
                ) : (
                  <p className="text-sm text-ink/70">Type the kilograms above and save. The pie chart appears here.</p>
                )}
              </div>
            </article>
            <article className="rounded-[2rem] border border-line bg-card p-4">
              <h2 className="font-serif text-2xl">Sold most</h2>
              <p className="mt-1 text-sm text-ink/70">
                {soldMost ? `${soldMost.name} leads, ${weight(soldMost.grams)}.` : "Confirmed orders will fill this chart."}
              </p>
              <div className="mt-2">
                <SoldBars rows={report.sold} />
              </div>
            </article>
            <article className="rounded-[2rem] border border-line bg-card p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl">Sales in {report.year}</h2>
                <p className="mt-1 text-sm text-ink/70">
                  {bestMonth?.total
                    ? `${months[bestMonth.month - 1]} was highest, ${rupees(bestMonth.total)}.`
                    : "Confirmed orders in this year will draw the curve."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => load(year)}
                    className={`rounded-full px-3 py-1.5 text-sm ${year === report.year ? "bg-ink text-cream" : "border border-line bg-cream"}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2">
              {bestMonth?.total ? <SalesCurve months={monthTotals} bestMonth={bestMonth} /> : <p className="text-sm text-ink/70">No confirmed orders in this year yet.</p>}
            </div>
            </article>
            <article className="rounded-[2rem] border border-line bg-card p-4">
            <h2 className="font-serif text-2xl">Page hits</h2>
            <p className="mt-1 text-sm text-ink/70">Opens of the public pages. Admin pages are not counted.</p>
            <div className="mt-3">
              {hitSlices.length ? (
                <Pie slices={hitSlices} center={String(hitSlices.reduce((sum, slice) => sum + slice.value, 0))} caption="hits" label="Page hits" />
              ) : (
                <p className="text-sm text-ink/70">No page visits yet.</p>
              )}
            </div>
          </article>
          </div>
        </>
      )}
    </section>
  );
}
