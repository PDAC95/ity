'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface ChatPageHeaderProps {
  schoolName?: string;
}

export function ChatPageHeader({ schoolName }: ChatPageHeaderProps) {
  const router = useRouter();
  const { t } = useI18n();

  const handleClose = () => {
    router.push('/a/landing/templates');
  };

  return (
    <div className="flex-shrink-0 backdrop-blur-sm px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--content-separator)', background: 'var(--content-card-bg)' }}>
      <div>
        <p className="text-xs" style={{ color: 'var(--content-muted)' }}>{t('chat.creatingLanding')}</p>
        <p className="text-sm font-semibold" style={{ color: 'var(--content-heading)' }}>{schoolName ?? t('chat.yourSchool')}</p>
      </div>
      <button
        onClick={handleClose}
        className="transition-colors p-1 rounded-lg"
        style={{ color: 'var(--content-secondary)' }}
        aria-label="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
