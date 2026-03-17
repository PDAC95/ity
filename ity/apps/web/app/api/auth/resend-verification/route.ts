import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resendVerificationLimiter } from '@/lib/ratelimit/limiters';

export async function POST(request: Request) {
  const { email } = await request.json();

  // Normalize to prevent case-sensitivity bypass
  const identifier = (email as string).toLowerCase().trim();

  const { success, reset } = await resendVerificationLimiter.limit(identifier);

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
  const { error } = await supabase.auth.resend({ type: 'signup', email });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
