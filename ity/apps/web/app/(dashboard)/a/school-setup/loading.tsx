export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Tab bar skeleton */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-2">
        <div className="h-9 w-28 rounded-lg bg-[var(--content-subtle-bg)]" />
        <div className="h-9 w-24 rounded-lg bg-[var(--content-subtle-bg)]" />
        <div className="h-9 w-32 rounded-lg bg-[var(--content-subtle-bg)]" />
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-4 max-w-lg">
        <div className="space-y-1">
          <div className="h-3 w-24 rounded bg-[var(--content-subtle-bg)]" />
          <div className="h-10 w-full rounded-lg bg-[var(--content-subtle-bg)]" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-20 rounded bg-[var(--content-subtle-bg)]" />
          <div className="h-10 w-full rounded-lg bg-[var(--content-subtle-bg)]" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-16 rounded bg-[var(--content-subtle-bg)]" />
          <div className="h-10 w-full rounded-lg bg-[var(--content-subtle-bg)]" />
        </div>

        {/* Save button skeleton */}
        <div className="h-10 w-28 rounded-lg bg-[var(--content-subtle-bg)]" />
      </div>
    </div>
  );
}
