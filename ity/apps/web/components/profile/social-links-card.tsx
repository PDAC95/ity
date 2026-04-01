'use client';

import { useFormContext } from 'react-hook-form';
import type { ProfileFormInput } from '@/lib/validations/profile';

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

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="mb-4 text-sm font-semibold text-zinc-100">Redes sociales</h2>

      <div className="space-y-3">
        {SOCIAL_NETWORKS.map(({ key, label, prefix }) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-zinc-400">{label}</label>
            <div className="flex overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
              <span className="whitespace-nowrap border-r border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-500">
                {prefix}
              </span>
              <input
                {...register(`socialLinks.${key}`)}
                placeholder="username"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
