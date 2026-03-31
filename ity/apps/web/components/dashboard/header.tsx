'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Menu, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@ity/ui/utils';
import { getAvatarColor, getInitials } from '@/lib/utils/avatar';
import type { CreatorData } from '@/app/(dashboard)/dashboard-shell';

const SECTION_TITLES: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/dashboard/school-setup': 'Configurar Escuela',
  '/dashboard/profile': 'Mi Perfil',
  '/dashboard/coming-soon': 'Proximamente',
};

interface HeaderProps {
  creator: CreatorData;
  onMenuClick: () => void;
}

export function Header({ creator, onMenuClick }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const title = SECTION_TITLES[pathname] ?? 'Dashboard';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const initials = getInitials(creator.name || creator.email);
  const avatarColor = getAvatarColor(creator.name || creator.email);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:text-zinc-200 md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Section title — centered on mobile, left on desktop */}
        <span className="text-base font-semibold text-zinc-100 md:text-lg">
          {title}
        </span>
      </div>

      {/* Right side: avatar + dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-zinc-800"
          aria-label="Menu de usuario"
        >
          {/* Desktop: show name + avatar */}
          <span className="hidden text-sm text-zinc-300 md:block">
            {creator.name}
          </span>
          {/* Avatar */}
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creator.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white',
                avatarColor
              )}
            >
              {initials}
            </div>
          )}
        </button>

        {dropdownOpen && (
          <>
            {/* Dismiss overlay */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            {/* Dropdown */}
            <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
              <div className="border-b border-zinc-700 px-4 py-2">
                <p className="text-sm font-medium text-zinc-100">{creator.name}</p>
                <p className="text-xs text-zinc-500">{creator.email}</p>
              </div>

              <Link
                href="/dashboard/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700/50"
              >
                <User className="h-4 w-4" />
                Mi Perfil
              </Link>

              <div className="border-t border-zinc-700">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-zinc-700/50"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
