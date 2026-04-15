'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface ChatPageHeaderProps {
  schoolName?: string;
}

export function ChatPageHeader({ schoolName }: ChatPageHeaderProps) {
  const router = useRouter();

  const handleClose = () => {
    router.push('/a/landing/templates');
  };

  return (
    <div className="flex-shrink-0 border-b border-zinc-700 bg-zinc-900/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-zinc-500">Creando landing para</p>
        <p className="text-sm font-semibold text-zinc-100">{schoolName ?? 'Tu escuela'}</p>
      </div>
      <button
        onClick={handleClose}
        className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-800"
        aria-label="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
