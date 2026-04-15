export function AuthDivider({ text = 'or' }: { text?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-700" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-zinc-900 px-4 text-zinc-500">{text}</span>
      </div>
    </div>
  );
}
