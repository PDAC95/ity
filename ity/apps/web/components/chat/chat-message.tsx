'use client';

import { Bot, User } from 'lucide-react';
import type { UIMessage } from 'ai';
import { ImageThumbnail } from './image-thumbnail';

interface ChatMessageProps {
  message: UIMessage;
  creatorName: string;
  creatorAvatarUrl?: string;
  isStreaming?: boolean;
  isLastAssistantMessage?: boolean;
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

type ContentSegment =
  | { type: 'text'; value: string }
  | { type: 'image'; url: string };

function parseContentSegments(text: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  const regex = /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s]*)?/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'image', url: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}

export function ChatMessage({
  message,
  creatorName,
  creatorAvatarUrl,
  isStreaming = false,
  isLastAssistantMessage = false,
}: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const text = getMessageText(message);
  const segments: ContentSegment[] = isAssistant
    ? [{ type: 'text', value: text }]
    : parseContentSegments(text);

  const showCursor = isAssistant && isLastAssistantMessage && isStreaming;

  return (
    <div className="border-b border-zinc-100 py-6 last:border-b-0">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100">
            {isAssistant ? (
              <Bot className="h-4 w-4 text-indigo-600" />
            ) : creatorAvatarUrl ? (
              <img
                src={creatorAvatarUrl}
                alt={creatorName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-zinc-500" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-zinc-900">
              {isAssistant ? '12ity' : creatorName}
            </span>
          </div>
        </div>

        <div className="pl-11">
          {isAssistant ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {text}
              {showCursor && (
                <span className="ml-0.5 inline-block animate-pulse text-indigo-400">|</span>
              )}
            </p>
          ) : (
            <div className="space-y-2">
              {segments.map((segment, i) =>
                segment.type === 'image' ? (
                  <ImageThumbnail key={i} url={segment.url} />
                ) : (
                  segment.value.trim() ? (
                    <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                      {segment.value}
                    </p>
                  ) : null
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
