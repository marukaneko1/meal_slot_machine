'use client';

import { useState, useEffect, useCallback } from 'react';
import { SlotMachine } from '@/components/slot-machine';
import { FilterBar } from '@/components/filter-bar';
import { Select } from '@/components/ui/select';
import type { FilterOptions, SlotCategory, DishWithRelations, LockedDishes } from '@/lib/types';
import { SLOT_CATEGORIES } from '@/lib/types';
import { CheckCircle } from 'lucide-react';

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

        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Spin error:', error);
        return {
          success: false,
          errors: [{ message: 'Failed to connect to server' }],
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
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Save Success Toast */}
        {saveSuccess && (
          <div className="fixed top-20 right-4 bg-green-500/90 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce-in z-50">
            <CheckCircle className="w-5 h-5" />
            Plan saved successfully!
          </div>
        )}

        {/* Profile Selector */}
        <div className="mb-4">
          <Select
            label="Meal Profile"
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...profiles.map((p) => ({ value: p.id, label: p.name })),
            ]}
            className="max-w-xs"
          />
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          allIngredients={filterData.ingredients}
          allCuisines={filterData.cuisines}
          allMainProteins={filterData.mainProteins}
          className="mb-6"
        />

        {/* Slot Machine */}
        <SlotMachine
          onSpin={(f, l) => handleSpin({ ...filters, ...f }, l)}
          onSave={handleSave}
          filters={filters}
          categories={categories}
        />
      </div>
    </div>
  );
}
