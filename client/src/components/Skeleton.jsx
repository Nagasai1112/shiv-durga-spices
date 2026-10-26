function Bone({ className = "" }) {
  return <span className={`block animate-pulse rounded-2xl bg-ink/10 motion-reduce:animate-none ${className}`} />;
}

function Status({ label, children }) {
  return (
    <div role="status" aria-busy="true">
      <p className="sr-only">{label}</p>
      {children}
    </div>
  );
}

export function SpiceCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-card">
      <Bone className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Bone className="h-3 w-16" />
        <Bone className="h-7 w-2/3" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-4/5" />
        <Bone className="h-9 w-24" />
        <div className="grid grid-cols-4 gap-1.5">
          <Bone className="h-9" />
          <Bone className="h-9" />
          <Bone className="h-9" />
          <Bone className="h-9" />
        </div>
        <Bone className="h-10 w-full rounded-full" />
      </div>
    </article>
  );
}

export function SpiceGridSkeleton({ count = 6, label = "Opening the shop…", className = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" }) {
  return (
    <Status label={label}>
      <div className={className}>
        {Array.from({ length: count }, (_, index) => (
          <SpiceCardSkeleton key={index} />
        ))}
      </div>
    </Status>
  );
}

export function HeroSkeleton() {
  return (
    <Status label="Opening the shop…">
      <Bone className="aspect-[4/3] w-full rounded-[2rem] sm:aspect-[5/4]" />
    </Status>
  );
}

export function SpicePageSkeleton() {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-2" role="status" aria-busy="true">
      <p className="sr-only">Opening the shop…</p>
      <Bone className="aspect-square w-full rounded-[2rem]" />
      <div className="space-y-4">
        <Bone className="h-3 w-20" />
        <Bone className="h-12 w-3/4" />
        <Bone className="h-5 w-full" />
        <Bone className="h-5 w-4/5" />
        <Bone className="h-12 w-32" />
        <div className="grid grid-cols-4 gap-2">
          <Bone className="h-12" />
          <Bone className="h-12" />
          <Bone className="h-12" />
          <Bone className="h-12" />
        </div>
        <Bone className="h-12 w-48 rounded-full" />
      </div>
    </main>
  );
}

export function ReviewCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-card">
      <Bone className="h-80 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Bone className="h-4 w-24" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
      </div>
    </article>
  );
}

export function ReviewCarouselSkeleton() {
  return (
    <section className="mx-auto mt-10 max-w-6xl px-5" aria-label="Customer reviews">
      <Status label="Opening the reviews…">
        <Bone className="h-3 w-24" />
        <Bone className="mt-3 h-9 w-64" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article key={index} className="flex flex-col items-center rounded-[1.6rem] border border-line bg-card px-4 py-6">
              <Bone className="h-56 w-36 rounded-[1.3rem]" />
              <Bone className="mt-4 h-4 w-20" />
              <Bone className="mt-3 h-4 w-full" />
              <Bone className="mt-2 h-4 w-4/5" />
            </article>
          ))}
        </div>
      </Status>
    </section>
  );
}
