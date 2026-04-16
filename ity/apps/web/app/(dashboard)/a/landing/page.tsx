import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db, eq, desc } from '@ity/db';
import { schools, landingPageRequests } from '@ity/db';
import { LandingHubView } from '@/components/landing/landing-hub-view';

export const dynamic = 'force-dynamic';

export default async function LandingHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const school = await db.query.schools.findFirst({
    where: eq(schools.creatorId, user.id),
    columns: { id: true, name: true },
  });
  if (!school) redirect('/a/school-setup');

  // Get latest landing page request
  const request = await db.query.landingPageRequests.findFirst({
    where: eq(landingPageRequests.schoolId, school.id),
    columns: { id: true, status: true, templateId: true, createdAt: true },
    orderBy: (lpr, { desc }) => [desc(lpr.createdAt)],
  });

  // Determine effective status:
  // 'draft' = chat in progress but not submitted → treat as "no request" (show empty state)
  // 'pending' | 'in_progress' = "En proceso"
  // null = no request at all
  const effectiveStatus =
    !request || request.status === 'draft' ? 'none' : request.status;

  return (
    <LandingHubView
      status={effectiveStatus}
      schoolName={school.name}
      templateId={request?.templateId ?? null}
      submittedAt={request?.createdAt?.toISOString() ?? null}
    />
  );
}
