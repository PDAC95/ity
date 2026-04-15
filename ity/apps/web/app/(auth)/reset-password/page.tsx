'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/lib/validations/auth';
import { PasswordInput } from '@/components/auth';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setHasSession(!!user);
      setSessionChecked(true);
      if (!user) {
        router.replace('/login?error=no_recovery_session');
      }
    };
    checkSession();
  }, [supabase, router]);

  if (!sessionChecked) return null;
  if (!hasSession) return null;

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    window.location.href = '/login?message=password_reset';
  };

  return (
    <div>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
        <ShieldCheck className="h-7 w-7 text-[#bfdbfe]" />
      </div>

      <h2 className="text-2xl font-bold text-zinc-100">Establece tu nueva contrasena</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Elige una contrasena segura para tu cuenta
      </p>

      {serverError && (
        <p className="mt-4 text-sm text-[#fecaca]">{serverError}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <PasswordInput
          id="password"
          label="Nueva contrasena"
          {...register('password')}
          placeholder="Min 8 caracteres, 1 mayuscula, 1 numero"
          error={errors.password?.message}
        />

        <PasswordInput
          id="confirmPassword"
          label="Confirmar contrasena"
          {...register('confirmPassword')}
          placeholder="Repite tu contrasena"
          error={errors.confirmPassword?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#bfdbfe] px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-[#93c5fd] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Actualizar contrasena'
          )}
        </button>
      </form>
    </div>
  );
}
