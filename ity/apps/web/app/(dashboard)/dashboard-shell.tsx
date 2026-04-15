'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Home,
  GraduationCap,
  User,
  Globe,
  BookOpen,
  Users,
  BarChart3,
  UserPlus,
  LogOut,
  Lock,
  Menu,
  X,
  Plus,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@ity/ui/utils';
import { getAvatarColor, getInitials } from '@/lib/utils/avatar';
import { AnimatePresence, motion } from 'framer-motion';

export interface CreatorData {
  id: string;
  name: string;
  avatarUrl: string | null;
  email: string;
}

export interface SchoolData {
  id: string;
  name: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    font: string;
    favicon?: string;
  } | null;
}

const navItems = [
  { href: '/a', label: 'Inicio', icon: Home },
  { href: '/a/school-setup', label: 'Escuela', icon: GraduationCap },
  { href: '/a/landing/templates', label: 'Mi Pagina', icon: Globe },
  { href: '/a/profile', label: 'Perfil', icon: User },
];

const lockedItems = [
  { label: 'Cursos', icon: BookOpen },
  { label: 'Alumnos', icon: Users },
  { label: 'Metricas', icon: BarChart3 },
  { label: 'Equipo', icon: UserPlus },
];

const quickActions = [
  { href: '/a/landing/templates', label: 'Mi Pagina', icon: Globe, color: '#c4f0c2' },
  { href: '/a/school-setup', label: 'Escuela', icon: GraduationCap, color: '#f5c2d6' },
  { href: '/a/landing/chat', label: 'Chat AI', icon: Sparkles, color: '#fef3c7' },
  { href: '/a/profile', label: 'Perfil', icon: User, color: '#bfdbfe' },
  { href: '/a/coming-soon', label: 'Cursos', icon: BookOpen, color: '#ddd6fe' },
  { href: '/a/coming-soon', label: 'Alumnos', icon: Users, color: '#fbcfe8' },
];

interface DashboardShellProps {
  creator: CreatorData;
  school: SchoolData | null;
  children: React.ReactNode;
}

