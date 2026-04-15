export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-full bg-[var(--content-subtle-bg)]" />
        <div className="h-8 w-24 rounded-full bg-[var(--content-subtle-bg)]" />
        <div className="h-8 w-20 rounded-full bg-[var(--content-subtle-bg)]" />
        <div className="h-8 w-28 rounded-full bg-[var(--content-subtle-bg)]" />
      </div>

      {/* Template card grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-[var(--content-subtle-bg)] overflow-hidden">
            <div className="h-40 w-full bg-white/[0.04]" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-white/[0.04]" />
              <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
