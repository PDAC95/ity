'use client';

import { Suspense, useState } from 'react';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
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
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
        <Mail className="h-7 w-7 text-[#bfdbfe]" />
      </div>

      <h2 className="text-2xl font-bold text-zinc-100">Revisa tu correo</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Enviamos un enlace de verificacion a
      </p>
      {email && (
        <p className="mt-1 text-sm font-semibold text-zinc-100">{email}</p>
      )}
      <p className="mt-4 text-sm text-zinc-500">
        Haz clic en el enlace del correo para verificar tu cuenta y comenzar a usar ITY.
      </p>

      <div className="mt-6 space-y-3">
        {resent ? (
          <div className="flex items-center justify-center gap-2 text-sm text-[#bfdbfe]">
            <CheckCircle className="h-4 w-4" />
            Correo de verificacion reenviado!
          </div>
        ) : (
          <>
            <button
              onClick={handleResend}
              disabled={loading || !email}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                'No recibiste el correo? Reenviar'
              )}
            </button>
            {resendError && (
              <p className="text-sm text-[#fecaca]">{resendError}</p>
            )}
          </>
        )}

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
