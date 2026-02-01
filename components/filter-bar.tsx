'use client';

import { useState } from 'react';
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
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
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

  // Compact version
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
            className="btn-ghost btn-sm gap-1"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-accent" />
          <span className="label">Filters</span>
          {hasActiveFilters && (
            <span className="chip text-[10px]">Active</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-ghost btn-sm gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-ghost btn-sm"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Quick filters */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
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
        <div className="mt-6 pt-6 border-t border-border-subtle space-y-6 animate-fade-in">
          {/* Kosher Style */}
          <div>
            <label className="label mb-2 block">Kosher Style</label>
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
            <label className="label mb-2 block">Difficulty</label>
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
              <label className="label mb-2 block">Main Protein</label>
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
              <label className="label mb-2 block">Cuisine</label>
              <ChipGroup
                options={allCuisines}
                selected={filters.cuisines || []}
                onChange={(selected) => onChange({ ...filters, cuisines: selected })}
              />
            </div>
          )}

          {/* Allergens to Exclude */}
          <div>
            <label className="label mb-2 block">Exclude Allergens</label>
            <ChipGroup
              options={STANDARD_ALLERGENS as unknown as string[]}
              selected={filters.excludeAllergens || []}
              onChange={(selected) => onChange({ ...filters, excludeAllergens: selected })}
            />
          </div>

          {/* Include Ingredients */}
          <div>
            <label className="label mb-2 block">Include Ingredients</label>
            {filters.includeIngredients && filters.includeIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
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
                    className="chip-interactive bg-success-subtle text-success gap-1"
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
              />
              {ingredientSearch && filteredIngredients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-surface border border-border-subtle rounded-lg shadow-lg max-h-48 overflow-auto">
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
                      className="w-full px-3 py-2 text-left text-sm hover:bg-surface-2 transition-colors"
                    >
                      {ing}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Max Time */}
          <div>
            <label className="label mb-2 block">Max Total Time (minutes)</label>
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
