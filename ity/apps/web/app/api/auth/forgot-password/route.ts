import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { forgotPasswordLimiter } from '@/lib/ratelimit/limiters';

export async function POST(request: Request) {
  const { email } = await request.json();

  // Normalize to prevent case-sensitivity bypass
  const identifier = (email as string).toLowerCase().trim();

  const { success, reset } = await forgotPasswordLimiter.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  const supabase = await createClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:8080'}/auth/confirm?type=recovery&next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  // Always return success to prevent email enumeration
  if (error && error.message !== 'User not found') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
