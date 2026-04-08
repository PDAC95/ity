'use client';

import { useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { Paperclip, SendHorizontal, X, Loader2 } from 'lucide-react';
import { getSignedUploadUrl, getPublicStorageUrl } from '@/app/actions/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isUploading: boolean;
  onImageUpload: (url: string) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  pendingImageUrl?: string;
  onRemovePendingImage: () => void;
  schoolId: string;
}

// ---------------------------------------------------------------------------
// ChatInput
// ---------------------------------------------------------------------------

export function ChatInput({
  input,
  onInputChange,
  onSend,
  disabled,
  isUploading,
  onImageUpload,
  onUploadStart,
  onUploadEnd,
  pendingImageUrl,
  onRemovePendingImage,
  schoolId,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = disabled || isUploading;
  const canSend = (input.trim() !== '' || !!pendingImageUrl) && !isDisabled;

  // Auto-grow textarea up to 5 rows (24px line height)
  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 5 * 24) + 'px';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend();
        // Reset textarea height after send
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting same file
    if (!file) return;

    onUploadStart();

    try {
      const path = `chat/${schoolId}/${Date.now()}-${file.name}`;
      const result = await getSignedUploadUrl(path);

      if (!result.data) {
        console.error('[ChatInput] Failed to get signed URL:', result.error);
        onUploadEnd();
        return;
      }

      // Upload directly to S3
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('PUT', result.data!.signedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      const publicUrl = await getPublicStorageUrl(path);
      onImageUpload(publicUrl);
    } catch (err) {
      console.error('[ChatInput] Upload error:', err);
    } finally {
      onUploadEnd();
    }
  };

  return (
    <div className="px-4 py-4">
      <div className="mx-auto max-w-3xl">
        {/* Pending image preview */}
        {pendingImageUrl && (
          <div className="mb-2 flex items-start">
            <div className="relative">
              <img
                src={pendingImageUrl}
                alt="Imagen pendiente"
                className="max-h-20 max-w-[120px] rounded-lg border border-zinc-200 object-cover"
              />
              <button
                type="button"
                onClick={onRemovePendingImage}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-white transition-colors hover:bg-red-600"
                aria-label="Eliminar imagen"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-200">
          {/* Paperclip button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled}
            className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Adjuntar imagen"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder="Escribe tu mensaje..."
            rows={1}
            className="flex-1 resize-none bg-transparent py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ minHeight: '24px', maxHeight: `${5 * 24}px` }}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={() => {
              if (canSend) {
                onSend();
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                }
              }
            }}
            disabled={!canSend}
            className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Enviar mensaje"
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1.5 text-center text-xs text-zinc-400">
          Enter para enviar · Shift+Enter para salto de línea
        </p>
      </div>
    </div>
  );
}
