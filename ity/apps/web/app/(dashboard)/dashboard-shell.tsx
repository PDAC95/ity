'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { MobileNav } from '@/components/dashboard/mobile-nav';

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col bg-zinc-900">
        <Sidebar creator={creator} school={school} />
      </aside>

      {/* Mobile nav overlay */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        creator={creator}
        school={school}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          creator={creator}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
