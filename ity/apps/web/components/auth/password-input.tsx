'use client';

import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, label, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-zinc-400">
          {label}
        </label>
        <div className="relative mt-1">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-sm transition-colors focus:border-[#bfdbfe] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]/30"
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200"
            tabIndex={-1}
          >
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-[#fecaca]">{error}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
