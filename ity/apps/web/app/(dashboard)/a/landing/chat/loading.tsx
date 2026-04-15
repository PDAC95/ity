export default function Loading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Chat header skeleton */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] p-4">
        <div className="h-8 w-8 rounded-full bg-[var(--content-subtle-bg)]" />
        <div className="space-y-1">
          <div className="h-4 w-32 rounded bg-[var(--content-subtle-bg)]" />
          <div className="h-3 w-20 rounded bg-[var(--content-subtle-bg)]" />
        </div>
      </div>

      {/* Progress stepper skeleton */}
      <div className="flex items-center justify-center gap-2 py-3 border-b border-white/[0.06]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-2 w-8 rounded-full bg-[var(--content-subtle-bg)]" />
        ))}
      </div>

      {/* Message bubbles skeleton */}
      <div className="flex-1 space-y-4 p-4 overflow-hidden">
        {/* AI message - left */}
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-[var(--content-subtle-bg)] flex-shrink-0" />
          <div className="h-16 w-64 rounded-2xl bg-[var(--content-subtle-bg)]" />
        </div>
        {/* User message - right */}
        <div className="flex justify-end">
          <div className="h-10 w-48 rounded-2xl bg-[var(--content-subtle-bg)]" />
        </div>
        {/* AI message - left */}
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-[var(--content-subtle-bg)] flex-shrink-0" />
          <div className="h-20 w-72 rounded-2xl bg-[var(--content-subtle-bg)]" />
        </div>
        {/* User message - right */}
        <div className="flex justify-end">
          <div className="h-12 w-56 rounded-2xl bg-[var(--content-subtle-bg)]" />
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="flex items-center gap-2 border-t border-white/[0.06] p-4">
        <div className="h-10 flex-1 rounded-xl bg-[var(--content-subtle-bg)]" />
        <div className="h-10 w-10 rounded-xl bg-[var(--content-subtle-bg)]" />
      </div>
    </div>
  );
}
