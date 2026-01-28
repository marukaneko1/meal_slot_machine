'use client';

import { Fragment } from 'react';
import { X, Clock, Utensils, ChefHat, ExternalLink, AlertTriangle } from 'lucide-react';
import type { DishWithRelations } from '@/lib/types';
import { SLOT_CATEGORY_LABELS } from '@/lib/types';
import { Chip } from './ui/chip';
import { cn } from '@/lib/utils/cn';

interface RecipeModalProps {
  dish: DishWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
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

export function RecipeModal({ dish, isOpen, onClose }: RecipeModalProps) {
  if (!isOpen || !dish) return null;

  const totalTime = (dish.prepTimeMinutes || 0) + (dish.cookTimeMinutes || 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'relative w-full max-w-2xl max-h-[90vh]',
            'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900',
            'rounded-2xl border-2 border-slot-accent/50 shadow-2xl',
            'overflow-hidden pointer-events-auto',
            'animate-bounce-in'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-700">
              <div className="pr-10">
                <Chip
                  label={SLOT_CATEGORY_LABELS[dish.slotCategory as keyof typeof SLOT_CATEGORY_LABELS] || dish.slotCategory}
                  variant="category"
                  category={dish.slotCategory}
                  className="mb-3"
                />
                <h2 className="text-2xl font-bold text-white mb-4">{dish.name}</h2>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {dish.kosher && (
                    <span className={cn('px-3 py-1 rounded-md text-xs font-medium', kosherStyleColors[dish.kosherStyle])}>
                      {dish.kosherStyle !== 'unknown' ? dish.kosherStyle : ''} Kosher
                    </span>
                  )}
                  {dish.difficulty !== 'unknown' && (
                    <span className={cn('flex items-center gap-1.5', difficultyColors[dish.difficulty])}>
                      <ChefHat className="w-4 h-4" />
                      <span className="capitalize">{dish.difficulty}</span>
                    </span>
                  )}
                  {totalTime > 0 && (
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-4 h-4" />
                      {totalTime} min
                      {dish.prepTimeMinutes && dish.cookTimeMinutes && (
                        <span className="text-gray-500">
                          ({dish.prepTimeMinutes} prep + {dish.cookTimeMinutes} cook)
                        </span>
                      )}
                    </span>
                  )}
                  {dish.servings && (
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Utensils className="w-4 h-4" />
                      {dish.servings} servings
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Main Protein & Cuisine */}
              {(dish.mainProtein || dish.cuisine) && (
                <div className="flex flex-wrap gap-2">
                  {dish.mainProtein && (
                    <span className="text-sm px-3 py-1.5 rounded-md bg-slot-accent/50 text-gray-300">
                      {dish.mainProtein}
                    </span>
                  )}
                  {dish.cuisine && (
                    <span className="text-sm px-3 py-1.5 rounded-md bg-slot-accent/50 text-gray-300">
                      {dish.cuisine}
                    </span>
                  )}
                </div>
              )}

              {/* Ingredients List */}
              {dish.ingredients.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-slot-gold" />
                    Ingredients
                  </h3>
                  <ul className="space-y-2">
                    {dish.ingredients.map((di) => (
                      <li
                        key={di.ingredient.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                      >
                        <span className="w-2 h-2 rounded-full bg-slot-gold flex-shrink-0" />
                        <span className="text-white">{di.ingredient.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {dish.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {dish.tags.map((dt) => (
                      <span
                        key={dt.tag.id}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-slot-purple/20 text-purple-300"
                      >
                        {dt.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergens */}
              {dish.allergens.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    Allergens
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {dish.allergens.map((da) => (
                      <span
                        key={da.allergen.id}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {da.allergen.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {dish.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Notes</h3>
                  <p className="text-white leading-relaxed">{dish.notes}</p>
                </div>
              )}

              {/* Source Link */}
              {dish.sourceUrl && (
                <div>
                  <a
                    href={dish.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-slot-purple hover:text-purple-400 transition-colors font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Recipe Source
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
