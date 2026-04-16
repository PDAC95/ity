import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@/lib/supabase/server';
import { prdSchema } from '@/lib/prd/schema';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  // --- Authentication ---
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Parse request body ---
  const { chatHistory, schoolId, templateId } = (await req.json()) as {
    chatHistory: { role: string; content: string }[];
    schoolId: string;
    templateId: string;
  };

  // --- Serialize chat history for the extraction prompt ---
  const conversationText = chatHistory
    .map(m => `${m.role === 'user' ? 'Creator' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const userTurnCount = chatHistory.filter(m => m.role === 'user').length;

  try {
    // --- Generate structured PRD from conversation (SEC-04: Zod validation before return) ---
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4.5'),
      schema: prdSchema,
      maxRetries: 1,
      system: `You are a structured data extractor. Your task is to extract landing page information from a conversation between a creator and an assistant into a structured JSON format. Extract only information that was explicitly mentioned or confirmed in the conversation. For required fields with no data, use reasonable defaults based on the school context. For optional nullable fields with no data, use null.`,
      prompt: `Extract the landing page PRD data from the following conversation. The school ID is "${schoolId}" and the selected template is "${templateId}".

The metadata should include:
- templateId: "${templateId}"
- generatedAt: "${new Date().toISOString()}"
- conversationTurns: ${userTurnCount}

Conversation:
${conversationText}`,
    });

    return NextResponse.json({ prdData: object });
  } catch (err) {
    console.error('[prd/generate] Generation or validation failed:', err);
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
  }
}
