'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { DishCard } from '@/components/dish-card';
import { FilterBar } from '@/components/filter-bar';
import { Button } from '@/components/ui/button';
import { ErrorBoundary, ErrorFallback } from '@/components/error-boundary';
import type { FilterOptions, DishWithRelations, SlotCategory } from '@/lib/types';
import { SLOT_CATEGORIES, SLOT_CATEGORY_LABELS } from '@/lib/types';
import { Grid3X3, List, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { RecipeModal } from '@/components/recipe-modal';
import { useDebounce } from '@/lib/utils/hooks';

interface PageData {
  dishes: DishWithRelations[];
  total: number;
  ingredients: string[];
  cuisines: string[];
  mainProteins: string[];
}

async function fetchDishes(
  filters: FilterOptions,
  searchQuery: string,
  category: string | null,
  page: number,
  limit: number
): Promise<PageData> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  
  if (searchQuery) params.set('search', searchQuery);
  if (category) params.set('category', category);
  if (filters.kosherOnly) params.set('kosherOnly', 'true');
  if (filters.kosherStyles?.length) params.set('kosherStyles', filters.kosherStyles.join(','));
  if (filters.difficulties?.length) params.set('difficulties', filters.difficulties.join(','));
  if (filters.mainProteins?.length) params.set('mainProteins', filters.mainProteins.join(','));
  if (filters.cuisines?.length) params.set('cuisines', filters.cuisines.join(','));
  if (filters.includeIngredients?.length) params.set('includeIngredients', filters.includeIngredients.join(','));
  if (filters.excludeIngredients?.length) params.set('excludeIngredients', filters.excludeIngredients.join(','));
  if (filters.excludeAllergens?.length) params.set('excludeAllergens', filters.excludeAllergens.join(','));
  if (filters.maxTotalTimeMinutes) params.set('maxTime', String(filters.maxTotalTimeMinutes));

  const res = await fetch(`/api/dishes?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch dishes');
  }
  return res.json();
}

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [selectedDish, setSelectedDish] = useState<DishWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce search query (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [data, setData] = useState<PageData>({
    dishes: [],
    total: 0,
    ingredients: [],
    cuisines: [],
    mainProteins: [],
  });

  const limit = 24;
  const totalPages = Math.ceil(data.total / limit);

  const loadData = useCallback(() => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await fetchDishes(filters, debouncedSearchQuery, selectedCategory, page, limit);
        setData(result);
      } catch (err) {
        console.error('Failed to load dishes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dishes');
      }
    });
  }, [filters, debouncedSearchQuery, selectedCategory, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when filters change (using debounced search)
  useEffect(() => {
    setPage(1);
  }, [filters, debouncedSearchQuery, selectedCategory]);

  const handleRetry = () => {
    setError(null);
    loadData();
  };

  return (
    <div className="min-h-screen py-6 md:py-10">
      <div className="container-page">
        {/* Header */}
        <header className="mb-8">
          <h1 className="heading-1 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-accent" aria-hidden="true" />
            Library
          </h1>
          <p className="body-lg mt-2">
            Browse and filter your complete dish collection
          </p>
        </header>

        {/* Category Tabs */}
        <nav className="flex flex-wrap gap-2 mb-6" aria-label="Category filters">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'chip-interactive',
              selectedCategory === null && 'chip-selected'
            )}
            aria-pressed={selectedCategory === null}
          >
            All
          </button>
          {SLOT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'chip-interactive',
                selectedCategory === cat && 'chip-selected'
              )}
              aria-pressed={selectedCategory === cat}
            >
              {SLOT_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </nav>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          allIngredients={data.ingredients}
          allCuisines={data.cuisines}
          allMainProteins={data.mainProteins}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          className="mb-6"
        />

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="body-sm">
            {isPending ? (
              'Loading...'
            ) : error ? (
              <span className="text-error">Error loading dishes</span>
            ) : (
              <>
                Showing <span className="text-text font-medium">{data.dishes.length}</span> of{' '}
                <span className="text-text font-medium">{data.total}</span> dishes
              </>
            )}
          </p>
          <div className="flex items-center gap-1" role="group" aria-label="View mode">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-accent-subtle text-accent'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid3X3 className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'table'
                  ? 'bg-accent-subtle text-accent'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              )}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
            >
              <List className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6">
            <ErrorFallback message={error} onRetry={handleRetry} />
          </div>
        )}

        {/* Content */}
        <ErrorBoundary>
          {!error && data.dishes.length === 0 && !isPending ? (
            <div className="empty-state">
              <BookOpen className="empty-state-icon" aria-hidden="true" />
              <h3 className="empty-state-title">No dishes found</h3>
              <p className="empty-state-description">
                {data.total === 0
                  ? 'Upload a CSV file to add dishes to your library'
                  : 'Try adjusting your filters to see more results'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.dishes.map((dish) => (
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
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Category</th>
                    <th scope="col">Kosher</th>
                    <th scope="col">Difficulty</th>
                    <th scope="col">Time</th>
                    <th scope="col">Protein</th>
                    <th scope="col">Cuisine</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dishes.map((dish) => (
                    <tr
                      key={dish.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedDish(dish);
                        setIsModalOpen(true);
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedDish(dish);
                          setIsModalOpen(true);
                        }
                      }}
                      role="button"
                      aria-label={`View ${dish.name}`}
                    >
                      <td className="font-medium text-text">{dish.name}</td>
                      <td>
                        <span className={cn(
                          'chip text-xs',
                          dish.slotCategory.includes('chicken') || dish.slotCategory.includes('beef') ? 'chip-protein' :
                          dish.slotCategory.includes('veg') ? 'chip-vegetable' :
                          dish.slotCategory.includes('starch') ? 'chip-starch' :
                          dish.slotCategory === 'soup' ? 'chip-soup' : 'chip-dessert'
                        )}>
                          {SLOT_CATEGORY_LABELS[dish.slotCategory as SlotCategory]}
                        </span>
                      </td>
                      <td>
                        {dish.kosher ? (
                          <span className="text-success">Yes</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="capitalize">{dish.difficulty}</td>
                      <td>
                        {(dish.prepTimeMinutes || 0) + (dish.cookTimeMinutes || 0) > 0
                          ? `${(dish.prepTimeMinutes || 0) + (dish.cookTimeMinutes || 0)} min`
                          : '—'}
                      </td>
                      <td className="capitalize">{dish.mainProtein || '—'}</td>
                      <td>{dish.cuisine || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ErrorBoundary>

        {/* Pagination */}
        {totalPages > 1 && !error && (
          <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
            <span className="body-sm px-4" aria-current="page">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </nav>
        )}
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
    </div>
  );
}
