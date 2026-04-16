'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { PrdSummary } from '@/lib/prd/schema';

interface PrdSummaryCardProps {
  prdData: PrdSummary;
  onConfirm: () => void;
  onRequestChange: () => void;
  isConfirming: boolean;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <span className="text-xs" style={{ color: 'var(--content-muted)' }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: 'var(--content-heading)' }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-4 first:pt-0">
      <p
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--content-secondary)' }}
      >
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

export function PrdSummaryCard({
  prdData,
  onConfirm,
  onRequestChange,
  isConfirming,
}: PrdSummaryCardProps) {
  const { schoolInfo, visual, creator, hero, optional } = prdData;

  const testimonialCount = optional.testimonials?.length ?? 0;
  const faqCount = optional.faqItems?.length ?? 0;
  const highlightCount = optional.curriculumHighlights?.length ?? 0;

  return (
    <motion.div
      className="glass-card mx-4 my-4 p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <p
        className="mb-4 text-sm font-semibold"
        style={{ color: 'var(--content-heading)' }}
      >
        Revisa tu información antes de confirmar
      </p>

      {/* Section 1: Información básica */}
      <Section title="Información básica">
        <Row label="Nombre" value={schoolInfo.name} />
        <Row label="Tagline" value={schoolInfo.tagline} />
        <Row label="Descripción" value={schoolInfo.description} />
        <Row label="Propuesta de valor" value={schoolInfo.valueProposition} />
      </Section>

      <div className="my-3 border-t border-white/[0.06]" />

      {/* Section 2: Identidad visual */}
      <Section title="Identidad visual">
        <div className="flex flex-col gap-0.5 py-1.5">
          <span className="text-xs" style={{ color: 'var(--content-muted)' }}>
            Color primario
          </span>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border border-white/10"
              style={{ backgroundColor: visual.primaryColor }}
            />
            <span className="text-sm" style={{ color: 'var(--content-heading)' }}>
              {visual.primaryColor}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 py-1.5">
          <span className="text-xs" style={{ color: 'var(--content-muted)' }}>
            Color secundario
          </span>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border border-white/10"
              style={{ backgroundColor: visual.secondaryColor }}
            />
            <span className="text-sm" style={{ color: 'var(--content-heading)' }}>
              {visual.secondaryColor}
            </span>
          </div>
        </div>
        <Row label="Estilo" value={visual.style} />
        <Row
          label="Imagen hero"
          value={visual.heroImageUrl ? 'Sí' : 'No proporcionada'}
        />
      </Section>

      <div className="my-3 border-t border-white/[0.06]" />

      {/* Section 3: Sobre ti */}
      <Section title="Sobre ti">
        <Row label="Nombre" value={creator.name} />
        <Row label="Bio" value={creator.bio} />
        <Row label="Credenciales" value={creator.credentials ?? '—'} />
        <Row label="Por qué enseñas" value={creator.teachingReason ?? '—'} />
      </Section>

      <div className="my-3 border-t border-white/[0.06]" />

      {/* Section 4: Hero */}
      <Section title="Hero">
        <Row label="Título" value={hero.headline} />
        <Row label="Subtítulo" value={hero.subheadline} />
        <Row label="Texto del botón" value={hero.ctaText} />
      </Section>

      <div className="my-3 border-t border-white/[0.06]" />

      {/* Section 5: Secciones opcionales */}
      <Section title="Secciones opcionales">
        <Row
          label="Testimonios"
          value={testimonialCount > 0 ? `${testimonialCount} testimonio(s)` : 'Sin testimonios'}
        />
        <Row
          label="Preguntas frecuentes"
          value={faqCount > 0 ? `${faqCount} pregunta(s)` : 'Sin preguntas'}
        />
        <Row
          label="Puntos del programa"
          value={
            highlightCount > 0 ? `${highlightCount} highlight(s)` : 'Sin highlights'
          }
        />
      </Section>

      {/* Buttons */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onRequestChange}
          disabled={isConfirming}
          className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Quiero cambiar algo
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className="glass-btn flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando tu página...
            </>
          ) : (
            'Confirmar y enviar'
          )}
        </button>
      </div>
    </motion.div>
  );
}
