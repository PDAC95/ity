'use client';

import { useFormContext } from 'react-hook-form';
import type { ProfileFormInput } from '@/lib/validations/profile';
import { useI18n } from '@/lib/i18n/context';

export function ContactCard() {
  const { register, formState: { errors } } = useFormContext<ProfileFormInput>();
  const { t } = useI18n();

  return (
    <div className="glass-card p-5">
      <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--content-heading)' }}>{t('profile.contact')}</h2>
      <div>
        <label htmlFor="contact-email" className="mb-1 block text-xs font-medium" style={{ color: 'var(--content-body)' }}>{t('profile.contactEmail')}</label>
        <input id="contact-email" type="email" {...register('contactEmail')} className="w-full glass-input" placeholder="tu@email.com" />
        {errors.contactEmail && <p className="mt-1 text-xs text-red-400">{errors.contactEmail.message}</p>}
      </div>
    </div>
  );
}
