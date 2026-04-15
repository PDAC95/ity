import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from './dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Safety net: ensure creator record exists for authenticated user
  const { data: existingCreator } = await supabase
    .from('creators')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!existingCreator) {
    await supabase.from('creators').upsert(
      {
        id: user.id,
        email: user.email ?? '',
        name:
          (user.user_metadata?.full_name as string) ??
          user.email?.split('@')[0] ??
          'Creator',
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  }

  const userEmail = user.email ?? '';
  const userName =
    (user.user_metadata?.full_name as string) ?? userEmail.split('@')[0];

  const [creator, school] = await Promise.all([
    supabase
      .from('creators')
      .select('id, name, avatar_url, email')
      .eq('id', user.id)
      .single(),
    supabase
      .from('schools')
      .select('id, name, branding')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <DashboardShell
      creator={{
        id: creator.data?.id ?? user.id,
        name: creator.data?.name ?? userName,
        avatarUrl: creator.data?.avatar_url ?? null,
        email: creator.data?.email ?? userEmail,
      }}
      school={
        school.data
          ? {
              id: school.data.id,
              name: school.data.name,
              branding: school.data.branding,
            }
          : null
      }
    >
      {children}
    </DashboardShell>
  );
}
