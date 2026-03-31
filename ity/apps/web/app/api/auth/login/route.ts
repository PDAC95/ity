import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loginLimiter, getClientIp } from '@/lib/ratelimit/limiters';
import { AuthErrorCode, getAuthMessage } from '@/lib/auth/errors';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success, reset } = await loginLimiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  const { email, password } = await request.json();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const code = error.message.includes('Email not confirmed')
      ? AuthErrorCode.EMAIL_NOT_CONFIRMED
      : AuthErrorCode.INVALID_CREDENTIALS;
    return NextResponse.json(
      { error: getAuthMessage(code), code },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
