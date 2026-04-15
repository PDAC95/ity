'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { ColorPicker } from './color-picker';
import { useI18n } from '@/lib/i18n/context';

type AvailableFont = 'inter' | 'merriweather' | 'space-mono';

type Branding = {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  font: AvailableFont;
  favicon?: string;
};

interface BrandingTabProps {
  school: {
    id: string;
    branding: Branding | null;
  } | null;
  onDirtyChange: (dirty: boolean) => void;
}

// WCAG relative luminance helpers
function hexToRelativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = hexToRelativeLuminance(hex1);
  const l2 = hexToRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const DEFAULT_PRIMARY = '#6366F1';
const DEFAULT_ACCENT = '#EC4899';

export function BrandingTab({ school, onDirtyChange }: BrandingTabProps) {
  const { t } = useI18n();
  const savedPrimary = school?.branding?.primaryColor ?? DEFAULT_PRIMARY;
  const savedAccent = school?.branding?.secondaryColor ?? DEFAULT_ACCENT;

  const [primaryColor, setPrimaryColor] = useState(savedPrimary);
  const [accentColor, setAccentColor] = useState(savedAccent);

  // Track the "clean" reference values — updated after a successful save
  const [cleanPrimary, setCleanPrimary] = useState(savedPrimary);
  const [cleanAccent, setCleanAccent] = useState(savedAccent);

  const isDirty = primaryColor !== cleanPrimary || accentColor !== cleanAccent;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const updateBrandingMutation = trpc.schools.updateBranding.useMutation({
    onSuccess: () => {
      toast.success('Colores guardados', { duration: 3000 });
      setCleanPrimary(primaryColor);
      setCleanAccent(accentColor);
    },
    onError: () => {
      toast.error('Error al guardar. Inténtalo de nuevo.');
    },
  });

  const handleSave = () => {
    if (!school?.id) return;
    updateBrandingMutation.mutate({
      id: school.id,
      branding: {
        primaryColor,
        secondaryColor: accentColor,
        font: school.branding?.font ?? 'inter',
        logo: school.branding?.logo,
        favicon: school.branding?.favicon,
      },
    });
  };

  if (school === null) {
    return (
      <p className="text-sm" style={{ color: 'var(--content-secondary)' }}>
        {t('school.noSchool')}
      </p>
    );
  }

  const lowContrast = contrastRatio(primaryColor, accentColor) < 1.5;

  return (
    <div className="space-y-8">
      {/* Color pickers */}
      <div className="grid gap-8 sm:grid-cols-2">
        <ColorPicker
          label="Color primario"
          value={primaryColor}
          onChange={setPrimaryColor}
        />
        <ColorPicker
          label="Color de acento"
          value={accentColor}
          onChange={setAccentColor}
        />
      </div>

      {/* Contrast warning */}
      {lowContrast && (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{t('school.colorWarning')}</span>
        </div>
      )}

      {/* Live preview */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--content-secondary)' }}>
          Vista previa
        </p>

        {/* Sample header bar */}
        <div
          className="rounded-lg px-4 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Mi Escuela
        </div>

        {/* Sample card with accent button */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 space-y-3">
          <h3
            className="text-sm font-semibold"
            style={{ color: primaryColor }}
          >
            Curso de ejemplo
          </h3>
          <p className="text-xs" style={{ color: 'var(--content-secondary)' }}>
            Aprende a tu ritmo con acceso de por vida.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg px-4 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: accentColor }}
            >
              Inscribirme
            </button>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: accentColor }}
            >
              Nuevo
            </span>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || updateBrandingMutation.isPending}
          className="flex items-center gap-2 glass-btn disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updateBrandingMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('school.saving')}</> : t('school.save')}
        </button>
      </div>
    </div>
  );
}
