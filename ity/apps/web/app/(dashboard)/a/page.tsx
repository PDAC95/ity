import { createClient } from '@/lib/supabase/server';
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: creator }, { data: school }] = await Promise.all([
    supabase
      .from('creators')
      .select('id, name, avatar_url')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('schools')
      .select('id, name, branding')
      .eq('creator_id', user!.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const hasSchool = !!school?.name;
  const hasSchoolLogo = !!(school?.branding as { logo?: string } | null)?.logo;
  const hasAvatar = !!creator?.avatar_url;

  return (
    <div className="mx-auto max-w-2xl py-8 md:py-12">
      <OnboardingChecklist
        hasSchool={hasSchool}
        hasSchoolLogo={hasSchoolLogo}
        hasAvatar={hasAvatar}
      />
    </div>
  );
}
