'use client';

import { cn } from '@/lib/utils/cn';
import type { DishWithRelations } from '@/lib/types';
import { SLOT_CATEGORY_LABELS } from '@/lib/types';
import { Chip } from './ui/chip';
import {
  Clock,
  ChefHat,
  Utensils,
  Star,
  AlertTriangle,
  ExternalLink,
  Lock,
  Unlock,
} from 'lucide-react';

interface DishCardProps {
  dish: DishWithRelations;
  showLock?: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
  className?: string;
  compact?: boolean;
}

const difficultyColors: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
  unknown: 'text-gray-500',
};

const kosherStyleColors: Record<string, string> = {
  meat: 'bg-red-500/20 text-red-400',
  dairy: 'bg-blue-500/20 text-blue-400',
  pareve: 'bg-green-500/20 text-green-400',
  unknown: 'bg-gray-500/20 text-gray-400',
};

/**
 * Validates if a URL is absolute (starts with http:// or https://)
 */
function isValidUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

export function DishCard({
  dish,
  showLock,
  isLocked,
  onToggleLock,
  className,
  compact = false,
}: DishCardProps) {
  const totalTime =
    (dish.prepTimeMinutes || 0) + (dish.cookTimeMinutes || 0);

  if (compact) {
    return (
      <div
        className={cn(
          'bg-slot-card rounded-xl border border-slot-accent/50 p-4',
          'transition-all duration-200 hover:border-slot-purple/50',
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-white truncate">{dish.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Chip
                label={SLOT_CATEGORY_LABELS[dish.slotCategory as keyof typeof SLOT_CATEGORY_LABELS] || dish.slotCategory}
                variant="category"
                category={dish.slotCategory}
              />
              {dish.kosher && (
                <span className="text-xs text-green-400 font-medium">✓ Kosher</span>
              )}
            </div>
          </div>
          {showLock && (
            <button
              onClick={onToggleLock}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isLocked
                  ? 'bg-slot-gold/20 text-slot-gold'
                  : 'bg-slot-accent/50 text-gray-500 hover:text-white'
              )}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-slot-card rounded-2xl border border-slot-accent/50 overflow-hidden',
        'transition-all duration-300 hover:border-slot-purple/50',
        'group',
        className
      )}
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Chip
              label={SLOT_CATEGORY_LABELS[dish.slotCategory as keyof typeof SLOT_CATEGORY_LABELS] || dish.slotCategory}
              variant="category"
              category={dish.slotCategory}
              className="mb-2"
            />
            <h3 className="font-bold text-lg text-white group-hover:text-slot-gold transition-colors">
              {dish.name}
            </h3>
          </div>
          {showLock && (
            <button
              onClick={onToggleLock}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                isLocked
                  ? 'bg-slot-gold/20 text-slot-gold glow-gold'
                  : 'bg-slot-accent/50 text-gray-500 hover:text-white hover:bg-slot-accent'
              )}
            >
              {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5 space-y-4">
        {/* Meta info row */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {dish.kosher && (
            <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium', kosherStyleColors[dish.kosherStyle])}>
              {dish.kosherStyle !== 'unknown' ? dish.kosherStyle : ''} Kosher
            </span>
          )}
          {dish.difficulty !== 'unknown' && (
            <span className={cn('flex items-center gap-1', difficultyColors[dish.difficulty])}>
              <ChefHat className="w-3.5 h-3.5" />
              {dish.difficulty}
            </span>
          )}
          {totalTime > 0 && (
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {totalTime} min
            </span>
          )}
          {dish.servings && (
            <span className="flex items-center gap-1 text-gray-400">
              <Utensils className="w-3.5 h-3.5" />
              {dish.servings} servings
            </span>
          )}
        </div>

        {/* Main protein & Cuisine */}
        <div className="flex flex-wrap gap-2">
          {dish.mainProtein && (
            <span className="text-xs px-2 py-1 rounded-md bg-slot-accent/50 text-gray-300">
              {dish.mainProtein}
            </span>
          )}
          {dish.cuisine && (
            <span className="text-xs px-2 py-1 rounded-md bg-slot-accent/50 text-gray-300">
              {dish.cuisine}
            </span>
          )}
        </div>

        {/* Ingredients */}
        {dish.ingredients.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Ingredients</p>
            <div className="flex flex-wrap gap-1">
              {dish.ingredients.slice(0, 6).map((di) => (
                <span
                  key={di.ingredient.id}
                  className="text-xs px-2 py-0.5 rounded bg-slot-accent/30 text-gray-400"
                >
                  {di.ingredient.name}
                </span>
              ))}
              {dish.ingredients.length > 6 && (
                <span className="text-xs px-2 py-0.5 rounded bg-slot-accent/30 text-gray-500">
                  +{dish.ingredients.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {dish.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dish.tags.map((dt) => (
              <span
                key={dt.tag.id}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slot-purple/20 text-purple-300"
              >
                <Star className="w-3 h-3" />
                {dt.tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Allergens */}
        {dish.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dish.allergens.map((da) => (
              <span
                key={da.allergen.id}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400"
              >
                <AlertTriangle className="w-3 h-3" />
                {da.allergen.name}
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        {dish.notes && (
          <p className="text-sm text-gray-500 italic line-clamp-2">{dish.notes}</p>
        )}

        {/* Source link */}
        {dish.sourceUrl && isValidUrl(dish.sourceUrl) && (
          <a
            href={dish.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-slot-purple hover:text-purple-400 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Recipe source
          </a>
        )}
      </div>
    </div>
  );
}
