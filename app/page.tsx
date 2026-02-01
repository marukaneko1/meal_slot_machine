'use client';

import { useState, useEffect, useCallback } from 'react';
import { SlotMachine } from '@/components/slot-machine';
import { FilterBar } from '@/components/filter-bar';
import type { FilterOptions, SlotCategory, DishWithRelations, LockedDishes } from '@/lib/types';
import { SLOT_CATEGORIES } from '@/lib/types';
import { CheckCircle, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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

  // Load profiles and filter data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [profilesRes, filterRes] = await Promise.all([
          fetch('/api/profiles'),
          fetch('/api/dishes?limit=1'),
        ]);

        if (profilesRes.ok) {
          const profilesData = await profilesRes.json();
          setProfiles(profilesData);
          // Select default profile
          const defaultProfile = profilesData.find((p: Profile) => p.name === 'Standard Weekly');
          if (defaultProfile) {
            setSelectedProfileId(defaultProfile.id);
            const rules = JSON.parse(defaultProfile.rulesJson);
            if (rules.categories) {
              setCategories(rules.categories);
            }
          }
        }

        if (filterRes.ok) {
          const filterDataResult = await filterRes.json();
          setFilterData({
            ingredients: filterDataResult.ingredients || [],
            cuisines: filterDataResult.cuisines || [],
            mainProteins: filterDataResult.mainProteins || [],
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  // Update categories when profile changes
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
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } catch (error) {
        console.error('Save error:', error);
      }
    },
    [selectedProfileId]
  );

  return (
    <div className="min-h-[calc(100vh-6rem)] md:min-h-screen flex flex-col">
      {/* Save Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 md:top-20 right-4 bg-green-500/90 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce-in z-50">
          <CheckCircle className="w-5 h-5" />
          Plan saved successfully!
        </div>
      )}

      {/* Mobile: Centered slot machine container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 md:py-6">
        <div className="w-full max-w-5xl">
          {/* Slot Machine */}
          <SlotMachine
            onSpin={(f, l) => handleSpin({ ...filters, ...f }, l)}
            onSave={handleSave}
            filters={filters}
            categories={categories}
          />

          {/* Collapsible Filters Section - Hidden on mobile by default, show on desktop */}
          <div className="mt-6 md:mt-8 hidden md:block">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all",
                "bg-slate-800/50 hover:bg-slate-800 border border-slate-700",
                showFilters && "rounded-b-none border-b-0"
              )}
            >
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Settings2 className="w-4 h-4" />
                <span>Filters & Settings</span>
                {filters.kosherOnly && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                    Kosher Only
                  </span>
                )}
                {selectedProfileId && profiles.find(p => p.id === selectedProfileId) && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slot-gold/20 text-slot-gold">
                    {profiles.find(p => p.id === selectedProfileId)?.name}
                  </span>
                )}
              </div>
              {showFilters ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Expandable Content */}
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              showFilters ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="p-4 bg-slate-800/30 border border-t-0 border-slate-700 rounded-b-lg space-y-4">
                {/* Profile Selector - Compact */}
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 whitespace-nowrap">Profile:</label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-slot-gold focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Bar - Compact */}
                <FilterBar
                  filters={filters}
                  onChange={setFilters}
                  allIngredients={filterData.ingredients}
                  allCuisines={filterData.cuisines}
                  allMainProteins={filterData.mainProteins}
                  compact
                />
              </div>
            </div>
          </div>

          {/* Mobile: Compact filter toggle */}
          <div className="mt-4 md:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all text-sm",
                "bg-slate-800/30 border border-slate-700/50 text-gray-500",
                showFilters && "bg-slate-800/50 text-gray-300"
              )}
            >
              <Settings2 className="w-4 h-4" />
              <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Mobile filters content */}
            {showFilters && (
              <div className="mt-3 p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg space-y-3 animate-slide-up">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 whitespace-nowrap">Profile:</label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-slot-gold focus:outline-none"
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
          </div>
        </div>
      </div>
    </div>
  );
}
