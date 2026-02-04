'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setResent(true);
    setLoading(false);
  };

  return (
    <div className="rounded-xl bg-white p-8 shadow-lg text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <svg
          className="h-6 w-6 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
      <p className="mt-2 text-sm text-gray-600">
        We sent a verification link to
      </p>
      {email && (
        <p className="mt-1 text-sm font-medium text-gray-900">{email}</p>
      )}
      <p className="mt-3 text-sm text-gray-500">
        Click the link in the email to verify your account.
      </p>

      <div className="mt-6 space-y-3">
        {resent ? (
          <p className="text-sm text-green-600">
            Verification email resent!
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={loading || !email}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
          >
            {loading ? 'Resending...' : "Didn't receive the email? Resend"}
          </button>
        )}

        <div>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-500"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
