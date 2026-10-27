export function DeleteButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-maroon hover:bg-maroon/10"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
        <path d="M3.2 4.2h9.6M6.2 4.2V3h3.6v1.2M4.4 4.2l.5 8.3h6.2l.5-8.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Delete
    </button>
  );
}

export function CrossButton({ label, onClick, tone = "ink" }) {
  const toneClass = tone === "maroon" ? "text-maroon hover:bg-maroon/10" : "text-ink/70 hover:bg-cream-deep hover:text-ink";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${toneClass}`}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
        <path d="M3.2 3.2l9.6 9.6M12.8 3.2l-9.6 9.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}
