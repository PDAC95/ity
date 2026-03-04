import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAllowedRedirect } from '@/lib/auth/redirect';
import { logAuthEvent } from '@/lib/auth/logger';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  // Validate redirect target BEFORE any auth processing
  const safeNext = isAllowedRedirect(next);

  // Log if the original next param was rejected
  if (next && safeNext !== next) {
    logAuthEvent('invalid_redirect', {
      attempted: next,
      resolved: safeNext,
    });
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Idempotent upsert -- handles race conditions and repeat callbacks
        const { error: upsertError } = await supabase
          .from('creators')
          .upsert(
            {
              id: user.id,
              email: user.email ?? '',
              name:
                (user.user_metadata?.full_name as string) ??
                (user.user_metadata?.name as string) ??
                user.email?.split('@')[0] ??
                'Creator',
              avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
              email_verified: true,
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );

        if (upsertError) {
          logAuthEvent('creator_provision_error', {
            userId: user.id,
            error: upsertError.message,
          });
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }

    // Auth code exchange failed
    logAuthEvent('auth_failure', {
      type: 'code_exchange',
      error: error.message,
    });
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
