'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { GoogleAuthButton, AuthDivider, PasswordInput } from '@/components/auth';
import { isAllowedRedirect } from '@/lib/auth/redirect';
import { AuthErrorCode, getAuthMessage } from '@/lib/auth/errors';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const errorParam = searchParams.get('error');
  const message = searchParams.get('message');
  const reasonParam = searchParams.get('reason');
  const sessionToastId = useRef<string | number | null>(null);

  useEffect(() => {
    if (reasonParam === 'session_expired') {
      sessionToastId.current = toast.warning(
        getAuthMessage(AuthErrorCode.SESSION_EXPIRED)
      );
      // Clean reason from URL without losing other params (especially ?next=)
      const url = new URL(window.location.href);
      url.searchParams.delete('reason');
      window.history.replaceState({}, '', url.toString());
    }
  }, [reasonParam]);

  useEffect(() => {
    if (errorParam) {
      const msg =
        errorParam === 'auth_callback_error'
          ? 'Authentication error. Please try again.'
          : errorParam === 'too_many_requests'
            ? 'Too many attempts. Please try again later.'
            : 'An error occurred. Please try again.';
      toast.error(msg);
    }
  }, [errorParam]);

  useEffect(() => {
    if (message === 'password_reset') {
      toast.success('Contrasena actualizada. Inicia sesion.');
    }
  }, [message]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password }),
    });

    if (res.status === 429) {
      const json = await res.json();
      setServerError(json.error);
      return;
    }

    if (!res.ok) {
      const json = await res.json();
      if (json.code === AuthErrorCode.EMAIL_NOT_CONFIRMED) {
        setServerError(getAuthMessage(AuthErrorCode.EMAIL_NOT_CONFIRMED));
      } else {
        setServerError(getAuthMessage(AuthErrorCode.INVALID_CREDENTIALS));
      }
      return;
    }

    // Success — cookies set by server via Set-Cookie headers
    const nextParam = searchParams.get('next');
    const safeRedirect = isAllowedRedirect(nextParam);
    window.location.href = safeRedirect;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-zinc-100">Bienvenido de nuevo</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Inicia sesion para acceder a tu panel
      </p>

      {/* Error banner for server/callback errors */}
      {errorParam && (
        <p className="mt-4 text-sm text-[#fecaca]">
          {errorParam === 'auth_callback_error'
            ? 'Authentication error. Please try again.'
            : errorParam === 'too_many_requests'
              ? 'Too many attempts. Please try again later.'
              : 'An error occurred. Please try again.'}
        </p>
      )}

      {serverError && (
        <p className="mt-4 text-sm text-[#fecaca]">{serverError}</p>
      )}

      {/* Google OAuth */}
      <div className="mt-6">
        <GoogleAuthButton label="Continuar con Google" next={searchParams.get('next')} />
      </div>

      <AuthDivider text="o inicia sesion con email" />

      {/* Email/Password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-400"
          >
            Correo electronico
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            onFocus={() => {
              if (sessionToastId.current) {
                toast.dismiss(sessionToastId.current);
                sessionToastId.current = null;
              }
            }}
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-sm transition-colors focus:border-[#bfdbfe] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]/30"
            placeholder="tu@ejemplo.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-[#fecaca]">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-400"
            >
              Contrasena
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[#bfdbfe] hover:text-[#93c5fd]"
            >
              Olvidaste tu contrasena?
            </Link>
          </div>
          <PasswordInput
            id="password"
            label=""
            {...register('password')}
            placeholder="Ingresa tu contrasena"
            error={errors.password?.message}
          />
        </div>

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
            'Iniciar sesion'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        No tienes cuenta?{' '}
        <Link
          href="/register"
          className="font-semibold text-[#bfdbfe] hover:text-[#93c5fd]"
        >
          Crea una gratis
        </Link>
      </p>
    </div>
  );
}
