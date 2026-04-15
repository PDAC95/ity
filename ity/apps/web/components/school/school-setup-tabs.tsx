'use client';

import { useState } from 'react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { GeneralTab } from './general-tab';
import { BrandingTab } from './branding-tab';
import { useI18n } from '@/lib/i18n/context';

type AvailableFont = 'inter' | 'merriweather' | 'space-mono';

type Branding = {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  font: AvailableFont;
  favicon?: string;
};

interface School {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  branding: Branding | null;
}

interface SchoolSetupTabsProps {
  school: School | null;
}

type TabId = 'general' | 'branding';

export function SchoolSetupTabs({ school }: SchoolSetupTabsProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [generalIsDirty, setGeneralIsDirty] = useState(false);
  const [brandingIsDirty, setBrandingIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabId | null>(null);

  useUnsavedChanges(generalIsDirty || brandingIsDirty);

  const currentIsDirty = activeTab === 'general' ? generalIsDirty : brandingIsDirty;

  const handleTabClick = (tab: TabId) => {
    if (tab === activeTab) return;

    if (currentIsDirty) {
      setPendingTab(tab);
      setShowDiscardDialog(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleDiscard = () => {
    if (pendingTab) {
      // Reset dirty state of current tab
      if (activeTab === 'general') setGeneralIsDirty(false);
      if (activeTab === 'branding') setBrandingIsDirty(false);
      setActiveTab(pendingTab);
    }
    setPendingTab(null);
    setShowDiscardDialog(false);
  };

  const handleStay = () => {
    setPendingTab(null);
    setShowDiscardDialog(false);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'general', label: t('school.general') },
    { id: 'branding', label: t('school.branding') },
  ];

  return (
    <div className="glass-card">
      {/* Tab header */}
      <div className="flex border-b border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className="px-6 py-3 text-sm font-medium transition-colors focus:outline-none"
            style={{
              color: activeTab === tab.id ? '#bfdbfe' : 'var(--content-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid #bfdbfe' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'general' && (
          <GeneralTab
            school={school}
            onDirtyChange={setGeneralIsDirty}
          />
        )}
        {activeTab === 'branding' && (
          <BrandingTab
            school={school}
            onDirtyChange={setBrandingIsDirty}
          />
        )}
      </div>

      {/* Discard confirmation dialog */}
      {showDiscardDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm glass-card p-6">
            <h3 className="text-base font-semibold" style={{ color: 'var(--content-heading)' }}>
              {t('school.unsavedTitle')}
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--content-secondary)' }}>
              {t('school.unsavedMsg')}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleStay}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
              >
                {t('school.stay')}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
              >
                {t('school.discard')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
