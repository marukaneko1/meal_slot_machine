'use client';

import { cn } from '@/lib/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  className,
  id,
}: ToggleProps) {
  const toggleId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <label
      htmlFor={toggleId}
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        data-state={checked ? 'checked' : 'unchecked'}
        onClick={() => !disabled && onChange(!checked)}
        className="toggle"
      >
        <span className="toggle-thumb" />
      </button>
      {label && (
        <span className="text-sm font-medium text-text">
          {label}
        </span>
      )}
    </label>
  );
}
