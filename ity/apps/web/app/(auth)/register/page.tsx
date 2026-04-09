'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { GoogleAuthButton, AuthDivider, PasswordInput } from '@/components/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.name },
          emailRedirectTo: `${siteUrl}/auth/confirm?next=/a`,
        },
      });

      if (authError) {
        setServerError(authError.message);
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch {
      setServerError('Algo salio mal. Intenta de nuevo.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Crea tu cuenta</h2>
      <p className="mt-2 text-sm text-gray-500">
        Comienza a construir tu escuela en linea hoy
      </p>

      {serverError && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      {/* Google OAuth */}
      <div className="mt-6">
        <GoogleAuthButton label="Registrarse con Google" />
      </div>

      <AuthDivider text="o registrate con email" />

      {/* Registration form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nombre completo
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Juan Perez"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Correo electronico
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="tu@ejemplo.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <PasswordInput
          id="password"
          label="Contrasena"
          {...register('password')}
          placeholder="Min 8 caracteres, 1 mayuscula, 1 numero"
          error={errors.password?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creando cuenta...
            </span>
          ) : (
            'Crear cuenta'
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          Al crear una cuenta, aceptas nuestros{' '}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terminos de Servicio
          </Link>{' '}
          y{' '}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Politica de Privacidad
          </Link>
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-500"
        >
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}
