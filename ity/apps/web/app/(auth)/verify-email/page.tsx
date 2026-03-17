'use client';

import { Suspense, useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    setResendError(null);

    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (res.status === 429) {
      const json = await res.json();
      setResendError(json.error);
      setLoading(false);
      return;
    }

    if (!res.ok) {
      const json = await res.json();
      setResendError(json.error);
      setLoading(false);
      return;
    }

    setResent(true);
    setLoading(false);
  };

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
        <Mail className="h-7 w-7 text-blue-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Revisa tu correo</h2>
      <p className="mt-2 text-sm text-gray-500">
        Enviamos un enlace de verificacion a
      </p>
      {email && (
        <p className="mt-1 text-sm font-semibold text-gray-900">{email}</p>
      )}
      <p className="mt-4 text-sm text-gray-400">
        Haz clic en el enlace del correo para verificar tu cuenta y comenzar a usar ITY.
      </p>

      <div className="mt-6 space-y-3">
        {resent ? (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Correo de verificacion reenviado!
          </div>
        ) : (
          <>
            <button
              onClick={handleResend}
              disabled={loading || !email}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  Reenviando...
                </span>
              ) : (
                'No recibiste el correo? Reenviar'
              )}
            </button>
            {resendError && (
              <p className="text-sm text-red-600">{resendError}</p>
            )}
          </>
        )}

        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesion
        </Link>
      </div>
    </div>
  );
}
