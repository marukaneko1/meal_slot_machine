'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import type { DishWithRelations, SlotCategory, FilterOptions, LockedDishes } from '@/lib/types';
import { SLOT_CATEGORIES, SLOT_CATEGORY_LABELS } from '@/lib/types';
import { Lock, Unlock, Dices, RefreshCw, Save, AlertTriangle, ChefHat } from 'lucide-react';
import { Button } from './ui/button';
import { RecipeModal } from './recipe-modal';

// Slot symbols for spinning animation
const SLOT_SYMBOLS = ['🍗', '🥩', '🥦', '🍚', '🍲', '🧁', '🍳', '🥗', '🍖', '🌽', '🥕', '🧀'];

interface SlotReelProps {
  category: SlotCategory;
  dish: DishWithRelations | null;
  isSpinning: boolean;
  isLocked: boolean;
  onToggleLock: () => void;
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
  stopDelay,
  error,
  reelIndex,
}: SlotReelProps) {
  const [internalSpinning, setInternalSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Category colors
  const categoryColors: Record<SlotCategory, { border: string; text: string; glow: string }> = {
    main_chicken: { border: 'border-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/30' },
    main_beef: { border: 'border-red-500', text: 'text-red-400', glow: 'shadow-red-500/30' },
    side_veg: { border: 'border-green-500', text: 'text-green-400', glow: 'shadow-green-500/30' },
    side_starch: { border: 'border-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/30' },
    soup: { border: 'border-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/30' },
    muffin: { border: 'border-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
  };

  const categoryEmoji: Record<SlotCategory, string> = {
    main_chicken: '🍗',
    main_beef: '🥩',
    side_veg: '🥦',
    side_starch: '🍚',
    soup: '🍲',
    muffin: '🧁',
  };

  const colors = categoryColors[category];

  // Handle spinning state
  useEffect(() => {
    if (isSpinning && !isLocked) {
      setInternalSpinning(true);
      setShowResult(false);
      
      // Stop spinning after delay
      const stopTimer = setTimeout(() => {
        setInternalSpinning(false);
        // Small delay before showing result for dramatic effect
        setTimeout(() => {
          setShowResult(true);
        }, 100);
      }, stopDelay);

      return () => clearTimeout(stopTimer);
    } else if (!isSpinning) {
      // When parent stops spinning, make sure we show result
      if (!isLocked && dish) {
        setInternalSpinning(false);
        setShowResult(true);
      }
    }
  }, [isSpinning, isLocked, stopDelay, dish]);

  // Generate spinning items
  const spinningItems = [...Array(20)].map((_, i) => {
    const symbolIndex = (i + reelIndex * 3) % SLOT_SYMBOLS.length;
    return SLOT_SYMBOLS[symbolIndex];
  });

  return (
    <div className="flex flex-col items-center flex-1 min-w-0 max-w-[140px]">
      {/* Category Label */}
      <div className={cn('text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 truncate text-center w-full', colors.text)}>
        {SLOT_CATEGORY_LABELS[category].replace(/[()]/g, '').trim()}
      </div>

      {/* Reel Container */}
      <div
        ref={containerRef}
        className={cn(
          'relative w-full h-32 sm:h-40 rounded-xl border-2 overflow-hidden',
          'bg-gradient-to-b from-slate-800 to-slate-900',
          isLocked ? 'border-slot-gold shadow-lg shadow-slot-gold/30' : colors.border,
          error && 'border-red-500 bg-red-900/20',
          showResult && !error && 'shadow-lg',
          showResult && !error && colors.glow
        )}
      >
        {/* Spinning Animation */}
        {internalSpinning && (
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="flex flex-col items-center"
              style={{
                animation: `slotSpin 0.1s linear infinite`,
              }}
            >
              {spinningItems.map((symbol, i) => (
                <div
                  key={i}
                  className="text-4xl sm:text-5xl h-16 sm:h-20 flex items-center justify-center flex-shrink-0"
                >
                  {symbol}
                </div>
              ))}
            </div>
            {/* Blur effect at top and bottom */}
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-slate-800 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Result Display - only show when NOT locked */}
        {!internalSpinning && showResult && dish && !error && !isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 animate-bounce-in">
            <div className="text-4xl sm:text-5xl mb-1">
              {categoryEmoji[category]}
            </div>
            <div className="text-center px-1">
              <p className="text-[10px] sm:text-xs font-bold text-white leading-tight line-clamp-2">
                {dish.name}
              </p>
              {dish.kosher && (
                <span className="inline-block mt-1 text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                  Kosher
                </span>
              )}
            </div>
          </div>
        )}

        {/* Locked Dish Display */}
        {isLocked && dish && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
            <div className="absolute top-1 right-1 bg-slot-gold rounded-full p-1">
              <Lock className="w-3 h-3 text-slot-bg" />
            </div>
            <div className="text-4xl sm:text-5xl mb-1">
              {categoryEmoji[category]}
            </div>
            <div className="text-center px-1">
              <p className="text-[10px] sm:text-xs font-bold text-white leading-tight line-clamp-2">
                {dish.name}
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && !internalSpinning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mb-1" />
            <p className="text-[9px] sm:text-[10px] text-red-400 leading-tight">{error}</p>
          </div>
        )}

        {/* Idle State */}
        {!internalSpinning && !showResult && !dish && !error && !isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ChefHat className="w-8 h-8 text-gray-600 mb-2" />
            <span className="text-[10px] text-gray-600">Ready</span>
          </div>
        )}

        {/* Center line indicator */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 sm:h-14 border-y-2 border-white/10 pointer-events-none" />
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Lock Button */}
      {dish && !isSpinning && !internalSpinning && (
        <button
          onClick={onToggleLock}
          className={cn(
            'mt-2 px-3 py-1 rounded-lg text-xs font-medium transition-all',
            isLocked
              ? 'bg-slot-gold text-slot-bg'
              : 'bg-slate-700 text-gray-400 hover:text-white hover:bg-slate-600'
          )}
        >
          {isLocked ? (
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Unlock className="w-3 h-3" /> Lock
            </span>
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

  const handleSpin = useCallback(async () => {
    if (isSpinning) return;
    
    // Haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
    
    setIsSpinning(true);
    setErrors({});
    setWarnings([]);

    try {
      const result = await onSpin(filters, lockedDishes);

      if (result.success && result.dishes) {
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

    // Keep spinning state active for the animation duration
    // The longest reel stops at 1500 + (5 * 400) = 3500ms
    setTimeout(() => {
      setIsSpinning(false);
    }, 3800);
  }, [onSpin, filters, lockedDishes, isSpinning]);

  const handleToggleLock = (category: SlotCategory) => {
    const dish = currentDishes[category];
    if (!dish) return;

    setLockedDishes((prev) => {
      if (prev[category]) {
        const { [category]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [category]: dish.id };
    });
  };

  const handleSaveClick = async () => {
    if (Object.keys(currentDishes).length === categories.length) {
      await onSave(currentDishes as Record<SlotCategory, DishWithRelations>);
    }
  };

  const lockedCount = Object.keys(lockedDishes).length;
  const hasAllDishes = categories.every((cat) => currentDishes[cat]);

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-400">Warnings</p>
              <ul className="mt-1 text-sm text-yellow-300/80 space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Global Error */}
      {errors._global && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{errors._global}</p>
          </div>
        </div>
      )}

      {/* Slot Machine Frame */}
      <div className="relative flex items-center justify-center">
        {/* Main Slot Machine */}
        <div className="relative w-full max-w-4xl">
          {/* Outer gold frame */}
          <div className="absolute -inset-3 bg-gradient-to-b from-yellow-500 via-yellow-600 to-yellow-700 rounded-2xl" />
          <div className="absolute -inset-2 bg-gradient-to-b from-yellow-600 via-yellow-700 to-yellow-800 rounded-xl" />
          
          {/* Inner machine */}
          <div className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg p-4 sm:p-6 border-4 border-yellow-600">
            {/* Top banner */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 via-red-500 to-red-600 px-6 sm:px-10 py-2 rounded-lg shadow-lg">
              <span className="font-bold text-white text-sm sm:text-lg tracking-widest drop-shadow-lg">🎰 MEAL SLOT 🎰</span>
            </div>

            {/* Reels container - HORIZONTAL ROW */}
            <div className="flex gap-2 sm:gap-3 pt-6 pb-4 justify-center">
              {categories.map((category, index) => (
                <SlotReel
                  key={category}
                  category={category}
                  dish={currentDishes[category] || null}
                  isSpinning={isSpinning}
                  isLocked={!!lockedDishes[category]}
                  onToggleLock={() => handleToggleLock(category)}
                  stopDelay={1500 + index * 400}
                  error={errors[category]}
                  reelIndex={index}
                />
              ))}
            </div>

            {/* Spin Button */}
            <div className="flex justify-center pt-4 border-t border-slate-700">
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className={cn(
                  'relative group transition-all duration-200',
                  isSpinning ? 'cursor-not-allowed scale-95' : 'hover:scale-105 active:scale-95'
                )}
              >
                {/* Button glow */}
                <div className={cn(
                  'absolute -inset-3 rounded-full blur-xl transition-opacity duration-300',
                  isSpinning ? 'bg-yellow-500/30' : 'bg-red-500/40 group-hover:bg-red-500/60'
                )} />
                
                {/* Button - larger touch target on mobile */}
                <div className={cn(
                  'relative w-24 h-24 sm:w-28 sm:h-28 rounded-full',
                  'flex items-center justify-center',
                  'border-4 shadow-xl',
                  'touch-manipulation',
                  isSpinning 
                    ? 'bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 border-yellow-300 shadow-yellow-500/50' 
                    : 'bg-gradient-to-b from-red-500 via-red-600 to-red-700 border-red-400 shadow-red-500/50'
                )}>
                  <div className="text-center">
                    <Dices className={cn(
                      'w-8 h-8 sm:w-10 sm:h-10 mx-auto text-white drop-shadow-lg',
                      isSpinning && 'animate-spin'
                    )} />
                    <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider drop-shadow">
                      {isSpinning ? 'Spinning...' : 'SPIN!'}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {hasSpun && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {lockedCount > 0 && lockedCount < categories.length && (
            <Button
              variant="secondary"
              onClick={handleSpin}
              disabled={isSpinning}
            >
              <RefreshCw className={cn('w-4 h-4', isSpinning && 'animate-spin')} />
              Re-Spin Unlocked ({categories.length - lockedCount})
            </Button>
          )}

          {hasAllDishes && (
            <Button
              variant="primary"
              onClick={handleSaveClick}
              disabled={isSpinning}
            >
              <Save className="w-4 h-4" />
              Save Plan
            </Button>
          )}
        </div>
      )}

      {/* Lock hint */}
      {hasSpun && !isSpinning && (
        <p className="text-center text-sm text-gray-500">
          {lockedCount === 0
            ? '💡 Lock dishes you want to keep, then spin again!'
            : `🔒 ${lockedCount} dish${lockedCount > 1 ? 'es' : ''} locked`}
        </p>
      )}

      {/* Selected dishes detail */}
      {hasSpun && hasAllDishes && !isSpinning && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-center">✨ Your Meal Plan</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((category) => {
              const dish = currentDishes[category];
              if (!dish) return null;
              return (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedDish(dish);
                    setIsModalOpen(true);
                  }}
                  className="bg-slate-900 rounded-lg p-3 border border-slate-700 hover:border-slot-gold hover:bg-slate-800 transition-all duration-200 text-left cursor-pointer group"
                >
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                    {SLOT_CATEGORY_LABELS[category]}
                  </p>
                  <p className="font-semibold text-sm text-white line-clamp-2 group-hover:text-slot-gold transition-colors">
                    {dish.name}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {dish.kosher && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                        Kosher
                      </span>
                    )}
                    {dish.difficulty !== 'unknown' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-gray-400 capitalize">
                        {dish.difficulty}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      <RecipeModal
        dish={selectedDish}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDish(null);
        }}
      />

      {/* CSS for slot spinning animation */}
      <style jsx global>{`
        @keyframes slotSpin {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-320px);
          }
        }
        
        /* Optimize for mobile touch */
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
}
