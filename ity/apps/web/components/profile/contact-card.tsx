'use client';

import { useFormContext } from 'react-hook-form';
import type { ProfileFormInput } from '@/lib/validations/profile';

export function ContactCard() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProfileFormInput>();

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="mb-4 text-sm font-semibold text-zinc-100">Contacto</h2>

      <div>
        <label htmlFor="contact-email" className="mb-1 block text-xs font-medium text-zinc-300">
          Email de contacto
        </label>
        <input
          id="contact-email"
          type="email"
          {...register('contactEmail')}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-[#bfdbfe] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]/30"
          placeholder="tu@email.com"
        />
        {errors.contactEmail && (
          <p className="mt-1 text-xs text-red-400">{errors.contactEmail.message}</p>
        )}
      </div>
    </div>
  );
}
