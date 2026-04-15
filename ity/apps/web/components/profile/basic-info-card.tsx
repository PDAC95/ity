'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import type { ProfileFormInput } from '@/lib/validations/profile';
import { useI18n } from '@/lib/i18n/context';

export function BasicInfoCard() {
  const { register, formState: { errors }, control } = useFormContext<ProfileFormInput>();
  const { t } = useI18n();
  const name = useWatch({ control, name: 'name', defaultValue: '' });
  const bio = useWatch({ control, name: 'bio', defaultValue: '' });

  return (
    <div className="glass-card p-5">
      <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--content-heading)' }}>{t('profile.basicInfo')}</h2>
      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="profile-name" className="text-xs font-medium" style={{ color: 'var(--content-body)' }}>{t('profile.displayName')}</label>
            <span className="text-xs" style={{ color: 'var(--content-muted)' }}>{(name ?? '').length}/50</span>
          </div>
          <input id="profile-name" type="text" {...register('name')} maxLength={50} className="w-full glass-input" placeholder={t('profile.namePlaceholder')} />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="profile-bio" className="text-xs font-medium" style={{ color: 'var(--content-body)' }}>{t('profile.bio')}</label>
            <span className="text-xs" style={{ color: 'var(--content-muted)' }}>{(bio ?? '').length}/500</span>
          </div>
          <textarea id="profile-bio" {...register('bio')} maxLength={500} rows={4} className="w-full resize-none glass-input" placeholder={t('profile.bioPlaceholder')} />
          {errors.bio && <p className="mt-1 text-xs text-red-400">{errors.bio.message}</p>}
        </div>
      </div>
    </div>
  );
}
