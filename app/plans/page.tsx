'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DishCard } from '@/components/dish-card';
import { FilterBar } from '@/components/filter-bar';
import { Select } from '@/components/ui/select';
import type { FilterOptions, SlotCategory, DishWithRelations } from '@/lib/types';
import { SLOT_CATEGORY_LABELS, SLOT_CATEGORIES } from '@/lib/types';
import {
  CalendarDays,
  Dices,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Plan {
  id: string;
  mode: string;
  startDate: string | null;
  createdAt: string;
  profile?: { name: string } | null;
  _count: { items: number };
}

interface PlanDetail {
  id: string;
  mode: string;
  startDate: string | null;
  seed: string | null;
  profile?: { name: string } | null;
  items: {
    dayIndex: number;
    slotCategory: string;
    dish: DishWithRelations;
  }[];
}

interface Profile {
  id: string;
  name: string;
}

interface GeneratedPlan {
  days: {
    dayIndex: number;
    dishes: Record<string, DishWithRelations>;
  }[];
  seed: string;
  warnings?: string[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function PlansPage() {
  const [mode, setMode] = useState<'view' | 'generate'>('generate');
  const [planMode, setPlanMode] = useState<'daily' | 'weekly'>('weekly');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [noRepeats, setNoRepeats] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
  const [filterData, setFilterData] = useState({
    ingredients: [] as string[],
    cuisines: [] as string[],
    mainProteins: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [profilesRes, plansRes, filterRes] = await Promise.all([
          fetch('/api/profiles'),
          fetch('/api/plans'),
          fetch('/api/dishes?limit=1'),
        ]);

        if (profilesRes.ok) {
          const profilesData = await profilesRes.json();
          setProfiles(profilesData);
          const defaultProfile = profilesData.find((p: Profile) => p.name === 'Standard Weekly');
          if (defaultProfile) setSelectedProfileId(defaultProfile.id);
        }

        if (plansRes.ok) {
          setSavedPlans(await plansRes.json());
        }

        if (filterRes.ok) {
          const data = await filterRes.json();
          setFilterData({
            ingredients: data.ingredients || [],
            cuisines: data.cuisines || [],
            mainProteins: data.mainProteins || [],
          });
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedPlan(null);

    try {
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters,
          profileId: selectedProfileId,
          mode: planMode,
          noRepeatsAcrossWeek: noRepeats,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (planMode === 'daily') {
          setGeneratedPlan({
            days: [{ dayIndex: 0, dishes: result.dishes }],
            seed: result.seed,
            warnings: result.warnings,
          });
        } else {
          setGeneratedPlan({
            days: result.plan.days,
            seed: result.plan.seed,
            warnings: result.warnings,
          });
        }
      } else {
        setError(result.errors?.[0]?.message || 'Failed to generate plan');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;

    try {
      const dishes = generatedPlan.days.flatMap((day) =>
        Object.entries(day.dishes).map(([category, dish]) => ({
          category,
          dishId: dish.id,
          dayIndex: day.dayIndex,
        }))
      );

      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishes,
          profileId: selectedProfileId,
          mode: planMode,
        }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        // Refresh saved plans
        const plansRes = await fetch('/api/plans');
        if (plansRes.ok) setSavedPlans(await plansRes.json());
      }
    } catch (err) {
      console.error('Failed to save plan:', err);
    }
  };

  const handleExportCSV = () => {
    if (!generatedPlan) return;

    const rows = [['Day', 'Category', 'Dish', 'Kosher', 'Difficulty', 'Time (min)']];

    generatedPlan.days.forEach((day) => {
      Object.entries(day.dishes).forEach(([category, dish]) => {
        const totalTime = (dish.prepTimeMinutes || 0) + (dish.cookTimeMinutes || 0);
        rows.push([
          planMode === 'weekly' ? DAYS_OF_WEEK[day.dayIndex] : 'Today',
          SLOT_CATEGORY_LABELS[category as SlotCategory],
          dish.name,
          dish.kosher ? 'Yes' : 'No',
          dish.difficulty,
          totalTime > 0 ? String(totalTime) : '-',
        ]);
      });
    });

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meal-plan-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const loadPlanDetail = async (planId: string) => {
    try {
      const response = await fetch(`/api/plans/${planId}`);
      if (response.ok) {
        setSelectedPlan(await response.json());
        setMode('view');
      }
    } catch (err) {
      console.error('Failed to load plan:', err);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-slot-purple" />
              Meal Plans
            </h1>
            <p className="text-gray-400 mt-2">
              Generate and manage your meal plans
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={mode === 'generate' ? 'primary' : 'ghost'}
              onClick={() => setMode('generate')}
            >
              <Dices className="w-4 h-4" />
              Generate
            </Button>
            <Button
              variant={mode === 'view' ? 'primary' : 'ghost'}
              onClick={() => setMode('view')}
            >
              <CalendarDays className="w-4 h-4" />
              Saved Plans
            </Button>
          </div>
        </div>

        {/* Save Success Toast */}
        {saveSuccess && (
          <div className="fixed top-20 right-4 bg-green-500/90 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce-in z-50">
            <CheckCircle className="w-5 h-5" />
            Plan saved successfully!
          </div>
        )}

        {mode === 'generate' ? (
          <>
            {/* Generation Controls */}
            <div className="bg-slot-card rounded-2xl border border-slot-accent/50 p-6 mb-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Select
                  label="Plan Type"
                  value={planMode}
                  onChange={(e) => setPlanMode(e.target.value as 'daily' | 'weekly')}
                  options={[
                    { value: 'daily', label: 'Daily Plan' },
                    { value: 'weekly', label: 'Weekly Plan (7 days)' },
                  ]}
                />
                <Select
                  label="Profile"
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  options={[
                    { value: '', label: 'All Categories' },
                    ...profiles.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
                {planMode === 'weekly' && (
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noRepeats}
                        onChange={(e) => setNoRepeats(e.target.checked)}
                        className="w-4 h-4 rounded bg-slot-accent border-slot-accent text-slot-purple focus:ring-slot-purple"
                      />
                      <span className="text-sm text-gray-300">Avoid repeats across week</span>
                    </label>
                  </div>
                )}
              </div>

              <FilterBar
                filters={filters}
                onChange={setFilters}
                allIngredients={filterData.ingredients}
                allCuisines={filterData.cuisines}
                allMainProteins={filterData.mainProteins}
              />
            </div>

            {/* Generate Button */}
            <div className="text-center mb-8">
              <Button
                variant="gold"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
                isLoading={isGenerating}
              >
                <Dices className="w-5 h-5" />
                Generate {planMode === 'weekly' ? 'Weekly' : 'Daily'} Plan
              </Button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Generated Plan */}
            {generatedPlan && (
              <div className="space-y-8">
                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 no-print">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Seed: {generatedPlan.seed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={handleExportCSV}>
                      <Download className="w-4 h-4" />
                      Export CSV
                    </Button>
                    <Button variant="secondary" onClick={handlePrint}>
                      <Printer className="w-4 h-4" />
                      Print
                    </Button>
                    <Button variant="primary" onClick={handleSavePlan}>
                      Save Plan
                    </Button>
                  </div>
                </div>

                {/* Warnings */}
                {generatedPlan.warnings && generatedPlan.warnings.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 no-print">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-400">Warnings</p>
                        <ul className="mt-1 text-sm text-yellow-300/80 space-y-1">
                          {generatedPlan.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan Grid */}
                {planMode === 'weekly' ? (
                  <div className="grid gap-6">
                    {generatedPlan.days.map((day) => (
                      <div
                        key={day.dayIndex}
                        className="bg-slot-card rounded-2xl border border-slot-accent/50 p-6"
                      >
                        <h3 className="text-lg font-bold mb-4">
                          {DAYS_OF_WEEK[day.dayIndex]}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                          {SLOT_CATEGORIES.map((cat) =>
                            day.dishes[cat] ? (
                              <DishCard key={cat} dish={day.dishes[cat]} compact />
                            ) : null
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedPlan.days[0] &&
                      Object.values(generatedPlan.days[0].dishes).map((dish) => (
                        <DishCard key={dish.id} dish={dish} />
                      ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Saved Plans View */
          <div className="space-y-6">
            {selectedPlan ? (
              <>
                <Button variant="ghost" onClick={() => setSelectedPlan(null)}>
                  <ChevronLeft className="w-4 h-4" />
                  Back to list
                </Button>

                <div className="bg-slot-card rounded-2xl border border-slot-accent/50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedPlan.mode === 'weekly' ? 'Weekly Plan' : 'Daily Plan'}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Created: {new Date(selectedPlan.startDate || '').toLocaleDateString()}
                        {selectedPlan.profile && ` • ${selectedPlan.profile.name}`}
                      </p>
                    </div>
                    <Button variant="secondary" onClick={handlePrint}>
                      <Printer className="w-4 h-4" />
                      Print
                    </Button>
                  </div>

                  {/* Group items by day */}
                  {selectedPlan.mode === 'weekly' ? (
                    <div className="space-y-6">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                        const dayItems = selectedPlan.items.filter(
                          (item) => item.dayIndex === dayIndex
                        );
                        if (dayItems.length === 0) return null;
                        return (
                          <div key={dayIndex}>
                            <h4 className="font-semibold mb-3">
                              {DAYS_OF_WEEK[dayIndex]}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                              {dayItems.map((item) => (
                                <DishCard key={item.dish.id} dish={item.dish} compact />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {selectedPlan.items.map((item) => (
                        <DishCard key={item.dish.id} dish={item.dish} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {savedPlans.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slot-accent/50 mb-4">
                      <CalendarDays className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No saved plans</h3>
                    <p className="text-gray-400 mb-6">
                      Generate and save a plan to see it here
                    </p>
                    <Button variant="primary" onClick={() => setMode('generate')}>
                      <Dices className="w-4 h-4" />
                      Generate Plan
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {savedPlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => loadPlanDetail(plan.id)}
                        className="bg-slot-card rounded-xl border border-slot-accent/50 p-4 text-left hover:border-slot-purple/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">
                              {plan.mode === 'weekly' ? 'Weekly Plan' : 'Daily Plan'}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {plan.startDate &&
                                new Date(plan.startDate).toLocaleDateString()}
                              {plan.profile && ` • ${plan.profile.name}`}
                              {` • ${plan._count.items} dishes`}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
