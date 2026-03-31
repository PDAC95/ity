'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Circle, CheckCircle2, ArrowRight } from 'lucide-react';

interface OnboardingChecklistProps {
  hasSchool: boolean;
  hasSchoolLogo: boolean;
  hasAvatar: boolean;
}

export function OnboardingChecklist({
  hasSchool,
  hasSchoolLogo,
  hasAvatar,
}: OnboardingChecklistProps) {
  const steps = [
    { id: 'account', label: 'Cuenta creada', done: true, href: null },
    {
      id: 'school',
      label: 'Nombre de escuela',
      done: hasSchool,
      href: '/dashboard/school-setup',
    },
    {
      id: 'logo',
      label: 'Logo de escuela',
      done: hasSchoolLogo,
      href: '/dashboard/school-setup',
    },
    {
      id: 'profile',
      label: 'Completar perfil',
      done: hasAvatar,
      href: '/dashboard/profile',
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allComplete = completedCount === steps.length;

  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    if (allComplete) {
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allComplete]);

  if (allComplete && !showCelebration) {
    return null;
  }

  if (allComplete && showCelebration) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          <p className="text-lg font-semibold text-zinc-100">
            Tu escuela esta lista!
          </p>
          <p className="text-sm text-zinc-400">
            Ya puedes comenzar a crear contenido
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {/* Header */}
      <div className="mb-1">
        <h2 className="text-lg font-semibold text-zinc-100">
          Configura tu escuela
        </h2>
        <p className="text-sm text-zinc-400">
          Completa estos pasos para comenzar
        </p>
      </div>

      {/* Progress label */}
      <div className="mt-4 flex justify-end">
        <span className="text-xs text-zinc-500">
          {completedCount}/{steps.length} completados
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <ul className="mt-5 space-y-3">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3">
            {step.done ? (
              <>
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-sm text-zinc-400 line-through">
                  {step.label}
                </span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 shrink-0 text-zinc-600" />
                {step.href ? (
                  <Link
                    href={step.href}
                    className="flex items-center gap-1 text-sm text-zinc-200 hover:text-indigo-400 transition-colors"
                  >
                    {step.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="text-sm text-zinc-200">{step.label}</span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
