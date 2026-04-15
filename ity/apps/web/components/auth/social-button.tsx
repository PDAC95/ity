'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isAllowedRedirect } from '@/lib/auth/redirect';
import { GoogleIcon } from './google-icon';

export function GoogleAuthButton({
  label = 'Continuar con Google',
  next,
}: {
  label?: string;
  next?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleAuth = async () => {
    setLoading(true);
    const safeNext = isAllowedRedirect(next);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/callback?next=${encodeURIComponent(safeNext)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Google auth error:', error.message);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 shadow-sm transition-all hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]/30 disabled:opacity-50"
    >
      {loading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
      ) : (
        <GoogleIcon className="h-5 w-5" />
      )}
      {label}
    </button>
  );
}
