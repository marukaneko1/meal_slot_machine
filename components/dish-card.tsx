'use client';

import { cn } from '@/lib/utils/cn';
import type { DishWithRelations } from '@/lib/types';
import { SLOT_CATEGORY_LABELS } from '@/lib/types';
import { Chip } from './ui/chip';
import {
  Clock,
  ChefHat,
  Utensils,
  ExternalLink,
  Lock,
  Unlock,
} from 'lucide-react';
import { isValidUrl } from '@/lib/utils/url';

interface DishCardProps {
  dish: DishWithRelations;
  showLock?: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
  className?: string;
  compact?: boolean;
}

const difficultyColors: Record<string, string> = {
  easy: 'text-success',
  medium: 'text-warning',
  hard: 'text-error',
  unknown: 'text-text-muted',
};

const kosherStyleColors: Record<string, string> = {
  meat: 'bg-error-subtle text-error',
  dairy: 'bg-info-subtle text-info',
  pareve: 'bg-success-subtle text-success',
  unknown: 'bg-surface-2 text-text-secondary',
};

export function DishCard({
  dish,
  showLock,
  isLocked,
  onToggleLock,
  className,
  compact = false,
}: DishCardProps) {
  const totalTime = (dish.prepTimeMinutes || 0) + (dish.cookTimeMinutes || 0);

  if (compact) {
    return (
      <div
        className={cn(
          'card-interactive p-4',
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-display font-semibold text-text truncate">{dish.name}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              <Chip
                label={SLOT_CATEGORY_LABELS[dish.slotCategory as keyof typeof SLOT_CATEGORY_LABELS] || dish.slotCategory}
                variant="category"
                category={dish.slotCategory}
              />
              {dish.kosher && (
                <span className="text-xs text-success font-medium">Kosher</span>
              )}
            </div>
          </div>
          {showLock && (
            <button
              onClick={onToggleLock}
              className={cn(
                'p-2 rounded-md transition-colors',
                isLocked
                  ? 'bg-accent-subtle text-accent'
                  : 'bg-surface-2 text-text-muted hover:text-text'
              )}
              aria-label={isLocked ? `Unlock ${dish.name}` : `Lock ${dish.name}`}
              aria-pressed={isLocked}
            >
              {isLocked ? <Lock className="w-4 h-4" aria-hidden="true" /> : <Unlock className="w-4 h-4" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  const validUrl = isValidUrl(dish.sourceUrl);

  return (
    <article
      className={cn(
        'card-interactive group',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <Chip
            label={SLOT_CATEGORY_LABELS[dish.slotCategory as keyof typeof SLOT_CATEGORY_LABELS] || dish.slotCategory}
            variant="category"
            category={dish.slotCategory}
            className="mb-2"
          />
          <h3 className="font-display font-semibold text-lg text-text group-hover:text-accent transition-colors">
            {dish.name}
          </h3>
        </div>
        {showLock && (
          <button
            onClick={onToggleLock}
            className={cn(
              'p-2 rounded-md transition-colors',
              isLocked
                ? 'bg-accent-subtle text-accent'
                : 'bg-surface-2 text-text-muted hover:text-text'
            )}
            aria-label={isLocked ? `Unlock ${dish.name}` : `Lock ${dish.name}`}
            aria-pressed={isLocked}
          >
            {isLocked ? <Lock className="w-4 h-4" aria-hidden="true" /> : <Unlock className="w-4 h-4" aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
        {dish.kosher && (
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', kosherStyleColors[dish.kosherStyle])}>
            {dish.kosherStyle !== 'unknown' ? dish.kosherStyle : ''} Kosher
          </span>
        )}
        {dish.difficulty !== 'unknown' && (
          <span className={cn('flex items-center gap-1 text-xs', difficultyColors[dish.difficulty])}>
            <ChefHat className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="capitalize">{dish.difficulty}</span>
          </span>
        )}
        {totalTime > 0 && (
          <span className="flex items-center gap-1 text-xs text-text-secondary">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {totalTime} min
          </span>
        )}
        {dish.servings && (
          <span className="flex items-center gap-1 text-xs text-text-secondary">
            <Utensils className="w-3.5 h-3.5" aria-hidden="true" />
            {dish.servings} servings
          </span>
        )}
      </div>

      {/* Protein & Cuisine */}
      {(dish.mainProtein || dish.cuisine) && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {dish.mainProtein && (
            <span className="chip text-xs capitalize">{dish.mainProtein}</span>
          )}
          {dish.cuisine && (
            <span className="chip text-xs">{dish.cuisine}</span>
          )}
        </div>
      )}

      {/* Ingredients preview */}
      {dish.ingredients.length > 0 && (
        <div className="mb-4">
          <p className="caption mb-1.5">Ingredients</p>
          <div className="flex flex-wrap gap-1">
            {dish.ingredients.slice(0, 5).map((di) => (
              <span
                key={di.ingredient.id}
                className="text-xs px-2 py-0.5 rounded bg-surface-2 text-text-secondary"
              >
                {di.ingredient.name}
              </span>
            ))}
            {dish.ingredients.length > 5 && (
              <span className="text-xs px-2 py-0.5 rounded bg-surface-2 text-text-muted">
                +{dish.ingredients.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notes preview */}
      {dish.notes && (
        <p className="body-sm italic line-clamp-2 mb-4">{dish.notes}</p>
      )}

      {/* Source link */}
      {validUrl && (
        <a
          href={validUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-text transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          View recipe
        </a>
      )}
    </article>
  );
}
