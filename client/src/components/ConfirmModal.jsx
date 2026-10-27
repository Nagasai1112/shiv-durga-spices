export function ConfirmModal({ open, title, message, confirmLabel = "Remove", onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-5" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-[2rem] border border-line bg-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-serif text-3xl">
          Are you sure?
        </h2>
        {title && <p className="mt-3 font-medium">{title}</p>}
        <p className={`text-ink/75 ${title ? "mt-2" : "mt-3"}`}>{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-full border border-line px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-full bg-maroon px-4 py-2 text-sm font-medium text-white">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
