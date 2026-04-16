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
  ChevronUp,
  Sun,
  Moon,
  Bell,
} from 'lucide-react';
import { cn } from '@ity/ui/utils';
import { getAvatarColor, getInitials } from '@/lib/utils/avatar';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { I18nProvider, useI18n } from '@/lib/i18n/context';

const LANGUAGES = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
] as const;

// ── Custom scroll indicator ──
function ScrollIndicator({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const [scrollRatio, setScrollRatio] = useState(0);
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      const canScroll = maxScroll > 10;
      setVisible(canScroll);
      if (!canScroll) return;
      setScrollRatio(scrollTop / maxScroll);
      setShowUp(scrollTop > 10);
      setShowDown(scrollTop < maxScroll - 10);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [containerRef]);

  if (!visible) return null;

  const scroll = (dir: 'up' | 'down') => {
    containerRef.current?.scrollBy({ top: dir === 'up' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2">
      <button
        onClick={() => scroll('up')}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200',
          !showUp && 'opacity-0 pointer-events-none'
        )}
        style={{ background: 'var(--content-scroll-btn)', border: '1px solid var(--content-scroll-btn-border)', color: 'var(--content-scroll-btn-text)' }}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>

      {/* Track */}
      <div className="relative h-20 w-1 rounded-full" style={{ background: 'var(--content-scroll-track)' }}>
        <motion.div
          className="absolute left-1/2 h-5 w-5 -translate-x-1/2 rounded-full backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
          style={{ top: `${scrollRatio * (80 - 20)}px`, background: 'var(--content-scroll-thumb)', border: '1px solid var(--content-scroll-btn-border)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      <button
        onClick={() => scroll('down')}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200',
          !showDown && 'opacity-0 pointer-events-none'
        )}
        style={{ background: 'var(--content-scroll-btn)', border: '1px solid var(--content-scroll-btn-border)', color: 'var(--content-scroll-btn-text)' }}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

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

const NAV_ITEMS = [
  { href: '/a', key: 'nav.home', icon: Home },
  { href: '/a/school-setup', key: 'nav.school', icon: GraduationCap },
  { href: '/a/landing', key: 'nav.myPage', icon: Globe },
  { href: '/a/profile', key: 'nav.profile', icon: User },
];

const LOCKED_ITEMS = [
  { key: 'nav.courses', icon: BookOpen },
  { key: 'nav.students', icon: Users },
  { key: 'nav.metrics', icon: BarChart3 },
  { key: 'nav.team', icon: UserPlus },
];

const QUICK_ACTIONS = [
  { href: '/a/landing', key: 'nav.myPage', icon: Globe, color: '#c4f0c2' },
  { href: '/a/school-setup', key: 'nav.school', icon: GraduationCap, color: '#f5c2d6' },
  { href: '/a/landing/chat', key: 'nav.chatAi', icon: Sparkles, color: '#fef3c7' },
  { href: '/a/profile', key: 'nav.profile', icon: User, color: '#bfdbfe' },
  { href: '/a/coming-soon', key: 'nav.courses', icon: BookOpen, color: '#ddd6fe' },
  { href: '/a/coming-soon', key: 'nav.students', icon: Users, color: '#fbcfe8' },
];

interface DashboardShellProps {
  creator: CreatorData;
  school: SchoolData | null;
  children: React.ReactNode;
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <I18nProvider>
      <DashboardShellInner {...props} />
    </I18nProvider>
  );
}

function DashboardShellInner({
  creator,
  school,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [notchX, setNotchX] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const { lang: currentLang, setLang: setCurrentLang, t } = useI18n();

  useEffect(() => setMounted(true), []);

  // Close lang dropdown on any click outside
  useEffect(() => {
    if (!langDropdownOpen) return;
    const close = () => setLangDropdownOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [langDropdownOpen]);

  const navRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const bubbleRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === '/a') return pathname === '/a';
    return pathname.startsWith(href);
  };

  const updateNotchPosition = useCallback(() => {
    const activeHref = NAV_ITEMS.find((item) => isActive(item.href))?.href;
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
  }, [pathname, currentLang]);

  useEffect(() => {
    // Small delay to let the DOM settle after language change
    const raf = requestAnimationFrame(updateNotchPosition);
    window.addEventListener('resize', updateNotchPosition);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', updateNotchPosition); };
  }, [updateNotchPosition]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const initials = getInitials(creator.name || creator.email);
  const avatarColor = getAvatarColor(creator.name || creator.email);

  const mainRef = useRef<HTMLElement>(null);
  const NOTCH_W = 160;
  const NOTCH_H = 18;

  return (
    <div className="flex h-screen flex-col bg-black p-2 md:p-3">
      {/* Navbar */}
      <nav className="flex h-14 flex-shrink-0 items-center justify-between px-4 md:px-6">
        {/* Left: Logo + theme toggle */}
        <div className="flex items-center gap-5">
          <Link href="/a" className="flex items-center">
            <span className="text-xl font-bold text-white tracking-tight">
              ITY
            </span>
          </Link>
          {mounted && (
            <div className="flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.08] p-1">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200',
                  theme === 'light'
                    ? 'bg-[#bfdbfe] text-zinc-900 shadow-[0_2px_8px_-2px_rgba(191,219,254,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
                aria-label="Modo claro"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200',
                  theme === 'dark'
                    ? 'bg-[#bfdbfe] text-zinc-900 shadow-[0_2px_8px_-2px_rgba(191,219,254,0.4)]'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
                aria-label="Modo oscuro"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Center: Nav icons — desktop */}
        <div
          ref={navRef}
          className="hidden md:flex items-center gap-1 rounded-full bg-zinc-900/80 px-2 py-1.5 border border-zinc-800/50"
        >
          {NAV_ITEMS.map((item) => {
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
                {active && <span>{t(item.key)}</span>}
              </Link>
            );
          })}

          {/* Locked items as disabled icons */}
          <div className="mx-1 h-5 w-px bg-zinc-700/50" />
          {LOCKED_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href="/a/coming-soon"
                className="relative flex items-center rounded-full px-3 py-2 text-zinc-600 transition-colors hover:text-zinc-500"
                title={`${t(item.key)} (${t('nav.comingSoon')})`}
              >
                <Icon className="h-4 w-4" />
                <Lock className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5" />
              </Link>
            );
          })}
        </div>

        {/* Right: Actions + User */}
        <div className="flex items-center gap-2">
          {/* Language selector — desktop */}
          <div className="relative hidden md:block">
            <button
              onClick={(e) => { e.stopPropagation(); setLangDropdownOpen(!langDropdownOpen); setDropdownOpen(false); }}
              className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] px-3 text-sm text-white transition-all duration-200 hover:bg-white/[0.1]"
              aria-label={t('common.changeLang')}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase">{currentLang}</span>
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-44 rounded-2xl border border-white/[0.08] bg-zinc-900/95 backdrop-blur-xl py-1 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
                {LANGUAGES.map((lng) => (
                  <button
                    key={lng.code}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCurrentLang(lng.code); setLangDropdownOpen(false); }}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                      currentLang === lng.code
                        ? 'text-[#bfdbfe]'
                        : 'text-white hover:bg-white/[0.06]'
                    )}
                  >
                    <span className="text-base">{lng.flag}</span>
                    <span>{lng.label}</span>
                    {currentLang === lng.code && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#bfdbfe]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification bell — desktop */}
          <button
            className="relative hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-400 transition-all duration-200 hover:bg-white/[0.1] hover:text-zinc-200"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            {/* Red dot for unread */}
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-black" />
          </button>

          {/* Desktop: user dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => { setDropdownOpen(!dropdownOpen); setLangDropdownOpen(false); }}
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
                <span className="text-xs text-zinc-500 leading-tight">{school?.name ?? t('user.mySchool')}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-white/[0.08] bg-zinc-900/90 backdrop-blur-xl py-1 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
                  <div className="border-b border-white/[0.06] px-4 py-3">
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
                    {t('user.myProfile')}
                  </Link>
                  <Link
                    href="/a/school-setup"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <GraduationCap className="h-4 w-4" />
                    {t('user.configSchool')}
                  </Link>
                  <div className="border-t border-white/[0.06]">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-zinc-800"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('user.signOut')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile: lang + bell + avatar + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              className="flex h-8 items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.08] px-2 text-sm text-white"
              aria-label={t('common.changeLang')}
            >
              <Globe className="h-3 w-3" />
              <span className="text-[10px] font-medium uppercase">{currentLang}</span>
            </button>
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-400"
              aria-label="Notificaciones"
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-black" />
            </button>
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
              {NAV_ITEMS.map((item) => {
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
                    {t(item.key)}
                  </Link>
                );
              })}

              <div className="mx-2 my-2 border-t border-zinc-800" />

              {LOCKED_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href="/a/coming-soon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-600"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1">{t(item.key)}</span>
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
                {t('user.signOut')}
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
              fill="var(--notch-fill)"
              stroke="none"
            />
          </svg>
        )}
        <div className="relative flex-1 overflow-hidden rounded-3xl" style={{ backgroundColor: 'var(--content-bg)' }}>
          <ScrollIndicator containerRef={mainRef} />
          <main ref={mainRef} className="premium-scroll h-full overflow-auto p-4 pb-20 md:p-8 md:pb-24">
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </main>

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
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.key}
                      href={action.href}
                      className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110"
                      style={{ backgroundColor: action.color }}
                      title={t(action.key)}
                    >
                      <Icon className="h-5 w-5 text-zinc-800" />
                      <span className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-white whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none shadow-lg">
                        {t(action.key)}
                      </span>
                    </Link>
                  );
                })}
                <div className="mx-0.5 h-6 w-px bg-zinc-600/50" />
                <Link
                  href="/a/coming-soon"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-700 transition-transform duration-200 hover:scale-110"
                  title={t('nav.moreOptions')}
                >
                  <Plus className="h-5 w-5 text-zinc-300" />
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile dock — floating pill */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex md:hidden">
            <div className="flex items-center gap-2 rounded-full bg-black/95 px-3 py-2.5 shadow-2xl">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.key}
                    href={action.href}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110"
                    style={{ backgroundColor: action.color }}
                    title={t(action.key)}
                  >
                    <Icon className="h-4 w-4 text-zinc-800" />
                  </Link>
                );
              })}
              <Link
                href="/a/coming-soon"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700"
                title={t('nav.moreOptions')}
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
