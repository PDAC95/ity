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
  // Catches edge cases from old registration flow or direct OAuth
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

  return (
    <DashboardShell userEmail={userEmail} userName={userName}>
      {children}
    </DashboardShell>
  );
}
