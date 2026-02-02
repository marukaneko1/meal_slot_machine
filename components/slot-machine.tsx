'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { DishWithRelations, SlotCategory, FilterOptions, LockedDishes } from '@/lib/types';
import { SLOT_CATEGORIES, SLOT_CATEGORY_LABELS } from '@/lib/types';
import { Lock, Unlock, Dices, RotateCw, Save, AlertCircle, ChefHat } from 'lucide-react';
import { Button } from './ui/button';
import { RecipeModal } from './recipe-modal';
import { haptic } from '@/lib/utils/haptic';
import { 
  SLOT_ANIMATION, 
  calculateTotalAnimationDuration, 
  getReelStartDelay, 
  getReelStopDelay 
} from '@/lib/utils/animation';
import { useKeyPress } from '@/lib/utils/hooks';

// Placeholder items for spinning animation
const SPIN_ITEMS = [
  'Chicken', 'Beef', 'Fish', 'Salad', 'Rice', 'Pasta',
  'Soup', 'Stew', 'Roast', 'Grilled', 'Baked', 'Fresh',
  'Savory', 'Crispy', 'Tender', 'Herbs', 'Spices', 'Garlic',
  'Lemon', 'Butter', 'Creamy', 'Spicy', 'Sweet', 'Tangy',
];

interface SlotReelProps {
  category: SlotCategory;
  dish: DishWithRelations | null;
  isSpinning: boolean;
  isLocked: boolean;
  onToggleLock: () => void;
  onViewRecipe: () => void;
  startDelay: number;
  stopDelay: number;
  error?: string;
  reelIndex: number;
}

