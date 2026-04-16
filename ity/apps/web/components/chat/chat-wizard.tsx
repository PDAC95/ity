'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw, Lock, Loader2 } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { PrdSummaryCard } from './prd-summary-card';
import { PrdSuccessCard } from './prd-success-card';
import { PrdErrorCard } from './prd-error-card';
import { trpc } from '@/lib/trpc/client';
import type { PrdSummary } from '@/lib/prd/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatWizardProps {
  initialMessages: UIMessage[];
  schoolId: string;
  templateId: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  schoolName: string;
}

type PrdFlowState =
  | { phase: 'idle' }
  | { phase: 'generating' }
  | { phase: 'summary'; prdData: PrdSummary }
  | { phase: 'confirming'; prdData: PrdSummary }
  | { phase: 'done' }
  | { phase: 'error'; retryCount: number };

const MAX_MANUAL_RETRIES = 3;

// ---------------------------------------------------------------------------
// ChatWizard
// ---------------------------------------------------------------------------

export function ChatWizard({
  initialMessages,
  schoolId,
  templateId,
  creatorName,
  creatorAvatarUrl,
  schoolName,
}: ChatWizardProps) {
  const [input, setInput] = useState('');
  const [pendingImageUrl, setPendingImageUrl] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [chatFinished, setChatFinished] = useState(false);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [prdFlow, setPrdFlow] = useState<PrdFlowState>({ phase: 'idle' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  // Track whether PRD generation has been triggered for the current [PRD_READY] marker
  const prdTriggeredRef = useRef(false);

  // ---------------------------------------------------------------------------
  // useChat with DefaultChatTransport
  // ---------------------------------------------------------------------------

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages: msgs }) => ({
        body: { messages: msgs, schoolId, templateId },
      }),
    }),
    onError: (error) => {
      // Try to detect 429 rate limit from error message
      const msg = error?.message ?? '';
      if (msg.includes('429') || msg.includes('rate_limited')) {
        // Parse reset timestamp from error if available
        // The API returns { error: 'rate_limited', reset: number }
        // The AI SDK wraps this as an error — try to extract from message
        const resetMatch = msg.match(/"reset"\s*:\s*(\d+)/);
        const resetTs = resetMatch?.[1] ? parseInt(resetMatch[1], 10) : Date.now() + 60_000;
        const seconds = Math.ceil((resetTs - Date.now()) / 1000);
        toast.error(`Demasiadas solicitudes. Espera ${seconds} segundos.`);
        setRateLimitedUntil(resetTs);
        setRateLimitCountdown(seconds);
      } else if (msg.includes('400') || msg.includes('turn_limit_reached')) {
        setChatFinished(true);
      } else {
        toast.error('Ocurrió un error. Puedes reintentar.');
      }
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  // ---------------------------------------------------------------------------
  // Turn limit — check client-side
  // ---------------------------------------------------------------------------

  const userTurnCount = messages.filter((m) => m.role === 'user').length;

  useEffect(() => {
    if (userTurnCount >= 15) {
      setChatFinished(true);
    }
  }, [userTurnCount]);

  // ---------------------------------------------------------------------------
  // Rate limit countdown
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!rateLimitedUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setRateLimitedUntil(null);
        setRateLimitCountdown(0);
        clearInterval(interval);
      } else {
        setRateLimitCountdown(remaining);
      }
    }, 1_000);

    return () => clearInterval(interval);
  }, [rateLimitedUntil]);

  const isRateLimited = rateLimitedUntil !== null && Date.now() < rateLimitedUntil;

  // ---------------------------------------------------------------------------
  // [PRD_READY] marker detection
  // ---------------------------------------------------------------------------

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastAssistantText =
    lastAssistantMessage?.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('') ?? '';

  useEffect(() => {
    if (
      lastAssistantText.includes('[PRD_READY]') &&
      prdFlow.phase === 'idle' &&
      !prdTriggeredRef.current
    ) {
      prdTriggeredRef.current = true;
      void triggerPrdGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAssistantText, prdFlow.phase]);

  // ---------------------------------------------------------------------------
  // PRD generation
  // ---------------------------------------------------------------------------

  async function triggerPrdGeneration(retryCount = 0) {
    setPrdFlow({ phase: 'generating' });

    const chatHistory = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join(''),
      }));

    async function attemptGeneration(): Promise<PrdSummary | null> {
      try {
        const res = await fetch('/api/prd/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatHistory, schoolId, templateId }),
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { prdData: PrdSummary };
        return json.prdData;
      } catch {
        return null;
      }
    }

    // First attempt
    let prdData = await attemptGeneration();

    // 1 automatic retry (transparent to user)
    if (!prdData) {
      prdData = await attemptGeneration();
    }

    if (prdData) {
      setPrdFlow({ phase: 'summary', prdData });
    } else {
      setPrdFlow({ phase: 'error', retryCount });
    }
  }

  // ---------------------------------------------------------------------------
  // tRPC mutation for confirmation
  // ---------------------------------------------------------------------------

  const requestPageMutation = trpc.landing.requestPage.useMutation({
    onSuccess: () => {
      setPrdFlow({ phase: 'done' });
    },
    onError: () => {
      toast.error('Error al enviar la solicitud.');
      // Revert to summary so user can retry confirmation
      setPrdFlow((prev) =>
        prev.phase === 'confirming' ? { phase: 'summary', prdData: prev.prdData } : prev
      );
    },
  });

  // ---------------------------------------------------------------------------
  // PRD flow handlers
  // ---------------------------------------------------------------------------

  function handleConfirm() {
    if (prdFlow.phase !== 'summary') return;
    const { prdData } = prdFlow;
    setPrdFlow({ phase: 'confirming', prdData });
    requestPageMutation.mutate({ schoolId, prdData: prdData as Record<string, unknown> });
  }

  function handleRequestChange() {
    setPrdFlow({ phase: 'idle' });
    prdTriggeredRef.current = false;
    sendMessage({ text: 'Quiero cambiar algo de mi información.' });
  }

  function handleManualRetry() {
    if (prdFlow.phase !== 'error') return;
    const newRetryCount = prdFlow.retryCount + 1;
    if (newRetryCount > MAX_MANUAL_RETRIES) return;
    void triggerPrdGeneration(newRetryCount);
  }

  // ---------------------------------------------------------------------------
  // Auto-scroll (pause when user scrolls up)
  // ---------------------------------------------------------------------------

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 100;
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (isNearBottomRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, prdFlow]);

  // ---------------------------------------------------------------------------
  // Send handler
  // ---------------------------------------------------------------------------

  const handleSend = useCallback(() => {
    if (!input.trim() && !pendingImageUrl) return;
    if (isStreaming || isRateLimited || chatFinished) return;

    let text = input.trim();

    // Append image URL as text marker so it appears in user message and is
    // forwarded to the API for context
    if (pendingImageUrl) {
      text = text
        ? `${text}\n[Imagen: ${pendingImageUrl}]`
        : `[Imagen: ${pendingImageUrl}]`;
    }

    sendMessage({ text });

    setInput('');
    setPendingImageUrl(undefined);
  }, [input, pendingImageUrl, isStreaming, isRateLimited, chatFinished, sendMessage]);

  // ---------------------------------------------------------------------------
  // Retry on error
  // ---------------------------------------------------------------------------

  const handleRetry = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    const text = lastUserMessage.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('');

    sendMessage({ text, messageId: lastUserMessage.id });
  }, [messages, sendMessage]);

  // ---------------------------------------------------------------------------
  // Compute disabled state for input
  // ---------------------------------------------------------------------------

  const prdActive = prdFlow.phase !== 'idle';
  const inputDisabled = isStreaming || isRateLimited || chatFinished || prdActive;

  // Chat is visually finished when PRD flow is done OR turn limit reached
  const showFinishedBanner = chatFinished && !prdActive;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const lastAssistantIndex = messages.reduce(
    (lastIdx, msg, idx) => (msg.role === 'assistant' ? idx : lastIdx),
    -1
  );

  // ---------------------------------------------------------------------------
  // Progress stepper (5 steps, each step = 3 user turns)
  // ---------------------------------------------------------------------------

  const currentStep = Math.min(Math.ceil(userTurnCount / 3), 5);

  return (
    <div className="flex h-full flex-col">
      {/* Progress stepper */}
      <div className="flex-shrink-0 border-b border-white/[0.06] px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-1">
          {[1, 2, 3, 4, 5].map((step, i) => (
            <div key={step} className="flex flex-1 items-center">
              <div
                className={`h-2 w-2 flex-shrink-0 rounded-full transition-all duration-300 ${
                  step < currentStep
                    ? 'bg-[#bfdbfe]'
                    : step === currentStep
                      ? 'bg-[#bfdbfe] ring-2 ring-[#bfdbfe]/30'
                      : 'bg-white/[0.08]'
                }`}
              />
              {i < 4 && (
                <div
                  className={`h-px flex-1 transition-all duration-300 ${
                    step < currentStep ? 'bg-[#bfdbfe]' : 'bg-white/[0.08]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-3xl">
          {messages.map((message, idx) => {
            // Strip [PRD_READY] marker from displayed text
            const strippedMessage =
              message.role === 'assistant'
                ? {
                    ...message,
                    parts: message.parts.map((p) =>
                      p.type === 'text'
                        ? { ...p, text: (p as { type: 'text'; text: string }).text.replace('[PRD_READY]', '').trim() }
                        : p
                    ),
                  }
                : message;

            return (
              <ChatMessage
                key={message.id}
                message={strippedMessage as UIMessage}
                creatorName={creatorName}
                creatorAvatarUrl={creatorAvatarUrl}
                isStreaming={isStreaming}
                isLastAssistantMessage={idx === lastAssistantIndex}
              />
            );
          })}

          {/* Typing indicator */}
          {isStreaming && (
            <div className="flex gap-3 px-4 py-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
                <span className="h-3 w-3 rounded-full bg-[#bfdbfe]/60" />
              </div>
              <div className="rounded-xl rounded-tl-none border border-white/[0.06] bg-white/[0.04] px-4 py-3">
                <div className="flex gap-1 items-center py-1 px-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error retry button */}
          {status === 'error' && (
            <div className="mx-4 my-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#fecaca]" />
              <span className="flex-1 text-sm text-red-500">Error al obtener respuesta.</span>
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1 rounded-md border border-zinc-600 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
              >
                <RefreshCw className="h-3 w-3" />
                Reintentar
              </button>
            </div>
          )}

          {/* PRD flow cards */}
          {prdFlow.phase === 'generating' && (
            <div className="glass-card mx-4 my-4 flex items-center gap-3 p-6">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#bfdbfe' }} />
              <span className="text-sm" style={{ color: 'var(--content-secondary)' }}>
                Generando resumen...
              </span>
            </div>
          )}

          {(prdFlow.phase === 'summary' || prdFlow.phase === 'confirming') && (
            <PrdSummaryCard
              prdData={prdFlow.prdData}
              onConfirm={handleConfirm}
              onRequestChange={handleRequestChange}
              isConfirming={prdFlow.phase === 'confirming'}
            />
          )}

          {prdFlow.phase === 'done' && <PrdSuccessCard schoolName={schoolName} />}

          {prdFlow.phase === 'error' && (
            <PrdErrorCard
              onRetry={handleManualRetry}
              retryCount={prdFlow.retryCount}
              maxRetries={MAX_MANUAL_RETRIES}
            />
          )}

          {/* Chat finished banner — only shown when PRD flow is NOT active */}
          {showFinishedBanner && (
            <div className="mx-4 my-4 flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-6 py-4">
              <Lock className="h-4 w-4 text-zinc-400" />
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: 'var(--content-heading)' }}>Conversación finalizada</p>
                <p className="text-xs" style={{ color: 'var(--content-secondary)' }}>
                  Has completado el asistente de diseño. Tu información fue guardada.
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Rate limit countdown */}
      {isRateLimited && rateLimitCountdown > 0 && (
        <div className="border-t border-white/[0.06] bg-white/[0.04] px-4 py-2 text-center text-sm text-[#fef3c7]">
          Límite de mensajes alcanzado. Puedes continuar en {rateLimitCountdown}s.
        </div>
      )}

      {/* Input area — hidden when chat finished or PRD flow active */}
      {!inputDisabled && (
        <div className="border-t border-white/[0.06]">
          <ChatInput
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            disabled={inputDisabled}
            isUploading={isUploading}
            onImageUpload={setPendingImageUrl}
            onUploadStart={() => setIsUploading(true)}
            onUploadEnd={() => setIsUploading(false)}
            pendingImageUrl={pendingImageUrl}
            onRemovePendingImage={() => setPendingImageUrl(undefined)}
            schoolId={schoolId}
          />
        </div>
      )}
    </div>
  );
}
