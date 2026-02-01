'use client';

import { useState, useEffect } from 'react';
import { Toggle } from './ui/toggle';
import { ChipGroup } from './ui/chip';
import { Input } from './ui/input';
import {
  KOSHER_STYLES,
  DIFFICULTY_LEVELS,
  STANDARD_ALLERGENS,
  type FilterOptions,
  type KosherStyle,
  type DifficultyLevel,
} from '@/lib/types';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface FilterBarProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  allIngredients?: string[];
  allCuisines?: string[];
  allMainProteins?: string[];
  className?: string;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  compact?: boolean;
}

export function FilterBar({
  filters,
  onChange,
  allIngredients = [],
  allCuisines = [],
  allMainProteins = [],
  className,
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  compact = false,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState('');

  const filteredIngredients = allIngredients.filter(
    (ing) =>
      ing.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
      !filters.includeIngredients?.includes(ing) &&
      !filters.excludeIngredients?.includes(ing)
  );

  const hasActiveFilters =
    filters.kosherOnly ||
    (filters.kosherStyles && filters.kosherStyles.length > 0) ||
    (filters.difficulties && filters.difficulties.length > 0) ||
    (filters.mainProteins && filters.mainProteins.length > 0) ||
    (filters.includeIngredients && filters.includeIngredients.length > 0) ||
    (filters.excludeIngredients && filters.excludeIngredients.length > 0) ||
    (filters.excludeAllergens && filters.excludeAllergens.length > 0) ||
    (filters.cuisines && filters.cuisines.length > 0) ||
    filters.maxTotalTimeMinutes;

  const clearFilters = () => {
    onChange({});
    onSearchChange?.('');
  };

  // Compact version - just a row of quick toggles
  if (compact) {
    return (
      <div className={cn('flex flex-wrap items-center gap-4', className)}>
        <Toggle
          checked={filters.kosherOnly || false}
          onChange={(checked) => onChange({ ...filters, kosherOnly: checked })}
          label="Kosher Only"
        />
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('bg-black/50 rounded-2xl border border-slot-gold/30', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-slot-gold" />
          <span className="font-semibold text-slot-gold">Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full bg-slot-gold/20 text-slot-gold text-xs font-medium">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-slot-gold/10 text-gray-400 hover:text-slot-gold transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Quick filters (always visible) */}
      <div className="px-4 pb-4 flex flex-wrap items-center gap-4">
        {showSearch && (
          <Input
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-64"
          />
        )}
        <Toggle
          checked={filters.kosherOnly || false}
          onChange={(checked) => onChange({ ...filters, kosherOnly: checked })}
          label="Kosher Only"
        />
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slot-gold/30 space-y-6">
          {/* Kosher Style */}
          <div>
            <label className="block text-sm font-medium text-slot-gold mb-2">
              Kosher Style
            </label>
            <ChipGroup
              options={KOSHER_STYLES.filter((s) => s !== 'unknown') as unknown as string[]}
              selected={(filters.kosherStyles as string[]) || []}
              onChange={(selected) =>
                onChange({ ...filters, kosherStyles: selected as KosherStyle[] })
              }
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-slot-gold mb-2">
              Difficulty
            </label>
            <ChipGroup
              options={DIFFICULTY_LEVELS.filter((d) => d !== 'unknown') as unknown as string[]}
              selected={(filters.difficulties as string[]) || []}
              onChange={(selected) =>
                onChange({ ...filters, difficulties: selected as DifficultyLevel[] })
              }
            />
          </div>

          {/* Main Protein */}
          {allMainProteins.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slot-gold mb-2">
                Main Protein
              </label>
              <ChipGroup
                options={allMainProteins}
                selected={filters.mainProteins || []}
                onChange={(selected) => onChange({ ...filters, mainProteins: selected })}
              />
            </div>
          )}

          {/* Cuisine */}
          {allCuisines.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slot-gold mb-2">
                Cuisine
              </label>
              <ChipGroup
                options={allCuisines}
                selected={filters.cuisines || []}
                onChange={(selected) => onChange({ ...filters, cuisines: selected })}
              />
            </div>
          )}

          {/* Allergens to Exclude */}
          <div>
            <label className="block text-sm font-medium text-slot-gold mb-2">
              Exclude Allergens
            </label>
            <ChipGroup
              options={STANDARD_ALLERGENS as unknown as string[]}
              selected={filters.excludeAllergens || []}
              onChange={(selected) => onChange({ ...filters, excludeAllergens: selected })}
            />
          </div>

          {/* Include Ingredients */}
          <div>
            <label className="block text-sm font-medium text-slot-gold mb-2">
              Include Ingredients
            </label>
            {filters.includeIngredients && filters.includeIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {filters.includeIngredients.map((ing) => (
                  <button
                    key={ing}
                    onClick={() =>
                      onChange({
                        ...filters,
                        includeIngredients: filters.includeIngredients?.filter(
                          (i) => i !== ing
                        ),
                      })
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                  >
                    {ing}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <Input
                placeholder="Search ingredients to include..."
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                className="text-sm"
              />
              {ingredientSearch && filteredIngredients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-black border border-slot-gold/30 rounded-lg shadow-xl max-h-48 overflow-auto">
                  {filteredIngredients.slice(0, 10).map((ing) => (
                    <button
                      key={ing}
                      onClick={() => {
                        onChange({
                          ...filters,
                          includeIngredients: [...(filters.includeIngredients || []), ing],
                        });
                        setIngredientSearch('');
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slot-gold/10 hover:text-slot-gold transition-colors"
                    >
                      {ing}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Exclude Ingredients */}
          <div>
            <label className="block text-sm font-medium text-slot-gold mb-2">
              Exclude Ingredients
            </label>
            {filters.excludeIngredients && filters.excludeIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {filters.excludeIngredients.map((ing) => (
                  <button
                    key={ing}
                    onClick={() =>
                      onChange({
                        ...filters,
                        excludeIngredients: filters.excludeIngredients?.filter(
                          (i) => i !== ing
                        ),
                      })
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    {ing}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <Input
                placeholder="Search ingredients to exclude..."
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Max Time */}
          <div>
            <label className="block text-sm font-medium text-slot-gold mb-2">
              Max Total Time (minutes)
            </label>
            <Input
              type="number"
              placeholder="e.g. 60"
              value={filters.maxTotalTimeMinutes || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  maxTotalTimeMinutes: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-32"
            />
          </div>
        </div>
      )}
    </div>
  );
}
