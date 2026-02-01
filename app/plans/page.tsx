'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DishCard } from '@/components/dish-card';
import { FilterBar } from '@/components/filter-bar';
import { Select } from '@/components/ui/select';
import { RecipeModal } from '@/components/recipe-modal';
import { Toggle } from '@/components/ui/toggle';
import { ErrorBoundary } from '@/components/error-boundary';
import type { FilterOptions, SlotCategory, DishWithRelations } from '@/lib/types';
import { SLOT_CATEGORY_LABELS, SLOT_CATEGORIES } from '@/lib/types';
import {
  CalendarDays,
  Sparkles,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { TOAST_DURATION } from '@/lib/utils/animation';

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
  createdAt: string;
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

/**
 * Safely format a date string or return a fallback
 */
function formatDate(dateString: string | null | undefined, fallback = 'Not set'): string {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString();
  } catch {
    return fallback;
  }
}

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
  const [selectedDish, setSelectedDish] = useState<DishWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    } catch {
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
        setTimeout(() => setSaveSuccess(false), TOAST_DURATION.default);
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
    <div className="min-h-screen py-6 md:py-10">
      <div className="container-page">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="heading-1 flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-accent" aria-hidden="true" />
              Meal Plans
            </h1>
            <p className="body-lg mt-2">
              Generate and manage your meal plans
            </p>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="View mode">
            <Button
              variant={mode === 'generate' ? 'primary' : 'ghost'}
              onClick={() => setMode('generate')}
              aria-pressed={mode === 'generate'}
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Generate
            </Button>
            <Button
              variant={mode === 'view' ? 'primary' : 'ghost'}
              onClick={() => setMode('view')}
              aria-pressed={mode === 'view'}
            >
              <CalendarDays className="w-4 h-4" aria-hidden="true" />
              Saved
            </Button>
          </div>
        </header>

        {/* Toast */}
        {saveSuccess && (
          <div 
            className="fixed top-20 right-4 alert-success z-50 animate-slide-down shadow-lg"
            role="status"
            aria-live="polite"
          >
            <CheckCircle className="w-5 h-5" aria-hidden="true" />
            Plan saved successfully!
          </div>
        )}

        <ErrorBoundary>
          {mode === 'generate' ? (
            <>
              {/* Generation Controls */}
              <div className="card mb-8">
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
                      <Toggle
                        checked={noRepeats}
                        onChange={setNoRepeats}
                        label="Avoid repeats"
                      />
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
              <div className="flex justify-center mb-8">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  isLoading={isGenerating}
                >
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  Generate {planMode === 'weekly' ? 'Weekly' : 'Daily'} Plan
                </Button>
              </div>

              {/* Error */}
              {error && (
                <div className="alert-error mb-8" role="alert">
                  <AlertCircle className="w-5 h-5" aria-hidden="true" />
                  <p>{error}</p>
                </div>
              )}

              {/* Generated Plan */}
              {generatedPlan && (
                <div className="space-y-6">
                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 no-print">
                    <p className="caption">Seed: {generatedPlan.seed}</p>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={handleExportCSV}>
                        <Download className="w-4 h-4" aria-hidden="true" />
                        Export
                      </Button>
                      <Button variant="secondary" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" aria-hidden="true" />
                        Print
                      </Button>
                      <Button variant="primary" onClick={handleSavePlan}>
                        Save Plan
                      </Button>
                    </div>
                  </div>

                  {/* Warnings */}
                  {generatedPlan.warnings && generatedPlan.warnings.length > 0 && (
                    <div className="alert-warning no-print" role="alert">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-medium">Heads up</p>
                        <ul className="mt-1 text-sm opacity-80 space-y-0.5">
                          {generatedPlan.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Plan Grid */}
                  {planMode === 'weekly' ? (
                    <div className="space-y-4">
                      {generatedPlan.days.map((day) => (
                        <div key={day.dayIndex} className="card">
                          <h3 className="heading-4 mb-4">{DAYS_OF_WEEK[day.dayIndex]}</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {SLOT_CATEGORIES.map((cat) =>
                              day.dishes[cat] ? (
                                <button
                                  key={cat}
                                  onClick={() => {
                                    setSelectedDish(day.dishes[cat]);
                                    setIsModalOpen(true);
                                  }}
                                  className="text-left"
                                  aria-label={`View ${day.dishes[cat].name}`}
                                >
                                  <DishCard dish={day.dishes[cat]} compact />
                                </button>
                              ) : null
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedPlan.days[0] &&
                        Object.values(generatedPlan.days[0].dishes).map((dish) => (
                          <button
                            key={dish.id}
                            onClick={() => {
                              setSelectedDish(dish);
                              setIsModalOpen(true);
                            }}
                            className="text-left"
                            aria-label={`View ${dish.name}`}
                          >
                            <DishCard dish={dish} />
                          </button>
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
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    Back to list
                  </Button>

                  <div className="card">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="heading-3">
                          {selectedPlan.mode === 'weekly' ? 'Weekly Plan' : 'Daily Plan'}
                        </h3>
                        <p className="body-sm mt-1">
                          Created: {formatDate(selectedPlan.createdAt || selectedPlan.startDate)}
                          {selectedPlan.profile && ` • ${selectedPlan.profile.name}`}
                        </p>
                      </div>
                      <Button variant="secondary" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" aria-hidden="true" />
                        Print
                      </Button>
                    </div>

                    {selectedPlan.mode === 'weekly' ? (
                      <div className="space-y-6">
                        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                          const dayItems = selectedPlan.items.filter(
                            (item) => item.dayIndex === dayIndex
                          );
                          if (dayItems.length === 0) return null;
                          return (
                            <div key={dayIndex}>
                              <h4 className="heading-4 mb-3">{DAYS_OF_WEEK[dayIndex]}</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {dayItems.map((item) => (
                                  <button
                                    key={item.dish.id}
                                    onClick={() => {
                                      setSelectedDish(item.dish);
                                      setIsModalOpen(true);
                                    }}
                                    className="text-left"
                                    aria-label={`View ${item.dish.name}`}
                                  >
                                    <DishCard dish={item.dish} compact />
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedPlan.items.map((item) => (
                          <button
                            key={item.dish.id}
                            onClick={() => {
                              setSelectedDish(item.dish);
                              setIsModalOpen(true);
                            }}
                            className="text-left"
                            aria-label={`View ${item.dish.name}`}
                          >
                            <DishCard dish={item.dish} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {savedPlans.length === 0 ? (
                    <div className="empty-state">
                      <CalendarDays className="empty-state-icon" aria-hidden="true" />
                      <h3 className="empty-state-title">No saved plans</h3>
                      <p className="empty-state-description">
                        Generate and save a plan to see it here
                      </p>
                      <Button variant="primary" onClick={() => setMode('generate')} className="mt-4">
                        <Sparkles className="w-4 h-4" aria-hidden="true" />
                        Generate Plan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedPlans.map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => loadPlanDetail(plan.id)}
                          className="card-interactive w-full text-left flex items-center justify-between"
                          aria-label={`View ${plan.mode === 'weekly' ? 'Weekly' : 'Daily'} Plan from ${formatDate(plan.createdAt || plan.startDate)}`}
                        >
                          <div>
                            <h4 className="label">
                              {plan.mode === 'weekly' ? 'Weekly Plan' : 'Daily Plan'}
                            </h4>
                            <p className="body-sm mt-0.5">
                              {formatDate(plan.createdAt || plan.startDate)}
                              {plan.profile && ` • ${plan.profile.name}`}
                              {` • ${plan._count.items} dishes`}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-text-muted" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </ErrorBoundary>

        {/* Recipe Modal */}
        <RecipeModal
          dish={selectedDish}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDish(null);
          }}
        />
      </div>
    </div>
  );
}
