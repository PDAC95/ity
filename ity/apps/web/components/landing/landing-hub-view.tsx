'use client';

import Link from 'next/link';
import { Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { TEMPLATES } from '@/lib/templates/registry';

interface LandingHubViewProps {
  status: string; // 'none' | 'pending' | 'in_progress' | 'completed'
  schoolName: string;
  templateId: string | null;
  submittedAt: string | null;
}

export function LandingHubView({
  status,
  schoolName,
  templateId,
  submittedAt,
}: LandingHubViewProps) {
  const template = templateId
    ? TEMPLATES.find((t) => t.id === templateId) ?? null
    : null;

  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="w-full">
      {/* Page header */}
      <h1
        className="text-2xl font-bold mb-8"
        style={{ color: 'var(--content-heading)' }}
      >
        Mi Página Web
      </h1>

      {status === 'none' ? (
        /* ── "Sin solicitud" empty state ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card max-w-lg mx-auto mt-8 p-8 flex flex-col items-center text-center gap-6"
        >
          {/* Icon circle */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.08]">
            <Globe className="h-9 w-9" style={{ color: 'var(--content-heading)' }} />
          </div>

          <div className="flex flex-col gap-2">
            <h2
              className="text-xl font-semibold"
              style={{ color: 'var(--content-heading)' }}
            >
              Aún no has creado tu landing page
            </h2>
            <p className="text-sm" style={{ color: 'var(--content-secondary)' }}>
              Crea la página web de tu escuela con la ayuda de nuestro asistente
              de IA
            </p>
          </div>

          <Link
            href="/a/landing/templates"
            className="glass-btn flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Crear mi landing page
          </Link>
        </motion.div>
      ) : (
        /* ── "En proceso" state ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card max-w-lg mx-auto mt-8 p-8 flex flex-col gap-5"
        >
          {/* Status badge */}
          <div>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: 'rgba(191, 219, 254, 0.1)',
                color: '#bfdbfe',
                border: '1px solid rgba(191, 219, 254, 0.2)',
              }}
            >
              En proceso
            </span>
          </div>

          {/* School name */}
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--content-heading)' }}
          >
            {schoolName}
          </h2>

          {/* Template info */}
          {template && (
            <p className="text-sm" style={{ color: 'var(--content-secondary)' }}>
              Plantilla:{' '}
              <span className="font-medium">{template.name}</span>
            </p>
          )}

          {/* Submitted date */}
          {formattedDate && (
            <p className="text-xs" style={{ color: 'var(--content-muted)' }}>
              Enviado: {formattedDate}
            </p>
          )}

          {/* Status message */}
          <p
            className="text-sm border-t pt-4"
            style={{
              color: 'var(--content-secondary)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            Estamos trabajando en tu página. Te avisaremos cuando esté lista.
          </p>
        </motion.div>
      )}
    </div>
  );
}
