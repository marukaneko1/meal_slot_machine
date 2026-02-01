'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { DishCard } from '@/components/dish-card';
import { FilterBar } from '@/components/filter-bar';
import { Button } from '@/components/ui/button';
import type { FilterOptions, DishWithRelations, SlotCategory } from '@/lib/types';
import { SLOT_CATEGORIES, SLOT_CATEGORY_LABELS } from '@/lib/types';
import { Grid3X3, List, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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
  if (!res.ok) throw new Error('Failed to fetch dishes');
  return res.json();
}

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  
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
    startTransition(async () => {
      try {
        const result = await fetchDishes(filters, searchQuery, selectedCategory, page, limit);
        setData(result);
      } catch (error) {
        console.error('Failed to load dishes:', error);
      }
    });
  }, [filters, searchQuery, selectedCategory, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen pt-6 pb-24 md:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-slot-purple" />
            Dish Library
          </h1>
          <p className="text-gray-400 mt-2">
            Browse and filter your complete dish collection
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all',
              selectedCategory === null
                ? 'bg-slot-purple text-white'
                : 'bg-slot-card text-gray-400 hover:text-white hover:bg-slot-accent/50'
            )}
          >
            All
          </button>
          {SLOT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all',
                selectedCategory === cat
                  ? 'bg-slot-purple text-white'
                  : 'bg-slot-card text-gray-400 hover:text-white hover:bg-slot-accent/50'
              )}
            >
              {SLOT_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
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
          <p className="text-gray-400">
            {isPending ? (
              'Loading...'
            ) : (
              <>
                Showing <span className="text-white font-medium">{data.dishes.length}</span> of{' '}
                <span className="text-white font-medium">{data.total}</span> dishes
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-slot-purple text-white'
                  : 'bg-slot-card text-gray-400 hover:text-white'
              )}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'table'
                  ? 'bg-slot-purple text-white'
                  : 'bg-slot-card text-gray-400 hover:text-white'
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {data.dishes.length === 0 && !isPending ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slot-accent/50 mb-4">
              <BookOpen className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No dishes found</h3>
            <p className="text-gray-400">
              {data.total === 0
                ? 'Upload a CSV file to add dishes to your library'
                : 'Try adjusting your filters to see more results'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.dishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Kosher</th>
                  <th>Difficulty</th>
                  <th>Time</th>
                  <th>Protein</th>
                  <th>Cuisine</th>
                </tr>
              </thead>
              <tbody>
                {data.dishes.map((dish) => (
                  <tr key={dish.id}>
                    <td className="font-medium text-white">{dish.name}</td>
                    <td>
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded text-xs font-medium',
                          `badge-${dish.slotCategory}`
                        )}
                      >
                        {SLOT_CATEGORY_LABELS[dish.slotCategory as SlotCategory]}
                      </span>
                    </td>
                    <td>
                      {dish.kosher ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="capitalize">{dish.difficulty}</td>
                    <td>
                      {(dish.prepTimeMinutes || 0) + (dish.cookTimeMinutes || 0) > 0
                        ? `${(dish.prepTimeMinutes || 0) + (dish.cookTimeMinutes || 0)} min`
                        : '-'}
                    </td>
                    <td className="capitalize">{dish.mainProtein || '-'}</td>
                    <td>{dish.cuisine || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-4 py-2 text-gray-400">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
