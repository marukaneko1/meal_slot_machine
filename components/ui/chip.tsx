'use client';

import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

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

const categoryStyles: Record<string, string> = {
  main_chicken: 'badge-main-chicken',
  main_beef: 'badge-main-beef',
  side_veg: 'badge-side-veg',
  side_starch: 'badge-side-starch',
  soup: 'badge-soup',
  muffin: 'badge-muffin',
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
          'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
          categoryStyles[category] || 'bg-slot-accent text-gray-300',
          className
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect || onRemove}
      className={cn(
        'chip',
        selected && 'chip-selected',
        removable && 'pr-1.5',
        className
      )}
    >
      {label}
      {removable && (
        <X
          className="w-4 h-4 ml-1.5 hover:text-red-400"
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
