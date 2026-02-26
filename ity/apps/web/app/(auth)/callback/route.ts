import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // For OAuth users, ensure a creator profile exists in our database
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if creator profile already exists
        const { data: existing } = await supabase
          .from('creators')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existing) {
          const name =
            (user.user_metadata?.full_name as string) ??
            (user.user_metadata?.name as string) ??
            user.email?.split('@')[0] ??
            'Creator';

          await supabase.from('creators').insert({
            id: user.id,
            email: user.email,
            name,
            avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
            email_verified: true,
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
