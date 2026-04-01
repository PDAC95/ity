'use client';

import { useState } from 'react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { GeneralTab } from './general-tab';
import { BrandingTab } from './branding-tab';

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
    { id: 'general', label: 'General' },
    { id: 'branding', label: 'Marca' },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      {/* Tab header */}
      <div className="flex border-b border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors focus:outline-none ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
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
          <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-zinc-100">
              Cambios sin guardar
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Tienes cambios sin guardar. ¿Descartar o quedarte?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleStay}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
              >
                Quedarse
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
