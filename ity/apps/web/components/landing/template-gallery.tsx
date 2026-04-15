'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@ity/ui/utils';
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/templates/registry';
import type { Template, TemplateCategory } from '@/lib/templates/registry';
import { TemplateCard } from '@/components/landing/template-card';
import { TemplatePreviewModal } from '@/components/landing/template-preview-modal';
import { useI18n } from '@/lib/i18n/context';

interface TemplateGalleryProps {
  templates: Template[];
}

export function TemplateGallery({ templates }: TemplateGalleryProps) {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState<TemplateCategory | 'todos'>('todos');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filtered =
    activeFilter === 'todos'
      ? templates
      : templates.filter((t) => t.category === activeFilter);

  function handleFilterChange(filter: TemplateCategory | 'todos') {
    setActiveFilter(filter);
    // If a modal is open and the current index would be out of bounds, reset to 0
    if (selectedIndex !== null) {
      const newFiltered =
        filter === 'todos' ? templates : templates.filter((t) => t.category === filter);
      if (selectedIndex >= newFiltered.length) {
        setSelectedIndex(0);
      }
    }
  }

  return (
    <div>
      {/* Title section */}
      <h1 className="text-2xl font-bold" style={{ color: 'var(--content-heading)' }}>{t('templates.title')}</h1>
      <p className="mt-1" style={{ color: 'var(--content-secondary)' }}>{t('templates.subtitle')}</p>

      {/* Filter chips — sticky */}
      <div className="sticky top-0 z-10 backdrop-blur-sm py-3 -mx-4 px-4 md:-mx-6 md:px-6 mt-4" style={{ backgroundColor: 'color-mix(in srgb, var(--content-bg) 90%, transparent)' }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            type="button"
            onClick={() => handleFilterChange('todos')}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              activeFilter === 'todos'
                ? 'bg-[#bfdbfe] text-zinc-900'
                : 'hover:opacity-80'
            )}
            style={activeFilter !== 'todos' ? { background: 'var(--content-subtle-bg)', color: 'var(--content-body)' } : undefined}
          >
            {t('templates.all')}
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleFilterChange(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeFilter === cat
                  ? 'bg-[#bfdbfe] text-zinc-900'
                  : 'hover:opacity-80'
              )}
              style={activeFilter !== cat ? { background: 'var(--content-subtle-bg)', color: 'var(--content-body)' } : undefined}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid with animation */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p style={{ color: 'var(--content-secondary)' }}>
            {t('templates.noResults')}{' '}
            {activeFilter !== 'todos' ? CATEGORY_LABELS[activeFilter] : ''} {t('templates.yet')}
          </p>
          <button
            type="button"
            onClick={() => handleFilterChange('todos')}
            className="mt-3 text-[#bfdbfe] hover:text-[#93c5fd] text-sm font-medium transition-colors"
          >
            {t('templates.viewAll')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((template, index) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <TemplateCard
                  template={template}
                  onClick={() => setSelectedIndex(index)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Preview modal */}
      {selectedIndex !== null && (
        <TemplatePreviewModal
          templates={filtered}
          selectedIndex={selectedIndex}
          onChangeIndex={(i) => setSelectedIndex(i)}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}
