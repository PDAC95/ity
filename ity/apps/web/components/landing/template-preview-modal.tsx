'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Monitor, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@ity/ui/utils';
import {
  isAllowedPreviewUrl,
  IFRAME_SANDBOX,
  CATEGORY_LABELS,
} from '@/lib/templates/registry';
import type { Template } from '@/lib/templates/registry';

interface TemplatePreviewModalProps {
  templates: Template[];
  selectedIndex: number;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
}

export function TemplatePreviewModal({
  templates,
  selectedIndex,
  onChangeIndex,
  onClose,
}: TemplatePreviewModalProps) {
  const router = useRouter();
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const template = templates[selectedIndex];
  const safeUrl = template ? isAllowedPreviewUrl(template.previewUrl) ? template.previewUrl : null : null;
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < templates.length - 1;

  // Reset iframe states when template changes
  useEffect(() => {
    setIframeLoaded(false);
    setIframeError(false);
  }, [selectedIndex]);

  // Reset loaded state when viewport changes (iframe reloads due to dimension change)
  useEffect(() => {
    setIframeLoaded(false);
  }, [viewport]);

  // Measure container width for mobile scaling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);

    return () => observer.disconnect();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onChangeIndex(selectedIndex - 1);
      } else if (e.key === 'ArrowRight' && hasNext) {
        onChangeIndex(selectedIndex + 1);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, hasPrev, hasNext, onChangeIndex, onClose]);

  if (!template) {
    return null;
  }

  function handleRetry() {
    setIframeError(false);
    setIframeLoaded(false);
    setRetryKey((k) => k + 1);
  }

  function handleChoose() {
    router.push(`/dashboard/landing/chat?templateId=${template!.id}`);
  }

  // Mobile scale calculation: scale down to fit container width, never upscale
  const mobileWidth = 375;
  const mobileScale = containerWidth > 0 ? Math.min(containerWidth / mobileWidth, 1) : 1;

  return (
    // Overlay
    <div
      className="fixed inset-0 bg-black/80 z-50 flex flex-col"
      onClick={onClose}
    >
      {/* Modal content */}
      <div
        className="flex flex-col h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
          {/* Left: name + category */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg font-semibold text-zinc-100 truncate">
              {template.name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 whitespace-nowrap">
              {CATEGORY_LABELS[template.category]}
            </span>
          </div>

          {/* Center: viewport toggle */}
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={cn(
                'rounded p-1.5 transition-colors',
                viewport === 'desktop'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
              aria-label="Vista escritorio"
            >
              <Monitor size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={cn(
                'rounded p-1.5 transition-colors',
                viewport === 'mobile'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
              aria-label="Vista móvil"
            >
              <Smartphone size={16} />
            </button>
          </div>

          {/* Right: close */}
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Iframe area */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden bg-zinc-900 flex items-start justify-center"
        >
          {!safeUrl ? (
            // Invalid URL error state
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-zinc-400">No se pudo cargar el preview</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : iframeError ? (
            // Iframe load error state
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-zinc-400">No se pudo cargar el preview</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* Loading spinner overlay */}
              {!iframeLoaded && (
                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center z-10">
                  <div className="border-2 border-zinc-600 border-t-indigo-500 rounded-full w-8 h-8 animate-spin" />
                </div>
              )}

              {viewport === 'desktop' ? (
                <iframe
                  key={`desktop-${selectedIndex}-${retryKey}`}
                  src={safeUrl}
                  sandbox={IFRAME_SANDBOX}
                  className="w-full h-full border-0"
                  onLoad={() => setIframeLoaded(true)}
                  onError={() => setIframeError(true)}
                  title={template.name}
                />
              ) : (
                // Mobile viewport: scale iframe to simulate 375px device
                <div
                  style={{
                    width: mobileWidth * mobileScale,
                    height: '100%',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <iframe
                    key={`mobile-${selectedIndex}-${retryKey}`}
                    src={safeUrl}
                    sandbox={IFRAME_SANDBOX}
                    style={{
                      width: mobileWidth,
                      height: mobileScale > 0 ? `${100 / mobileScale}%` : '100%',
                      border: 0,
                      transformOrigin: 'top left',
                      transform: `scale(${mobileScale})`,
                    }}
                    onLoad={() => setIframeLoaded(true)}
                    onError={() => setIframeError(true)}
                    title={template.name}
                  />
                </div>
              )}
            </>
          )}

          {/* Prev arrow */}
          {hasPrev && (
            <button
              type="button"
              onClick={() => onChangeIndex(selectedIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-zinc-800/80 hover:bg-zinc-700 rounded-full p-2 text-zinc-300 transition-colors z-20"
              aria-label="Template anterior"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Next arrow */}
          {hasNext && (
            <button
              type="button"
              onClick={() => onChangeIndex(selectedIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800/80 hover:bg-zinc-700 rounded-full p-2 text-zinc-300 transition-colors z-20"
              aria-label="Template siguiente"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Sticky footer — always visible */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950">
          <button
            type="button"
            onClick={handleChoose}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Elegir este template
          </button>
        </div>
      </div>
    </div>
  );
}