function SlotReel({
  category,
  dish,
  isSpinning,
  isLocked,
  onToggleLock,
  onViewRecipe,
  startDelay,
  stopDelay,
  error,
  reelIndex,
}: SlotReelProps) {
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'fast' | 'slowing' | 'stopped'>('idle');
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const hasInitializedRef = useRef(false);

  // Category accent colors
  const categoryAccent: Record<SlotCategory, string> = {
    main_chicken: 'border-amber-500/40',
    main_beef: 'border-rose-500/40',
    side_veg: 'border-emerald-500/40',
    side_starch: 'border-orange-500/40',
    soup: 'border-sky-500/40',
    muffin: 'border-violet-500/40',
  };

  const categoryBg: Record<SlotCategory, string> = {
    main_chicken: 'bg-amber-500/5',
    main_beef: 'bg-rose-500/5',
    side_veg: 'bg-emerald-500/5',
    side_starch: 'bg-orange-500/5',
    soup: 'bg-sky-500/5',
    muffin: 'bg-violet-500/5',
  };

  // Memoize spin items to prevent recalculation
  const spinItems = useMemo(() => 
    [...Array(30)].map((_, i) => {
      const idx = (i + reelIndex * 7) % SPIN_ITEMS.length;
      return SPIN_ITEMS[idx];
    }),
    [reelIndex]
  );

  // Handle spin animation
  useEffect(() => {
    const clearAllTimers = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };

    if (isSpinning && !isLocked) {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;
      
      setPhase('waiting');
      clearAllTimers();

      // Start fast spinning
      const startTimer = setTimeout(() => {
        setPhase('fast');
      }, startDelay);
      timersRef.current.push(startTimer);

      // Begin slowing down
      const slowTimer = setTimeout(() => {
        setPhase('slowing');
      }, stopDelay - SLOT_ANIMATION.SLOWING_DURATION);
      timersRef.current.push(slowTimer);

      // Stop
      const stopTimer = setTimeout(() => {
        setPhase('stopped');
      }, stopDelay);
      timersRef.current.push(stopTimer);

      return clearAllTimers;
    } else if (!isSpinning) {
      hasInitializedRef.current = false;
      clearAllTimers();
      setPhase('idle');
    }
  }, [isSpinning, isLocked, startDelay, stopDelay]);

  const isAnimating = phase === 'fast' || phase === 'slowing';
  const hasStopped = phase === 'stopped' || phase === 'idle';
  const showDish = hasStopped && dish && !error && !isLocked;
  const showLoading = phase === 'stopped' && !dish && !error && !isLocked;

  return (
    <div className="flex flex-col">
      {/* Category Label */}
      <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-text-muted mb-2 text-center truncate">
        {SLOT_CATEGORY_LABELS[category]}
      </p>

      {/* Reel Container */}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-all duration-200',
          'h-32 sm:h-40',
          isLocked 
            ? 'border-accent bg-accent/5' 
            : categoryAccent[category],
          !isLocked && !error && categoryBg[category],
          error && 'border-error/50 bg-error/5',
          'shadow-sm'
        )}
        role="region"
        aria-label={`${SLOT_CATEGORY_LABELS[category]} reel`}
        aria-live={phase === 'stopped' ? 'polite' : 'off'}
      >
        {/* Top gradient fade */}
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-bg to-transparent z-10 pointer-events-none" />
        
        {/* Bottom gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-bg to-transparent z-10 pointer-events-none" />

        {/* Spinning Animation */}
        {isAnimating && (
          <div 
            className={cn(
              "absolute inset-0 flex flex-col items-center",
              phase === 'fast' && "animate-slot-fast",
              phase === 'slowing' && "animate-slot-slow"
            )}
            aria-hidden="true"
          >
            {spinItems.map((item, i) => (
              <div
                key={i}
                className="h-10 sm:h-12 flex items-center justify-center flex-shrink-0 px-2"
              >
                <span className="text-sm sm:text-base font-medium text-text-muted truncate">
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Waiting state (before this reel starts) */}
        {phase === 'waiting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-text-muted/30 border-t-accent animate-spin" />
          </div>
        )}

        {/* Loading state (reel stopped but waiting for data) */}
        {showLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse">
            <div className="w-5 h-5 rounded-full border-2 border-text-muted/30 border-t-accent animate-spin" />
            <span className="text-[10px] text-text-muted mt-2">Loading...</span>
          </div>
        )}

        {/* Result Display */}
        {showDish && (
          <button
            onClick={onViewRecipe}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-3 hover:bg-surface/50 transition-colors",
              phase === 'stopped' && "animate-slot-land"
            )}
            aria-label={`View recipe for ${dish.name}`}
          >
            <p className="font-display font-semibold text-sm sm:text-base text-text text-center leading-tight line-clamp-3 px-1">
              {dish.name}
            </p>
            {dish.kosher && (
              <span className="mt-2 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium border border-success/20">
                Kosher
              </span>
            )}
          </button>
        )}

        {/* Locked State */}
        {isLocked && dish && (
          <button
            onClick={onViewRecipe}
            className="absolute inset-0 flex flex-col items-center justify-center p-3 hover:bg-accent/10 transition-colors"
            aria-label={`View locked recipe for ${dish.name}`}
          >
            <div className="absolute top-2 right-2 p-1 rounded-full bg-accent/20">
              <Lock className="w-3 h-3 text-accent" aria-hidden="true" />
            </div>
            <p className="font-display font-semibold text-sm sm:text-base text-text text-center leading-tight line-clamp-3 px-1">
              {dish.name}
            </p>
          </button>
        )}

        {/* Error State */}
        {error && hasStopped && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center" role="alert">
            <AlertCircle className="w-5 h-5 text-error mb-1" aria-hidden="true" />
            <p className="text-[10px] sm:text-xs text-error leading-tight">{error}</p>
          </div>
        )}

        {/* Empty/Ready State */}
        {phase === 'idle' && !dish && !error && !isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-text-muted/50 mb-1" aria-hidden="true" />
            <span className="text-[10px] sm:text-xs text-text-muted">Ready</span>
          </div>
        )}
      </div>

      {/* Lock Button */}
      {dish && !isSpinning && phase === 'idle' && (
        <button
          onClick={onToggleLock}
          className={cn(
            'mt-2 px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all',
            'flex items-center justify-center gap-1',
            isLocked
              ? 'bg-accent text-bg'
              : 'bg-surface-2 text-text-secondary hover:text-text hover:bg-surface-3'
          )}
          aria-label={isLocked ? `Unlock ${dish.name}` : `Lock ${dish.name}`}
          aria-pressed={isLocked}
        >
          {isLocked ? (
            <>
              <Lock className="w-3 h-3" aria-hidden="true" /> Locked
            </>
          ) : (
            <>
              <Unlock className="w-3 h-3" aria-hidden="true" /> Lock
            </>
          )}
        </button>
      )}
    </div>
  );
}

