export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Tab bar skeleton */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <div className="h-9 w-28 rounded-lg bg-zinc-800" />
        <div className="h-9 w-24 rounded-lg bg-zinc-800" />
        <div className="h-9 w-32 rounded-lg bg-zinc-800" />
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-4 max-w-lg">
        <div className="space-y-1">
          <div className="h-3 w-24 rounded bg-zinc-800" />
          <div className="h-10 w-full rounded-lg bg-zinc-800" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-20 rounded bg-zinc-800" />
          <div className="h-10 w-full rounded-lg bg-zinc-800" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-16 rounded bg-zinc-800" />
          <div className="h-10 w-full rounded-lg bg-zinc-800" />
        </div>

        {/* Save button skeleton */}
        <div className="h-10 w-28 rounded-lg bg-zinc-800" />
      </div>
    </div>
  );
}
