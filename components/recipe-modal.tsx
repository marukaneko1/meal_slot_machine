'use client';

import { Fragment, useState } from 'react';
import { X, Clock, Utensils, ChefHat, ExternalLink, AlertTriangle, ShoppingCart, Check } from 'lucide-react';
import type { DishWithRelations } from '@/lib/types';
import { SLOT_CATEGORY_LABELS } from '@/lib/types';
import { Chip } from './ui/chip';
import { cn } from '@/lib/utils/cn';
import { addIngredientsToShoppingList } from '@/lib/utils/shopping-list';

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

/**
 * Validates if a URL is absolute (starts with http:// or https://)
 * Also normalizes URLs that might be missing the protocol
 */
function isValidUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  
  let normalized = url.trim();
  
  // If it doesn't start with http:// or https://, try to add it
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    if (normalized.startsWith('www.')) {
      normalized = 'https://' + normalized;
    } else if (normalized.includes('.') && !normalized.includes(' ')) {
      normalized = 'https://www.' + normalized;
    } else {
      return null;
    }
  }
  
  // Validate it's a proper URL
  try {
    const urlObj = new URL(normalized);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

export function RecipeModal({ dish, isOpen, onClose }: RecipeModalProps) {
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedIngredients, setAddedIngredients] = useState<Set<string>>(new Set());

  if (!isOpen || !dish) return null;

  const totalTime = (dish.prepTimeMinutes || 0) + (dish.cookTimeMinutes || 0);

  const handleAddToShoppingList = () => {
    if (dish.ingredients.length === 0) {
      alert('This recipe has no ingredients to add.');
      return;
    }

    const ingredientNames = dish.ingredients.map((di) => di.ingredient.name);
    addIngredientsToShoppingList(ingredientNames, dish.name);
    setAddedToCart(true);
    // Mark all ingredients as added
    setAddedIngredients(new Set(ingredientNames));
    setTimeout(() => {
      setAddedToCart(false);
      setAddedIngredients(new Set());
    }, 3000);
  };

  const handleAddSingleIngredient = (ingredientName: string) => {
    addIngredientsToShoppingList([ingredientName], dish.name);
    setAddedIngredients((prev) => {
      const newSet = new Set(prev);
      newSet.add(ingredientName);
      return newSet;
    });
    setTimeout(() => {
      setAddedIngredients((prev) => {
        const newSet = new Set(prev);
        newSet.delete(ingredientName);
        return newSet;
      });
    }, 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50 transition-opacity"
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-slot-gold" />
                      Ingredients
                    </h3>
                    <button
                      onClick={handleAddToShoppingList}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                        addedToCart
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : 'bg-slot-gold/10 hover:bg-slot-gold/20 text-slot-gold border border-slot-gold/30 hover:border-slot-gold/50'
                      )}
                    >
                      {addedToCart ? (
                        <>
                          <Check className="w-4 h-4" />
                          Added!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Add to Shopping List
                        </>
                      )}
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {dish.ingredients.map((di) => {
                      const ingredientName = di.ingredient.name;
                      const isAdded = addedIngredients.has(ingredientName);
                      return (
                        <li
                          key={di.ingredient.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slot-gold/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span className="w-2 h-2 rounded-full bg-slot-gold flex-shrink-0" />
                            <span className="text-white">{ingredientName}</span>
                          </div>
                          <button
                            onClick={() => handleAddSingleIngredient(ingredientName)}
                            className={cn(
                              'p-2 rounded-lg transition-all flex-shrink-0',
                              isAdded
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                : 'bg-slot-gold/10 hover:bg-slot-gold/20 text-slot-gold border border-slot-gold/30 hover:border-slot-gold/50'
                            )}
                            title={isAdded ? 'Added to shopping list' : 'Add to shopping list'}
                          >
                            {isAdded ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <ShoppingCart className="w-4 h-4" />
                            )}
                          </button>
                        </li>
                      );
                    })}
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

              {/* Source Link - Always show section */}
              <div className="pt-4 border-t border-slate-700">
                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-slot-gold" />
                  Recipe Source
                </h3>
                {(() => {
                  const validUrl = isValidUrl(dish.sourceUrl);
                  return validUrl ? (
                    <>
                      <a
                        href={validUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-slot-gold/10 hover:bg-slot-gold/20 border border-slot-gold/30 hover:border-slot-gold/50 text-slot-gold hover:text-yellow-400 transition-all font-medium group"
                      >
                        <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>View Full Recipe on Source Website</span>
                        <ExternalLink className="w-4 h-4 opacity-50" />
                      </a>
                      <p className="mt-2 text-xs text-gray-500 break-all">
                        {validUrl}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      {dish.sourceUrl ? 'Invalid source URL (must be a full URL starting with http:// or https://)' : 'No source URL available for this recipe'}
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
