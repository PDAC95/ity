import { createClient } from '@/lib/supabase/server';
import { SchoolSetupTabs } from '@/components/school/school-setup-tabs';

export default async function SchoolSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: school } = await supabase
    .from('schools')
    .select('id, name, description, slug, branding')
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl py-8 md:py-12">
      <SchoolSetupTabs school={school} />
    </div>
  );
}
