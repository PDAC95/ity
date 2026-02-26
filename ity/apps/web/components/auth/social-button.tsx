'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GoogleIcon } from './google-icon';

export function GoogleAuthButton({ label = 'Continue with Google' }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleAuth = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback?next=/dashboard`,
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
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
    >
      {loading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      ) : (
        <GoogleIcon className="h-5 w-5" />
      )}
      {label}
    </button>
  );
}
