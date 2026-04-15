'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validations/auth';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email }),
    });

    if (res.status === 429) {
      const json = await res.json();
      setServerError(json.error);
      return;
    }

    if (!res.ok) {
      const json = await res.json();
      setServerError(json.error);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
          <Mail className="h-7 w-7 text-[#bfdbfe]" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-100">Revisa tu correo</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Enviamos un enlace para restablecer tu contrasena a
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-100">
          {getValues('email')}
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          No recibiste el correo? Revisa tu carpeta de spam o intenta de nuevo.
        </p>
        <div className="mt-6 space-y-3">
          <button
            onClick={() => setSent(false)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            Intentar con otro correo
          </button>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#bfdbfe] hover:text-[#93c5fd]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio de sesion
      </Link>

      <h2 className="text-2xl font-bold text-zinc-100">Restablece tu contrasena</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena
      </p>

      {serverError && (
        <p className="mt-4 text-sm text-[#fecaca]">{serverError}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
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
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-sm transition-colors focus:border-[#bfdbfe] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]/30"
            placeholder="tu@ejemplo.com"
            autoFocus
          />
          {errors.email && (
            <p className="mt-1 text-sm text-[#fecaca]">{errors.email.message}</p>
          )}
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
            'Enviar enlace'
          )}
        </button>
      </form>
    </div>
  );
}
