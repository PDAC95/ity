'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface PrdSuccessCardProps {
  schoolName: string;
}

export function PrdSuccessCard({ schoolName }: PrdSuccessCardProps) {
  return (
    <motion.div
      className="glass-card mx-4 my-4 flex flex-col items-center gap-4 p-8 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <CheckCircle2 className="h-12 w-12" style={{ color: '#86efac' }} />

      <div className="flex flex-col gap-1.5">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--content-heading)' }}
        >
          ¡Listo! Estamos trabajando en tu página web
        </h3>
        <p className="text-sm" style={{ color: 'var(--content-secondary)' }}>
          Tu solicitud para <strong>{schoolName}</strong> ha sido enviada. Te avisaremos
          cuando esté lista.
        </p>
      </div>

      <Link href="/a/landing" className="glass-btn">
        Ver estado en dashboard
      </Link>
    </motion.div>
  );
}
