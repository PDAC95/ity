'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { generalFormSchema, type GeneralFormInput } from '@/lib/validations/school';
import { SlugAvailabilityIndicator } from './slug-availability-indicator';
import { useI18n } from '@/lib/i18n/context';

interface School {
  id: string;
  name: string;
  description: string | null;
  slug: string;
}

interface GeneralTabProps {
  school: School | null;
  onDirtyChange: (dirty: boolean) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 40);
}

export function GeneralTab({ school, onDirtyChange }: GeneralTabProps) {
  const { t } = useI18n();
  const [rawSlug, setRawSlug] = useState(school?.slug ?? '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugConflictError, setSlugConflictError] = useState<string | null>(null);

  const form = useForm<GeneralFormInput>({
    resolver: zodResolver(generalFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      name: school?.name ?? '',
      description: school?.description ?? '',
    },
  });

  const { formState, watch } = form;
  const nameValue = watch('name');
  const descValue = watch('description');

  // Notify parent of dirty state
  useEffect(() => {
    onDirtyChange(formState.isDirty);
  }, [formState.isDirty, onDirtyChange]);

  // Auto-generate slug from name when not manually edited
  useEffect(() => {
    if (!slugManuallyEdited && nameValue) {
      setRawSlug(slugify(nameValue));
    }
  }, [nameValue, slugManuallyEdited]);

  const updateMutation = trpc.schools.update.useMutation({
    onSuccess: () => {
      toast.success('Cambios guardados', { duration: 3000 });
      form.reset(form.getValues());
    },
    onError: () => {
      toast.error('Error al guardar. Inténtalo de nuevo.');
    },
  });

  const createMutation = trpc.schools.create.useMutation({
    onSuccess: () => {
      toast.success('Escuela creada', { duration: 3000 });
      form.reset(form.getValues());
    },
    onError: () => {
      toast.error('Error al crear la escuela. Inténtalo de nuevo.');
    },
  });

  const updateSlugMutation = trpc.schools.updateSlug.useMutation({
    onSuccess: () => {
      toast.success('Slug guardado', { duration: 3000 });
      setSlugConflictError(null);
    },
    onError: (error) => {
      if (error.data?.code === 'CONFLICT') {
        setSlugConflictError('este slug ya está en uso');
      } else {
        toast.error('Error al guardar el slug. Inténtalo de nuevo.');
      }
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (school?.id) {
      updateMutation.mutate({ id: school.id, name: data.name, description: data.description || null });
    } else {
      createMutation.mutate({
        name: data.name,
        slug: rawSlug || slugify(data.name),
        description: data.description,
      });
    }
  });

  const isSlugSaveable =
    school?.id &&
    rawSlug !== school?.slug &&
    rawSlug.length >= 3 &&
    /^[a-z0-9-]+$/.test(rawSlug);

  const handleSlugSave = () => {
    if (!school?.id || !isSlugSaveable) return;
    setSlugConflictError(null);
    updateSlugMutation.mutate({ id: school.id, slug: rawSlug });
  };

  const isSavingInfo = updateMutation.isPending || createMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium" style={{ color: 'var(--content-body)' }}>{t('school.name')}</label>
          <span className="text-xs" style={{ color: 'var(--content-muted)' }}>{nameValue?.length ?? 0}/60</span>
        </div>
        <input
          {...form.register('name')}
          maxLength={60}
          placeholder={t('school.namePlaceholder')}
          className="w-full glass-input"
        />
        {formState.errors.name && (
          <p className="mt-1 text-xs text-red-400">{formState.errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium" style={{ color: 'var(--content-body)' }}>{t('school.description')}</label>
          <span className="text-xs" style={{ color: 'var(--content-muted)' }}>{(descValue as string)?.length ?? 0}/500</span>
        </div>
        <textarea
          {...form.register('description')}
          maxLength={500}
          rows={3}
          placeholder={t('school.descPlaceholder')}
          className="w-full glass-input resize-none"
        />
        {formState.errors.description && (
          <p className="mt-1 text-xs text-red-400">{formState.errors.description.message}</p>
        )}
      </div>

      {/* Save name+description */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!formState.isDirty || isSavingInfo}
          className="flex items-center gap-2 glass-btn disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSavingInfo ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('school.saving')}</> : t('school.save')}
        </button>
      </div>

      {/* Slug section — only shown when school exists */}
      {school?.id && (
        <div className="border-t border-white/[0.06] pt-6">
          <div className="mb-1">
            <label className="text-sm font-medium" style={{ color: 'var(--content-body)' }}>{t('school.url')}</label>
          </div>
          <div className="flex gap-2">
            <input
              value={rawSlug}
              onChange={(e) => {
                setRawSlug(e.target.value);
                setSlugManuallyEdited(true);
                setSlugConflictError(null);
              }}
              maxLength={40}
              placeholder="mi-escuela"
              className="flex-1 glass-input"
            />
            <button
              type="button"
              onClick={handleSlugSave}
              disabled={!isSlugSaveable || updateSlugMutation.isPending}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: 'var(--content-subtle-bg)', border: '1px solid var(--content-input-border)', color: 'var(--content-body)' }}
            >
              {updateSlugMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('school.saveSlug')}
            </button>
          </div>
          <SlugAvailabilityIndicator
            slug={rawSlug}
            currentSchoolId={school.id}
            currentSlug={school.slug}
          />
          {slugConflictError && (
            <p className="mt-1 text-xs text-red-400">{slugConflictError}</p>
          )}
          <p className="mt-2 text-xs" style={{ color: 'var(--content-muted)' }}>
            12ity.com/{rawSlug || '...'}
          </p>
        </div>
      )}
    </form>
  );
}
