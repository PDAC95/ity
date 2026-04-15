'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import type { ProfileFormInput } from '@/lib/validations/profile';

export function BasicInfoCard() {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext<ProfileFormInput>();

  const name = useWatch({ control, name: 'name', defaultValue: '' });
  const bio = useWatch({ control, name: 'bio', defaultValue: '' });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="mb-4 text-sm font-semibold text-zinc-100">Información básica</h2>

      <div className="space-y-4">
        {/* Display name */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="profile-name" className="text-xs font-medium text-zinc-300">
              Nombre de perfil
            </label>
            <span className="text-xs text-zinc-500">{(name ?? '').length}/50</span>
          </div>
          <input
            id="profile-name"
            type="text"
            {...register('name')}
            maxLength={50}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-[#bfdbfe] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]/30"
            placeholder="Tu nombre o apodo"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="profile-bio" className="text-xs font-medium text-zinc-300">
              Biografía
            </label>
            <span className="text-xs text-zinc-500">{(bio ?? '').length}/500</span>
          </div>
          <textarea
            id="profile-bio"
            {...register('bio')}
            maxLength={500}
            rows={4}
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-[#bfdbfe] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]/30"
            placeholder="Cuéntale a tus alumnos quién eres..."
          />
          {errors.bio && (
            <p className="mt-1 text-xs text-red-400">{errors.bio.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