interface SlotMachineProps {
  onSpin: (
    filters: FilterOptions,
    locks: LockedDishes
  ) => Promise<{
    success: boolean;
    dishes?: Record<SlotCategory, DishWithRelations>;
    errors?: { category?: SlotCategory; message: string }[];
    warnings?: string[];
  }>;
  onSave: (dishes: Record<SlotCategory, DishWithRelations>) => Promise<void>;
  filters: FilterOptions;
  categories?: SlotCategory[];
}

export function SlotMachine({
  onSpin,
  onSave,
  filters,
  categories = [...SLOT_CATEGORIES],
}: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [lockedDishes, setLockedDishes] = useState<LockedDishes>({});
  const [currentDishes, setCurrentDishes] = useState<Record<string, DishWithRelations>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hasSpun, setHasSpun] = useState(false);
  const [selectedDish, setSelectedDish] = useState<DishWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const spinningRef = useRef(false);

  // Calculate total animation duration dynamically
  const totalAnimationDuration = useMemo(
    () => calculateTotalAnimationDuration(categories.length),
    [categories.length]
  );

  const handleSpin = useCallback(async () => {
    if (isSpinning || spinningRef.current) return;
    spinningRef.current = true;
    
    // Haptic feedback
    haptic.spin();
    
    // Reset errors
    setErrors({});
    setWarnings([]);
    
    // Start animation IMMEDIATELY
    setIsSpinning(true);

    // Fetch dishes - this happens in parallel with animation
    try {
      const result = await onSpin(filters, lockedDishes);

      if (result.success && result.dishes) {
        // Data is ready - update dishes immediately
        // The reels will show dishes as soon as they reach 'stopped' phase
        setCurrentDishes(result.dishes);
        setHasSpun(true);
      }

      if (result.errors) {
        const errorMap: Record<string, string> = {};
        result.errors.forEach((err) => {
          if (err.category) {
            errorMap[err.category] = err.message;
          }
        });
        setErrors(errorMap);
      }

      if (result.warnings) {
        setWarnings(result.warnings);
      }
    } catch (error) {
      console.error('Spin error:', error);
      setErrors({ _global: 'Failed to generate dishes. Please try again.' });
    }

    // End spin after all animations complete (dynamic timing)
    setTimeout(() => {
      setIsSpinning(false);
      spinningRef.current = false;
    }, totalAnimationDuration);
  }, [onSpin, filters, lockedDishes, isSpinning, totalAnimationDuration]);

  // Keyboard shortcut: Space or Enter to spin
  useKeyPress('Enter', () => {
    if (!isSpinning && !isModalOpen) {
      handleSpin();
    }
  }, { disabled: isSpinning || isModalOpen });

  useKeyPress(' ', (e) => {
    if (!isSpinning && !isModalOpen) {
      e.preventDefault();
      handleSpin();
    }
  }, { disabled: isSpinning || isModalOpen });

  const handleToggleLock = useCallback((category: SlotCategory) => {
    const dish = currentDishes[category];
    if (!dish) return;

    haptic.lock();

    setLockedDishes((prev) => {
      if (prev[category]) {
        const { [category]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [category]: dish.id };
    });
  }, [currentDishes]);

  // Keyboard shortcuts: 1-6 to toggle lock on reels
  // Using a single keydown listener instead of multiple hooks to comply with Rules of Hooks
  useEffect(() => {
    if (isSpinning || isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= categories.length) {
        const category = categories[keyNum - 1];
        if (currentDishes[category]) {
          handleToggleLock(category);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, isModalOpen, categories, currentDishes, handleToggleLock]);

  const handleSaveClick = async () => {
    if (Object.keys(currentDishes).length === categories.length) {
      haptic.success();
      await onSave(currentDishes as Record<SlotCategory, DishWithRelations>);
    }
  };

  const lockedCount = Object.keys(lockedDishes).length;
  const hasAllDishes = categories.every((cat) => currentDishes[cat]);

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="alert-warning" role="alert">
          <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Heads up</p>
            <ul className="mt-1 text-sm opacity-80 space-y-0.5">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Global Error */}
      {errors._global && (
        <div className="alert-error" role="alert">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          <p>{errors._global}</p>
        </div>
      )}

      {/* Slot Machine Frame */}
      <div className="relative">
        {/* Decorative frame */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-surface-3 to-surface-2 -z-10" />
        
        {/* Main Machine Body */}
        <div className="bg-bg rounded-xl border border-border p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-text">
                Meal Slot
              </h2>
              <p className="text-sm text-text-muted mt-0.5">
                {hasSpun ? 'Tap dishes to lock, then spin again' : 'Press Space or Enter to spin'}
              </p>
            </div>
            
            {/* Spin Button */}
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={cn(
                'relative flex items-center justify-center',
                'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl',
                'font-bold text-sm sm:text-base',
                'transition-all duration-200',
                'touch-manipulation',
                isSpinning 
                  ? 'bg-surface-2 text-text-muted cursor-wait' 
                  : 'bg-accent hover:bg-accent-hover text-bg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              )}
              aria-label={isSpinning ? 'Spinning...' : 'Spin the slot machine'}
            >
              <div className="flex flex-col items-center">
                <Dices className={cn('w-6 h-6 sm:w-7 sm:h-7', isSpinning && 'animate-spin')} aria-hidden="true" />
                <span className="text-[10px] sm:text-xs mt-1 uppercase tracking-wide">
                  {isSpinning ? 'Wait' : 'Spin'}
                </span>
              </div>
            </button>
          </div>

          {/* Reels */}
          <div 
            className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3"
            role="group"
            aria-label="Slot machine reels"
          >
            {categories.map((category, index) => (
              <SlotReel
                key={category}
                category={category}
                dish={currentDishes[category] || null}
                isSpinning={isSpinning}
                isLocked={!!lockedDishes[category]}
                onToggleLock={() => handleToggleLock(category)}
                onViewRecipe={() => {
                  setSelectedDish(currentDishes[category]);
                  setIsModalOpen(true);
                }}
                startDelay={getReelStartDelay(index)}
                stopDelay={getReelStopDelay(index)}
                error={errors[category]}
                reelIndex={index}
              />
            ))}
          </div>

          {/* Footer Actions */}
          {hasSpun && !isSpinning && (
            <div className="mt-6 pt-4 border-t border-border-subtle">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-text-muted">
                  {lockedCount === 0
                    ? 'Lock your favorites (press 1-6), spin for the rest'
                    : `${lockedCount} of ${categories.length} locked`}
                </p>
                <div className="flex items-center gap-2">
                  {lockedCount > 0 && lockedCount < categories.length && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSpin}
                      disabled={isSpinning}
                    >
                      <RotateCw className={cn('w-4 h-4', isSpinning && 'animate-spin')} aria-hidden="true" />
                      Re-spin ({categories.length - lockedCount})
                    </Button>
                  )}
                  {hasAllDishes && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveClick}
                      disabled={isSpinning}
                    >
                      <Save className="w-4 h-4" aria-hidden="true" />
                      Save
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Modal */}
      <RecipeModal
        dish={selectedDish}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDish(null);
        }}
      />

      {/* Animations */}
      <style jsx global>{`
        @keyframes slot-fast {
          0% { transform: translateY(0); }
          100% { transform: translateY(-60%); }
        }
        
        @keyframes slot-slow {
          0% { transform: translateY(-60%); }
          100% { transform: translateY(-70%); }
        }
        
        @keyframes slot-land {
          0% { 
            opacity: 0; 
            transform: scale(0.9) translateY(10px); 
          }
          70% {
            opacity: 1;
            transform: scale(1.03) translateY(-3px);
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        
        .animate-slot-fast {
          animation: slot-fast 0.08s linear infinite;
        }
        
        .animate-slot-slow {
          animation: slot-slow 0.2s linear infinite;
        }
        
        .animate-slot-land {
          animation: slot-land 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
