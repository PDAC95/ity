'use client';

import { useEffect, useState } from 'react';

const PRESET_SWATCHES = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#06B6D4',
  '#3B82F6',
  '#1D4ED8',
  '#6B7280',
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);

  // Sync local input when external value changes (e.g. swatch click or native picker)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleHexInput = (raw: string) => {
    setInputValue(raw);
    if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
      onChange(raw);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-zinc-200">{label}</label>

      {/* Native color picker + hex text input */}
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
        />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleHexInput(e.target.value)}
          maxLength={7}
          placeholder="#6366F1"
          className="w-28 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Preset swatches */}
      <div className="flex flex-wrap gap-2">
        {PRESET_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onChange(swatch)}
            style={{ backgroundColor: swatch }}
            className={`h-7 w-7 rounded-full border-2 transition-colors hover:border-zinc-300 ${
              value === swatch
                ? 'border-white ring-2 ring-white'
                : 'border-transparent'
            }`}
            aria-label={swatch}
          />
        ))}
      </div>
    </div>
  );
}
