import { NextResponse } from 'next/server';
import { streamText, convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@/lib/supabase/server';
import { chatLimiter } from '@/lib/ratelimit/limiters';
import { buildSystemPrompt } from '@/lib/chat/system-prompt';
import { db, eq, and, ne, landingPageRequests, schools } from '@ity/db';
import type { ChatHistory } from '@ity/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  // --- Authentication ---
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Rate limiting (keyed on creator ID, not IP) ---
  const { success, reset } = await chatLimiter.limit(`chat:${user.id}`);

  if (!success) {
    return NextResponse.json(
      { error: 'rate_limited', reset },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  // --- Parse request body ---
  const { messages, schoolId, templateId } = (await req.json()) as {
    messages: UIMessage[];
    schoolId: string;
    templateId: string;
  };

  // --- Turn limit enforcement ---
  const userTurnCount = messages.filter(m => m.role === 'user').length;

  if (userTurnCount > 15) {
    return NextResponse.json({ error: 'turn_limit_reached' }, { status: 400 });
  }

  const isLastAllowedTurn = userTurnCount === 15;

  // --- Build system prompt (DB-sourced data only — SEC-03) ---
  const systemPrompt = await buildSystemPrompt({
    userId: user.id,
    schoolId,
    templateId,
  });

  // --- Stream LLM response ---
  const result = streamText({
    model: anthropic('claude-sonnet-4.5'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 1024,
    onFinish: async ({ text }) => {
      // Non-blocking: save chat history to DB after streaming completes
      try {
        const chatHistory: ChatHistory = [
          ...messages
            .filter((m): m is typeof m & { role: 'user' | 'assistant' } =>
              m.role === 'user' || m.role === 'assistant'
            )
            .map(m => ({
              role: m.role,
              content: m.parts
                .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                .map(p => p.text)
                .join(''),
              timestamp: new Date().toISOString(),
            })),
          {
            role: 'assistant' as const,
            content: text,
            timestamp: new Date().toISOString(),
          },
        ];

        // Find existing non-completed draft for this school
        const existing = await db.query.landingPageRequests.findFirst({
          where: and(
            eq(landingPageRequests.schoolId, schoolId),
            ne(landingPageRequests.status, 'completed'),
          ),
        });

        if (existing) {
          await db.update(landingPageRequests)
            .set({ chatHistory, updatedAt: new Date() })
            .where(eq(landingPageRequests.id, existing.id));
        } else {
          await db.insert(landingPageRequests).values({
            schoolId,
            templateId,
            status: 'draft',
            chatHistory,
          });
        }
      } catch (err) {
        console.error('[chat/route] Failed to save chat history:', err);
      }
    },
  });

  // Build response — attach X-Chat-Finished header at turn 15
  const response = result.toUIMessageStreamResponse();

  if (isLastAllowedTurn) {
    const headers = new Headers(response.headers);
    headers.set('X-Chat-Finished', 'true');
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }

  return response;
}
