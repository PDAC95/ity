import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db, eq, and, ne, landingPageRequests, schools, creators } from '@ity/db';
import { generateId } from 'ai';
import type { UIMessage } from 'ai';
import type { ChatHistory } from '@ity/db';
import { ChatWizard } from '@/components/chat/chat-wizard';

interface ChatPageProps {
  searchParams: Promise<{ templateId?: string }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const templateId = params.templateId;

  // Redirect if no templateId
  if (!templateId) {
    redirect('/dashboard/landing/templates');
  }

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch creator and school in parallel
  const [creator, school] = await Promise.all([
    db.query.creators.findFirst({
      where: eq(creators.id, user.id),
      columns: { id: true, name: true, bio: true, avatarUrl: true },
    }),
    db.query.schools.findFirst({
      where: eq(schools.creatorId, user.id),
      columns: { id: true, name: true, description: true, branding: true },
    }),
  ]);

  // Redirect if no school
  if (!school) {
    redirect('/dashboard/school-setup');
  }

  const creatorName = creator?.name ?? user.email?.split('@')[0] ?? 'Creator';
  const creatorAvatarUrl = creator?.avatarUrl ?? undefined;
  const schoolName = school.name;

  // Check for existing draft with chat history
  const existingDraft = await db.query.landingPageRequests.findFirst({
    where: and(
      eq(landingPageRequests.schoolId, school.id),
      ne(landingPageRequests.status, 'completed')
    ),
    columns: { chatHistory: true },
  });

  let initialMessages: UIMessage[];

  if (existingDraft?.chatHistory && existingDraft.chatHistory.length > 0) {
    // Map stored ChatHistory to UIMessage[]
    initialMessages = (existingDraft.chatHistory as ChatHistory).map((msg) => ({
      id: generateId(),
      role: msg.role,
      parts: [{ type: 'text' as const, text: msg.content }],
    }));
  } else {
    // Build welcome message for new conversations
    const welcomeText = `¡Hola ${creatorName}! 👋 Voy a ayudarte a crear la landing page de "${schoolName}".

Trabajaremos juntos en 5 secciones:
1. Información básica de la escuela
2. Identidad visual (colores e imágenes)
3. Sobre ti como creador
4. El hero principal (título, subtítulo y llamada a la acción)
5. Secciones opcionales (testimonios, preguntas frecuentes)

¡Empecemos! ¿Cómo describirías en una oración lo que enseñas en "${schoolName}"?`;

    initialMessages = [
      {
        id: generateId(),
        role: 'assistant',
        parts: [{ type: 'text', text: welcomeText }],
      },
    ];
  }

  return (
    <ChatWizard
      initialMessages={initialMessages}
      schoolId={school.id}
      templateId={templateId}
      creatorName={creatorName}
      creatorAvatarUrl={creatorAvatarUrl}
      schoolName={schoolName}
    />
  );
}
