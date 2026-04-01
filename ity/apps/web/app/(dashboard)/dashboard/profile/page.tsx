import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/profile/profile-form';
import type { SocialLinks } from '@ity/db';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: creator } = await supabase
    .from('creators')
    .select('id, name, bio, avatar_url, contact_email, social_links')
    .eq('id', user!.id)
    .single();

  const { data: school } = await supabase
    .from('schools')
    .select('name, branding')
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-5xl py-8 md:py-12">
      <ProfileForm
        creator={{
          id: creator?.id ?? user!.id,
          name: creator?.name ?? '',
          bio: creator?.bio ?? null,
          avatarUrl: creator?.avatar_url ?? null,
          contactEmail: creator?.contact_email ?? null,
          socialLinks: (creator?.social_links as SocialLinks) ?? null,
        }}
        school={
          school
            ? {
                name: school.name,
                branding: school.branding as { logo?: string; primaryColor: string } | null,
              }
            : null
        }
      />
    </div>
  );
}
