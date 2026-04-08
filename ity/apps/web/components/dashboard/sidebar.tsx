'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  GraduationCap,
  User,
  BookOpen,
  Users,
  BarChart3,
  UserPlus,
  Globe,
  Lock,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@ity/ui/utils';
import { getAvatarColor, getInitials } from '@/lib/utils/avatar';
import type { CreatorData, SchoolData } from '@/app/(dashboard)/dashboard-shell';

const activeItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/school-setup', label: 'Configurar Escuela', icon: GraduationCap },
  { href: '/dashboard/profile', label: 'Mi Perfil', icon: User },
  { href: '/dashboard/landing/templates', label: 'Mi Pagina Web', icon: Globe },
];

const lockedItems = [
  { label: 'Cursos', icon: BookOpen },
  { label: 'Alumnos', icon: Users },
  { label: 'Metricas', icon: BarChart3 },
  { label: 'Equipo', icon: UserPlus },
];

interface SidebarContentProps {
  creator: CreatorData;
  school: SchoolData | null;
  onNavigate?: () => void;
}

export function SidebarContent({ creator, school, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const initials = getInitials(creator.name || creator.email);
  const avatarColor = getAvatarColor(creator.name || creator.email);

  return (
    <div className="flex h-full flex-col">
      {/* Logo / school name */}
      <div className="flex h-16 flex-col justify-center px-4 border-b border-zinc-800">
        <span className="text-lg font-bold text-zinc-100">12ity</span>
        <span className="text-xs text-zinc-400 truncate">
          {school?.name ?? 'Mi Escuela'}
        </span>
      </div>

      {/* Active nav items */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {activeItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-zinc-800 text-zinc-100 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-full before:bg-indigo-500'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="mx-1 my-2 border-t border-zinc-800" />

        {/* Locked nav items */}
        {lockedItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href="/dashboard/coming-soon"
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-500 opacity-50 transition-colors hover:opacity-70"
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              <Lock className="h-3 w-3 flex-shrink-0" />
            </Link>
          );
        })}
      </nav>

      {/* Bottom: creator mini-profile + sign out */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-2 mb-2">
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creator.name}
              className="h-8 w-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className={cn(
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                avatarColor
              )}
            >
              {initials}
            </div>
          )}
          <span className="text-sm text-zinc-300 truncate">{creator.name}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300 hover:bg-zinc-800/60"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}

interface SidebarProps {
  creator: CreatorData;
  school: SchoolData | null;
}

export function Sidebar({ creator, school }: SidebarProps) {
  return <SidebarContent creator={creator} school={school} />;
}
