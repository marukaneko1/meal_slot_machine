'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Clock, Utensils, ChefHat, ExternalLink, AlertTriangle, ShoppingCart, Check } from 'lucide-react';
import type { DishWithRelations } from '@/lib/types';
import { SLOT_CATEGORY_LABELS } from '@/lib/types';
import { Chip } from './ui/chip';
import { Button } from './ui/button';
import { cn } from '@/lib/utils/cn';
import { addIngredientsToShoppingList } from '@/lib/utils/shopping-list';
import { isValidUrl } from '@/lib/utils/url';
import { TOAST_DURATION } from '@/lib/utils/animation';

interface RecipeModalProps {
  dish: DishWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
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

export function RecipeModal({ dish, isOpen, onClose }: RecipeModalProps) {
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedIngredients, setAddedIngredients] = useState<Set<string>>(new Set());
  
  // Refs to track timeouts for cleanup
  const cartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ingredientTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup all timeouts when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      // Clear cart timeout
      if (cartTimeoutRef.current) {
        clearTimeout(cartTimeoutRef.current);
        cartTimeoutRef.current = null;
      }
      
      // Clear all ingredient timeouts
      ingredientTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      ingredientTimeoutsRef.current.clear();
      
      // Reset state
      setAddedToCart(false);
      setAddedIngredients(new Set());
    }
    
    // Cleanup on unmount
    return () => {
      if (cartTimeoutRef.current) {
        clearTimeout(cartTimeoutRef.current);
      }
      ingredientTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
    setAddedIngredients(new Set(ingredientNames));
    
    // Clear any existing timeout
    if (cartTimeoutRef.current) {
      clearTimeout(cartTimeoutRef.current);
    }
    
    cartTimeoutRef.current = setTimeout(() => {
      setAddedToCart(false);
      setAddedIngredients(new Set());
      cartTimeoutRef.current = null;
    }, TOAST_DURATION.default);
  };

  const handleAddSingleIngredient = (ingredientName: string) => {
    addIngredientsToShoppingList([ingredientName], dish.name);
    
    setAddedIngredients((prev) => {
      const newSet = new Set(prev);
      newSet.add(ingredientName);
      return newSet;
    });
    
    // Clear any existing timeout for this ingredient
    const existingTimeout = ingredientTimeoutsRef.current.get(ingredientName);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      setAddedIngredients((prev) => {
        const newSet = new Set(prev);
        newSet.delete(ingredientName);
        return newSet;
      });
      ingredientTimeoutsRef.current.delete(ingredientName);
    }, 2000);
    
    ingredientTimeoutsRef.current.set(ingredientName, timeoutId);
  };

  const validUrl = isValidUrl(dish.sourceUrl);

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-modal-title"
      >
        <div
          className="modal-content w-full max-w-2xl max-h-[90vh] pointer-events-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-md bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text transition-colors"
            aria-label="Close recipe modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Content */}
          <div className="overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-border-subtle">
              <div className="pr-10">
                <Chip
                  label={SLOT_CATEGORY_LABELS[dish.slotCategory as keyof typeof SLOT_CATEGORY_LABELS] || dish.slotCategory}
                  variant="category"
                  category={dish.slotCategory}
                  className="mb-3"
                />
                <h2 id="recipe-modal-title" className="heading-2 text-balance">{dish.name}</h2>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                  {dish.kosher && (
                    <span className={cn('px-3 py-1 rounded text-xs font-medium', kosherStyleColors[dish.kosherStyle])}>
                      {dish.kosherStyle !== 'unknown' ? dish.kosherStyle : ''} Kosher
                    </span>
                  )}
                  {dish.difficulty !== 'unknown' && (
                    <span className={cn('flex items-center gap-1.5', difficultyColors[dish.difficulty])}>
                      <ChefHat className="w-4 h-4" aria-hidden="true" />
                      <span className="capitalize">{dish.difficulty}</span>
                    </span>
                  )}
                  {totalTime > 0 && (
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      {totalTime} min
                    </span>
                  )}
                  {dish.servings && (
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <Utensils className="w-4 h-4" aria-hidden="true" />
                      {dish.servings} servings
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Protein & Cuisine */}
              {(dish.mainProtein || dish.cuisine) && (
                <div className="flex flex-wrap gap-2">
                  {dish.mainProtein && (
                    <span className="chip capitalize">{dish.mainProtein}</span>
                  )}
                  {dish.cuisine && (
                    <span className="chip">{dish.cuisine}</span>
                  )}
                </div>
              )}

              {/* Ingredients */}
              {dish.ingredients.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="heading-4 flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-accent" aria-hidden="true" />
                      Ingredients
                    </h3>
                    <Button
                      onClick={handleAddToShoppingList}
                      variant={addedToCart ? 'accent' : 'secondary'}
                      size="sm"
                      aria-label={addedToCart ? 'All ingredients added to shopping list' : 'Add all ingredients to shopping list'}
                    >
                      {addedToCart ? (
                        <>
                          <Check className="w-4 h-4" aria-hidden="true" />
                          Added!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                          Add all to list
                        </>
                      )}
                    </Button>
                  </div>
                  <ul className="space-y-2" aria-label="Ingredient list">
                    {dish.ingredients.map((di) => {
                      const ingredientName = di.ingredient.name;
                      const isAdded = addedIngredients.has(ingredientName);
                      return (
                        <li
                          key={di.ingredient.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-2 border border-border-subtle hover:border-border transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" aria-hidden="true" />
                            <span className="text-text">{ingredientName}</span>
                          </div>
                          <button
                            onClick={() => handleAddSingleIngredient(ingredientName)}
                            className={cn(
                              'p-1.5 rounded-md transition-colors flex-shrink-0',
                              isAdded
                                ? 'bg-success-subtle text-success'
                                : 'bg-surface-3 hover:bg-accent-subtle text-text-secondary hover:text-accent'
                            )}
                            aria-label={isAdded ? `${ingredientName} added` : `Add ${ingredientName} to shopping list`}
                          >
                            {isAdded ? (
                              <Check className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <ShoppingCart className="w-4 h-4" aria-hidden="true" />
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
                  <h3 className="caption mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {dish.tags.map((dt) => (
                      <span key={dt.tag.id} className="chip">
                        {dt.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergens */}
              {dish.allergens.length > 0 && (
                <div>
                  <h3 className="caption mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" aria-hidden="true" />
                    Allergens
                  </h3>
                  <div className="flex flex-wrap gap-2" role="list" aria-label="Allergen list">
                    {dish.allergens.map((da) => (
                      <span
                        key={da.allergen.id}
                        className="chip bg-warning-subtle text-warning"
                        role="listitem"
                      >
                        {da.allergen.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {dish.notes && (
                <div>
                  <h3 className="caption mb-2">Notes</h3>
                  <p className="body-base">{dish.notes}</p>
                </div>
              )}

              {/* Source Link */}
              <div className="pt-4 border-t border-border-subtle">
                <h3 className="caption mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-accent" aria-hidden="true" />
                  Recipe Source
                </h3>
                {validUrl ? (
                  <a
                    href={validUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-accent w-full justify-center"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    View Full Recipe
                  </a>
                ) : (
                  <p className="body-sm italic">No source URL available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
