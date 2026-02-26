'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/lib/validations/auth';
import { PasswordInput } from '@/components/auth';
import { ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push('/login?message=password_reset');
  };

  return (
    <div>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
        <ShieldCheck className="h-7 w-7 text-blue-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
      <p className="mt-2 text-sm text-gray-500">
        Choose a strong password for your account
      </p>

      {serverError && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <PasswordInput
          id="password"
          label="New Password"
          {...register('password')}
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          error={errors.password?.message}
        />

        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          {...register('confirmPassword')}
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Updating...
            </span>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </div>
  );
}
