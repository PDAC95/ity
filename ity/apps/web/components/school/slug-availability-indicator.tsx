'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

interface SlugAvailabilityIndicatorProps {
  slug: string;
  currentSchoolId?: string;
  currentSlug?: string;
}

export function SlugAvailabilityIndicator({
  slug,
  currentSchoolId,
  currentSlug,
}: SlugAvailabilityIndicatorProps) {
  const [debouncedSlug, setDebouncedSlug] = useState(slug);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSlug(slug);
    }, 400);
    return () => clearTimeout(timer);
  }, [slug]);

  const isValidFormat = /^[a-z0-9-]+$/.test(slug);
  const isCurrentSlug = slug === currentSlug;
  const isLongEnough = debouncedSlug.length >= 3;
  const shouldQuery = isLongEnough && debouncedSlug !== currentSlug && isValidFormat;

  const { data, isFetching } = trpc.schools.checkSlug.useQuery(
    { slug: debouncedSlug, currentSchoolId },
    {
      enabled: shouldQuery,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    }
  );

  if (slug.length === 0) return null;

  if (!isValidFormat) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
        <X className="h-3 w-3" />
        Solo letras minúsculas, números y guiones
      </p>
    );
  }

  if (slug.length < 3) {
    return (
      <p className="mt-1 text-xs text-zinc-500">Mínimo 3 caracteres</p>
    );
  }

  if (isCurrentSlug) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
        <Check className="h-3 w-3" />
        Tu slug actual
      </p>
    );
  }

  if (isFetching || debouncedSlug !== slug) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Verificando...
      </p>
    );
  }

  if (data?.available === true) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
        <Check className="h-3 w-3" />
        Disponible
      </p>
    );
  }

  if (data?.available === false) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
        <X className="h-3 w-3" />
        Ya está en uso
      </p>
    );
  }

  return null;
}
