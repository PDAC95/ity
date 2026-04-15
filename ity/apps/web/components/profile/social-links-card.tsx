'use client';

import { useFormContext } from 'react-hook-form';
import type { ProfileFormInput } from '@/lib/validations/profile';
import { useI18n } from '@/lib/i18n/context';

const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'Instagram', prefix: 'instagram.com/' },
  { key: 'x', label: 'X (Twitter)', prefix: 'x.com/' },
  { key: 'youtube', label: 'YouTube', prefix: 'youtube.com/@' },
  { key: 'tiktok', label: 'TikTok', prefix: 'tiktok.com/@' },
  { key: 'linkedin', label: 'LinkedIn', prefix: 'linkedin.com/in/' },
  { key: 'facebook', label: 'Facebook', prefix: 'facebook.com/' },
] as const;

export function SocialLinksCard() {
  const { register } = useFormContext<ProfileFormInput>();
  const { t } = useI18n();

  return (
    <div className="glass-card p-5">
      <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--content-heading)' }}>{t('profile.socialLinks')}</h2>
      <div className="space-y-3">
        {SOCIAL_NETWORKS.map(({ key, label, prefix }) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--content-secondary)' }}>{label}</label>
            <div className="flex overflow-hidden rounded-xl" style={{ border: '1px solid var(--content-input-border)', background: 'var(--content-input-bg)' }}>
              <span className="whitespace-nowrap px-3 py-2.5 text-xs" style={{ borderRight: '1px solid var(--content-subtle-border)', background: 'var(--content-card-bg)', color: 'var(--content-muted)' }}>{prefix}</span>
              <input {...register(`socialLinks.${key}`)} placeholder="username" className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none" style={{ color: 'var(--content-heading)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
