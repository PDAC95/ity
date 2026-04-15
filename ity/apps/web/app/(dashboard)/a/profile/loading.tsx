export default function Loading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* Avatar + name skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-[var(--content-subtle-bg)]" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-[var(--content-subtle-bg)]" />
          <div className="h-3 w-48 rounded bg-[var(--content-subtle-bg)]" />
        </div>
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="h-3 w-16 rounded bg-[var(--content-subtle-bg)]" />
          <div className="h-10 w-full rounded-lg bg-[var(--content-subtle-bg)]" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-20 rounded bg-[var(--content-subtle-bg)]" />
          <div className="h-10 w-full rounded-lg bg-[var(--content-subtle-bg)]" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-12 rounded bg-[var(--content-subtle-bg)]" />
          <div className="h-24 w-full rounded-lg bg-[var(--content-subtle-bg)]" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-24 rounded bg-[var(--content-subtle-bg)]" />
          <div className="h-10 w-full rounded-lg bg-[var(--content-subtle-bg)]" />
        </div>
      </div>

      {/* Save button skeleton */}
      <div className="h-10 w-32 rounded-lg bg-[var(--content-subtle-bg)]" />
    </div>
  );
}