export function DashboardShell({
  creator,
  school,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notchX, setNotchX] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const navRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const bubbleRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === '/a') return pathname === '/a';
    return pathname.startsWith(href);
  };

  const updateNotchPosition = useCallback(() => {
    const activeHref = navItems.find((item) => isActive(item.href))?.href;
    if (!activeHref || !bubbleRef.current) {
      setNotchX(null);
      return;
    }
    const el = navItemRefs.current.get(activeHref);
    if (!el) return;

    const elRect = el.getBoundingClientRect();
    const bubbleRect = bubbleRef.current.getBoundingClientRect();
    const centerX = elRect.left + elRect.width / 2 - bubbleRect.left;
    setNotchX(centerX);
  }, [pathname]);

  useEffect(() => {
    updateNotchPosition();
    window.addEventListener('resize', updateNotchPosition);
    return () => window.removeEventListener('resize', updateNotchPosition);
  }, [updateNotchPosition]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const initials = getInitials(creator.name || creator.email);
  const avatarColor = getAvatarColor(creator.name || creator.email);

  const NOTCH_W = 160;
  const NOTCH_H = 18;

  return (
    <div className="flex h-screen flex-col bg-black p-2 md:p-3">
      {/* Navbar */}
      <nav className="flex h-14 flex-shrink-0 items-center justify-between px-4 md:px-6">
        {/* Left: Logo */}
        <Link href="/a" className="flex items-center">
          <span className="text-xl font-bold text-white tracking-tight">
            ITY
          </span>
        </Link>

        {/* Center: Nav icons — desktop */}
        <div
          ref={navRef}
          className="hidden md:flex items-center gap-1 rounded-full bg-zinc-900/80 px-2 py-1.5 border border-zinc-800/50"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => {
                  if (el) navItemRefs.current.set(item.href, el);
                }}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {active && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* Locked items as disabled icons */}
          <div className="mx-1 h-5 w-px bg-zinc-700/50" />
          {lockedItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href="/a/coming-soon"
                className="relative flex items-center rounded-full px-3 py-2 text-zinc-600 transition-colors hover:text-zinc-500"
                title={`${item.label} (Proximamente)`}
              >
                <Icon className="h-4 w-4" />
                <Lock className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5" />
              </Link>
            );
          })}
        </div>

        {/* Right: User */}
        <div className="flex items-center gap-3">
          {/* Desktop: user dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-3 transition-colors hover:bg-zinc-900/80"
            >
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-zinc-700"
                />
              ) : (
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-zinc-700',
                    avatarColor
                  )}
                >
                  {initials}
                </div>
              )}
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-zinc-200 leading-tight">{creator.name}</span>
                <span className="text-xs text-zinc-500 leading-tight">{school?.name ?? 'Mi Escuela'}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-2xl">
                  <div className="border-b border-zinc-800 px-4 py-3">
                    <p className="text-sm font-medium text-white">
                      {creator.name}
                    </p>
                    <p className="text-xs text-zinc-500">{creator.email}</p>
                  </div>
                  <Link
                    href="/a/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <User className="h-4 w-4" />
                    Mi Perfil
                  </Link>
                  <Link
                    href="/a/school-setup"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Configurar Escuela
                  </Link>
                  <div className="border-t border-zinc-800">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-zinc-800"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile: avatar + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.name}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-zinc-700"
              />
            ) : (
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-zinc-700',
                  avatarColor
                )}
              >
                {initials}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:text-white"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-2 right-2 top-16 z-50 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-2xl md:hidden"
          >
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      active
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="mx-2 my-2 border-t border-zinc-800" />

              {lockedItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href="/a/coming-soon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-600"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    <Lock className="h-3.5 w-3.5" />
                  </Link>
                );
              })}

              <div className="mx-2 my-2 border-t border-zinc-800" />

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 transition-colors hover:bg-zinc-800"
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesion
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content bubble with notch */}
      <div ref={bubbleRef} className="relative flex-1 mt-2 flex flex-col min-h-0">
        {/* Notch SVG — bubble bump rising into navbar */}
        {notchX !== null && (
          <svg
            className="absolute left-0 w-full pointer-events-none hidden md:block z-10"
            style={{ height: NOTCH_H, top: -(NOTCH_H - 2) }}
          >
            <path
              d={`
                M ${notchX - NOTCH_W / 2},${NOTCH_H}
                C ${notchX - NOTCH_W / 3},${NOTCH_H} ${notchX - NOTCH_W / 6},${NOTCH_H} ${notchX - NOTCH_W / 8},${NOTCH_H * 0.6}
                Q ${notchX},${-NOTCH_H * 0.1} ${notchX + NOTCH_W / 8},${NOTCH_H * 0.6}
                C ${notchX + NOTCH_W / 6},${NOTCH_H} ${notchX + NOTCH_W / 3},${NOTCH_H} ${notchX + NOTCH_W / 2},${NOTCH_H}
              `}
              fill="#f8f8f8"
              stroke="none"
            />
          </svg>
        )}
        <div className="relative flex-1 overflow-hidden rounded-3xl" style={{ backgroundColor: '#f8f8f8' }}>
          <main className="h-full overflow-auto p-4 pb-20 md:p-8 md:pb-24">{children}</main>

          {/* Dock — connected to bottom black background */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 hidden md:block">
            <div style={{ perspective: '600px' }}>
              <div
                className="flex items-center gap-2 bg-black px-6 py-3"
                style={{
                  borderRadius: '16px 16px 0 0',
                  transform: 'rotateX(8deg)',
                  transformOrigin: 'bottom center',
                }}
              >
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110"
                      style={{ backgroundColor: action.color }}
                      title={action.label}
                    >
                      <Icon className="h-5 w-5 text-zinc-800" />
                      <span className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-white whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none shadow-lg">
                        {action.label}
                      </span>
                    </Link>
                  );
                })}
                <div className="mx-0.5 h-6 w-px bg-zinc-600/50" />
                <Link
                  href="/a/coming-soon"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-700 transition-transform duration-200 hover:scale-110"
                  title="Mas opciones"
                >
                  <Plus className="h-5 w-5 text-zinc-300" />
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile dock — floating pill */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex md:hidden">
            <div className="flex items-center gap-2 rounded-full bg-black/95 px-3 py-2.5 shadow-2xl">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110"
                    style={{ backgroundColor: action.color }}
                    title={action.label}
                  >
                    <Icon className="h-4 w-4 text-zinc-800" />
                  </Link>
                );
              })}
              <Link
                href="/a/coming-soon"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700"
                title="Mas opciones"
              >
                <Plus className="h-4 w-4 text-zinc-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
