'use client';

import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';
import type { SlotCategory } from '@/lib/types';

interface ChipProps {
  label: string;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  removable?: boolean;
  className?: string;
  variant?: 'default' | 'category';
  category?: string;
}

const categoryStyleMap: Record<string, string> = {
  main_chicken: 'chip-protein',
  main_beef: 'chip-protein',
  side_veg: 'chip-vegetable',
  side_starch: 'chip-starch',
  soup: 'chip-soup',
  muffin: 'chip-dessert',
};

export function Chip({
  label,
  selected,
  onSelect,
  onRemove,
  removable,
  className,
  variant = 'default',
  category,
}: ChipProps) {
  if (variant === 'category' && category) {
    return (
      <span
        className={cn(
          'chip',
          categoryStyleMap[category] || 'chip',
          className
        )}
      >
        {label}
      </span>
    );
  }

  const isInteractive = onSelect || onRemove;

  return (
    <button
      type="button"
      onClick={onSelect || onRemove}
      disabled={!isInteractive}
      className={cn(
        isInteractive ? 'chip-interactive' : 'chip',
        selected && 'chip-selected',
        removable && 'pr-1.5',
        !isInteractive && 'cursor-default',
        className
      )}
    >
      {label}
      {removable && (
        <X
          className="w-3.5 h-3.5 ml-1.5 hover:text-error transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        />
      )}
    </button>
  );
}

interface ChipGroupProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function ChipGroup({
  options,
  selected,
  onChange,
  className,
}: ChipGroupProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => (
        <Chip
          key={option}
          label={option}
          selected={selected.includes(option)}
          onSelect={() => toggleOption(option)}
        />
      ))}
    </div>
  );
}
