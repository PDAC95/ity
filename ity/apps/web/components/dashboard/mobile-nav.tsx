'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { SidebarContent } from './sidebar';
import type { CreatorData, SchoolData } from '@/app/(dashboard)/dashboard-shell';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  creator: CreatorData;
  school: SchoolData | null;
}

export function MobileNav({ open, onClose, creator, school }: MobileNavProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Background overlay */}
          <motion.div
            key="overlay"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Slide-in sidebar */}
          <motion.aside
            key="sidebar"
            className="fixed inset-y-0 left-0 z-50 w-60 bg-zinc-900 md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={{ left: -240, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -300) {
                onClose();
              }
            }}
          >
            <SidebarContent creator={creator} school={school} onNavigate={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
