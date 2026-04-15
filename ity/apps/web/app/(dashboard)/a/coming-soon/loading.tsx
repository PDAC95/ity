export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 animate-pulse">
      {/* Icon circle skeleton */}
      <div className="h-16 w-16 rounded-2xl bg-[var(--content-subtle-bg)]" />

      {/* Text lines skeleton */}
      <div className="space-y-2 text-center">
        <div className="h-4 w-24 rounded bg-[var(--content-subtle-bg)] mx-auto" />
        <div className="h-3 w-48 rounded bg-[var(--content-subtle-bg)] mx-auto" />
      </div>
    </div>
  );
}
