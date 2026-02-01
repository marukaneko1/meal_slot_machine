'use client';

import { useState, useEffect, useCallback } from 'react';
import { SlotMachine } from '@/components/slot-machine';
import { FilterBar } from '@/components/filter-bar';
import { ErrorBoundary } from '@/components/error-boundary';
import type { FilterOptions, SlotCategory, DishWithRelations, LockedDishes } from '@/lib/types';
import { SLOT_CATEGORIES } from '@/lib/types';
import { CheckCircle, ChevronDown, ChevronUp, SlidersHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { TOAST_DURATION } from '@/lib/utils/animation';

interface SpinResult {
  success: boolean;
  dishes?: Record<SlotCategory, DishWithRelations>;
  errors?: { category?: SlotCategory; message: string }[];
  warnings?: string[];
}

interface Profile {
  id: string;
  name: string;
  rulesJson: string;
}

interface FilterData {
  ingredients: string[];
  cuisines: string[];
  mainProteins: string[];
}

export default function HomePage() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [categories, setCategories] = useState<SlotCategory[]>([...SLOT_CATEGORIES]);
  const [filterData, setFilterData] = useState<FilterData>({
    ingredients: [],
    cuisines: [],
    mainProteins: [],
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        const [profilesRes, filterRes] = await Promise.all([
          fetch('/api/profiles'),
          fetch('/api/dishes?limit=1'),
        ]);

        if (profilesRes.ok) {
          const profilesData = await profilesRes.json();
          setProfiles(profilesData);
          const defaultProfile = profilesData.find((p: Profile) => p.name === 'Standard Weekly');
          if (defaultProfile) {
            setSelectedProfileId(defaultProfile.id);
            const rules = JSON.parse(defaultProfile.rulesJson);
            if (rules.categories) {
              setCategories(rules.categories);
            }
          }
        } else {
          console.warn('Failed to load profiles');
        }

        if (filterRes.ok) {
          const filterDataResult = await filterRes.json();
          setFilterData({
            ingredients: filterDataResult.ingredients || [],
            cuisines: filterDataResult.cuisines || [],
            mainProteins: filterDataResult.mainProteins || [],
          });
        } else {
          const errorData = await filterRes.json().catch(() => ({}));
          if (errorData.isDatabaseError) {
            setLoadError('Unable to connect to the database. Please check your configuration.');
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoadError('Failed to load data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (selectedProfileId) {
      const profile = profiles.find((p) => p.id === selectedProfileId);
      if (profile) {
        try {
          const rules = JSON.parse(profile.rulesJson);
          if (rules.categories) {
            setCategories(rules.categories);
          }
        } catch {
          setCategories([...SLOT_CATEGORIES]);
        }
      }
    }
  }, [selectedProfileId, profiles]);

  const handleSpin = useCallback(
    async (spinFilters: FilterOptions, locks: LockedDishes): Promise<SpinResult> => {
      try {
        const response = await fetch('/api/spin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters: spinFilters,
            locks,
            profileId: selectedProfileId,
            mode: 'daily',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            errors: errorData.errors || [{ message: `Server error: ${response.status}` }],
          };
        }
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Spin error:', error);
        return {
          success: false,
          errors: [{ message: 'Failed to connect to server. Please check your connection.' }],
        };
      }
    },
    [selectedProfileId]
  );

  const handleSave = useCallback(
    async (dishes: Record<SlotCategory, DishWithRelations>) => {
      try {
        const response = await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dishes: Object.entries(dishes).map(([category, dish]) => ({
              category,
              dishId: dish.id,
              dayIndex: 0,
            })),
            profileId: selectedProfileId,
            mode: 'daily',
          }),
        });

        if (response.ok) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), TOAST_DURATION.default);
        }
      } catch (error) {
        console.error('Save error:', error);
      }
    },
    [selectedProfileId]
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] md:min-h-screen">
        <div className="container-page py-6 md:py-10">
          {/* Header skeleton */}
          <header className="mb-8 md:mb-10">
            <div className="h-10 w-64 bg-surface-2 rounded-lg animate-pulse" />
            <div className="h-6 w-96 bg-surface-2 rounded-lg animate-pulse mt-3" />
          </header>

          {/* Slot machine skeleton */}
          <div className="relative">
            <div className="bg-bg rounded-xl border border-border p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="h-8 w-32 bg-surface-2 rounded-lg animate-pulse" />
                  <div className="h-4 w-48 bg-surface-2 rounded-lg animate-pulse mt-2" />
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-2 animate-pulse" />
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="h-4 w-20 bg-surface-2 rounded animate-pulse mb-2 mx-auto" />
                    <div className="h-32 sm:h-40 rounded-xl bg-surface-2 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          <div className="flex items-center justify-center gap-2 mt-8 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="min-h-[calc(100vh-5rem)] md:min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-error-subtle flex items-center justify-center mx-auto mb-4">
            <SlidersHorizontal className="w-8 h-8 text-error" />
          </div>
          <h2 className="heading-3 mb-2">Unable to Load</h2>
          <p className="body-sm text-text-secondary mb-6 max-w-md">
            {loadError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] md:min-h-screen">
      {/* Toast */}
      {saveSuccess && (
        <div 
          className="fixed top-4 md:top-20 right-4 alert-success z-50 animate-slide-down shadow-lg"
          role="status"
          aria-live="polite"
        >
          <CheckCircle className="w-5 h-5" aria-hidden="true" />
          Plan saved successfully!
        </div>
      )}

      {/* Page Content */}
      <div className="container-page py-6 md:py-10">
        {/* Page Header */}
        <header className="mb-8 md:mb-10">
          <h1 className="heading-1 text-balance">
            What&apos;s for dinner?
          </h1>
          <p className="body-lg mt-2 max-w-lg">
            Spin to discover dishes for your next meal. Lock the ones you love, then spin again.
          </p>
        </header>

        {/* Slot Machine with Error Boundary */}
        <ErrorBoundary>
          <SlotMachine
            onSpin={(f, l) => handleSpin({ ...filters, ...f }, l)}
            onSave={handleSave}
            filters={filters}
            categories={categories}
          />
        </ErrorBoundary>

        {/* Filters Section */}
        <section className="mt-8" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="sr-only">Filters and Settings</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-lg transition-colors',
              'bg-surface border border-border-subtle',
              'hover:border-border',
              showFilters && 'rounded-b-none border-b-transparent'
            )}
            aria-expanded={showFilters}
            aria-controls="filters-panel"
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-4 h-4 text-text-muted" aria-hidden="true" />
              <span className="label">Filters & Settings</span>
              {filters.kosherOnly && (
                <span className="chip-interactive chip-selected text-[10px] py-0.5">
                  Kosher Only
                </span>
              )}
              {selectedProfileId && profiles.find(p => p.id === selectedProfileId) && (
                <span className="chip text-[10px] py-0.5">
                  {profiles.find(p => p.id === selectedProfileId)?.name}
                </span>
              )}
            </div>
            {showFilters ? (
              <ChevronUp className="w-4 h-4 text-text-muted" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted" aria-hidden="true" />
            )}
          </button>

          {showFilters && (
            <div 
              id="filters-panel"
              className="p-4 bg-surface border border-t-0 border-border-subtle rounded-b-lg space-y-4 animate-fade-in"
            >
              {/* Profile Selector */}
              <div className="flex items-center gap-3">
                <label htmlFor="profile-select" className="caption whitespace-nowrap">Profile:</label>
                <select
                  id="profile-select"
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="input flex-1"
                >
                  <option value="">All Categories</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <FilterBar
                filters={filters}
                onChange={setFilters}
                allIngredients={filterData.ingredients}
                allCuisines={filterData.cuisines}
                allMainProteins={filterData.mainProteins}
                compact
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
