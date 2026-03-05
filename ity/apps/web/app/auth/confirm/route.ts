import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAllowedRedirect } from '@/lib/auth/redirect';
import { logAuthEvent } from '@/lib/auth/logger';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');

  const safeNext = isAllowedRedirect(next);

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    logAuthEvent('auth_failure', { type: 'otp_verify', error: error.message });
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  if (type === 'email') {
    // Provision creator for email-verified signup (idempotent upsert)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error: upsertError } = await supabase.from('creators').upsert(
        {
          id: user.id,
          email: user.email ?? '',
          name:
            (user.user_metadata?.full_name as string) ??
            user.email?.split('@')[0] ??
            'Creator',
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
  }

  // For type=recovery, recovery session is now established — redirect to reset-password
  return NextResponse.redirect(`${origin}${safeNext}`);
}
