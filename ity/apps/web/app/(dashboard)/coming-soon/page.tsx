import { Lock } from 'lucide-react';

export default function ComingSoonPage() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 border-dashed px-10 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
          <Lock className="h-7 w-7 text-zinc-500" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-300">Proximamente</h1>
        <p className="max-w-xs text-sm text-zinc-500">
          Esta seccion estara disponible pronto. Estamos trabajando para traerte
          nuevas funcionalidades.
        </p>
      </div>
    </div>
  );
}
