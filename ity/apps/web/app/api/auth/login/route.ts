import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loginLimiter, getClientIp } from '@/lib/ratelimit/limiters';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success, reset } = await loginLimiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
