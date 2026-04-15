'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Circle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

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
  const { t } = useI18n();

  const steps = [
    { id: 'account', label: t('onboarding.account'), done: true, href: null },
    { id: 'school', label: t('onboarding.schoolName'), done: hasSchool, href: '/a/school-setup' },
    { id: 'logo', label: t('onboarding.schoolLogo'), done: hasSchoolLogo, href: '/a/school-setup' },
    { id: 'profile', label: t('onboarding.completeProfile'), done: hasAvatar, href: '/a/profile' },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allComplete = completedCount === steps.length;

  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    if (allComplete) {
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [allComplete]);

  if (allComplete && !showCelebration) return null;

  if (allComplete && showCelebration) {
    return (
      <div className="glass-card p-6">
        <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          <p className="text-lg font-semibold" style={{ color: 'var(--content-heading)' }}>
            {t('onboarding.done')}
          </p>
          <p className="text-sm" style={{ color: 'var(--content-secondary)' }}>
            {t('onboarding.doneSubtitle')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-1">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--content-heading)' }}>
          {t('onboarding.title')}
        </h2>
        <p className="text-sm" style={{ color: 'var(--content-secondary)' }}>
          {t('onboarding.subtitle')}
        </p>
      </div>

      <div className="mt-4 flex justify-end">
        <span className="text-xs" style={{ color: 'var(--content-muted)' }}>
          {completedCount}/{steps.length} {t('onboarding.completed')}
        </span>
      </div>

      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-[#bfdbfe] transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="mt-5 space-y-3">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3">
            {step.done ? (
              <>
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-sm line-through" style={{ color: 'var(--content-secondary)' }}>
                  {step.label}
                </span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 shrink-0" style={{ color: 'var(--content-muted)' }} />
                {step.href ? (
                  <Link
                    href={step.href}
                    className="flex items-center gap-1 text-sm hover:text-[#bfdbfe] transition-colors"
                    style={{ color: 'var(--content-body)' }}
                  >
                    {step.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--content-body)' }}>{step.label}</span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
