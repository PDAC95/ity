import { Construction } from 'lucide-react';

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
        <Construction className="h-8 w-8 text-zinc-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-200">Proximamente</p>
        <p className="text-xs text-zinc-500 mt-1">Estamos trabajando en esta seccion para ti</p>
      </div>
    </div>
  );
}
