'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
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

  if (isAssistant) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex gap-3 px-4 py-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.06]">
            <Bot className="h-4 w-4 text-[#bfdbfe]" />
          </div>
          <div className="max-w-[80%] rounded-xl rounded-tl-none border border-white/[0.06] bg-white/[0.04] backdrop-blur-sm px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--content-body)' }}>
              {text}
              {showCursor && (
                <span className="ml-0.5 inline-block animate-pulse text-[#bfdbfe]">|</span>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="flex gap-3 justify-end px-4 py-3">
        <div className="max-w-[80%] rounded-xl rounded-tr-none border border-[#bfdbfe]/20 bg-[#bfdbfe]/10 px-4 py-3">
          <div className="space-y-2">
            {segments.map((segment, i) =>
              segment.type === 'image' ? (
                <ImageThumbnail key={i} url={segment.url} />
              ) : segment.value.trim() ? (
                <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--content-body)' }}>
                  {segment.value}
                </p>
              ) : null
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
