'use client';

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface PrdErrorCardProps {
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
}

export function PrdErrorCard({ onRetry, retryCount, maxRetries }: PrdErrorCardProps) {
  const isMaxed = retryCount >= maxRetries;

  return (
    <motion.div
      className="glass-card mx-4 my-4 flex flex-col items-center gap-4 p-8 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <AlertTriangle className="h-10 w-10" style={{ color: '#fef3c7' }} />

      <p className="text-sm" style={{ color: 'var(--content-secondary)' }}>
        {isMaxed
          ? 'Estamos teniendo dificultades. Tu info está guardada — intenta más tarde.'
          : 'No pudimos procesar tu solicitud. Tu información está guardada.'}
      </p>

      {isMaxed ? (
        <Link href="/a" className="glass-btn">
          Ir al dashboard
        </Link>
      ) : (
        <button type="button" onClick={onRetry} className="glass-btn">
          Intentar de nuevo
        </button>
      )}
    </motion.div>
  );
}
