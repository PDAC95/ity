'use client';

import { Construction, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export default function ComingSoonPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="relative">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#bfdbfe]/20 to-[#bfdbfe]/5 border border-white/[0.08] flex items-center justify-center shadow-[0_4px_24px_-4px_rgba(191,219,254,0.15)]">
          <Construction className="h-9 w-9 text-[#bfdbfe]/70" />
        </div>
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#bfdbfe]/20 border border-white/[0.1] flex items-center justify-center">
          <Sparkles className="h-2.5 w-2.5 text-[#bfdbfe]" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-base font-semibold" style={{ color: 'var(--content-heading)' }}>{t('comingSoon.title')}</p>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--content-muted)' }}>{t('comingSoon.subtitle')}</p>
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-full px-4 py-2" style={{ background: 'var(--content-subtle-bg)', border: '1px solid var(--content-subtle-border)' }}>
        <div className="h-1.5 w-1.5 rounded-full bg-[#bfdbfe] animate-pulse" />
        <span className="text-xs" style={{ color: 'var(--content-secondary)' }}>{t('comingSoon.badge')}</span>
      </div>
    </div>
  );
}
