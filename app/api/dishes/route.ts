import { NextRequest, NextResponse } from 'next/server';
import { getDishes, getAllIngredients, getAllCuisines, getAllMainProteins } from '@/lib/db/dishes';
import type { FilterOptions, KosherStyle, DifficultyLevel, SlotCategory } from '@/lib/types';
import { SLOT_CATEGORIES } from '@/lib/types';

/**
 * Validates if a string is a valid SlotCategory
 */
function isValidSlotCategory(value: string | null): value is SlotCategory {
  if (!value) return false;
  return SLOT_CATEGORIES.includes(value as SlotCategory);
}

/**
 * Safely parse comma-separated string into array
 */
function parseCommaSeparated(value: string | null): string[] {
  if (!value || !value.trim()) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Safely parse integer with fallback
 */
function parseIntSafe(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseIntSafe(searchParams.get('page'), 1);
    const limit = parseIntSafe(searchParams.get('limit'), 24);
    const search = searchParams.get('search') || undefined;
    const categoryParam = searchParams.get('category');
    
    // Validate category if provided
    const category = isValidSlotCategory(categoryParam) ? categoryParam : undefined;
    
    // Build filters with proper type safety
    const filters: FilterOptions = {};
    
    if (searchParams.get('kosherOnly') === 'true') {
      filters.kosherOnly = true;
    }
    
    const kosherStyles = parseCommaSeparated(searchParams.get('kosherStyles'));
    if (kosherStyles.length > 0) {
      // Validate kosher styles
      const validKosherStyles = kosherStyles.filter(
        (s): s is KosherStyle => ['meat', 'dairy', 'pareve', 'unknown'].includes(s)
      );
      if (validKosherStyles.length > 0) {
        filters.kosherStyles = validKosherStyles;
      }
    }
    
    const difficulties = parseCommaSeparated(searchParams.get('difficulties'));
    if (difficulties.length > 0) {
      // Validate difficulty levels
      const validDifficulties = difficulties.filter(
        (d): d is DifficultyLevel => ['easy', 'medium', 'hard', 'unknown'].includes(d)
      );
      if (validDifficulties.length > 0) {
        filters.difficulties = validDifficulties;
      }
    }
    
    const mainProteins = parseCommaSeparated(searchParams.get('mainProteins'));
    if (mainProteins.length > 0) {
      filters.mainProteins = mainProteins;
    }
    
    const cuisines = parseCommaSeparated(searchParams.get('cuisines'));
    if (cuisines.length > 0) {
      filters.cuisines = cuisines;
    }
    
    const includeIngredients = parseCommaSeparated(searchParams.get('includeIngredients'));
    if (includeIngredients.length > 0) {
      filters.includeIngredients = includeIngredients;
    }
    
    const excludeIngredients = parseCommaSeparated(searchParams.get('excludeIngredients'));
    if (excludeIngredients.length > 0) {
      filters.excludeIngredients = excludeIngredients;
    }
    
    const excludeAllergens = parseCommaSeparated(searchParams.get('excludeAllergens'));
    if (excludeAllergens.length > 0) {
      filters.excludeAllergens = excludeAllergens;
    }
    
    const maxTime = searchParams.get('maxTime');
    if (maxTime) {
      const parsedMaxTime = parseIntSafe(maxTime, 0);
      if (parsedMaxTime > 0) {
        filters.maxTotalTimeMinutes = parsedMaxTime;
      }
    }
    
    // Fetch data in parallel
    const [dishData, ingredients, allCuisines, allMainProteins] = await Promise.all([
      getDishes(filters, {
        searchQuery: search,
        slotCategory: category,
        limit,
        offset: (page - 1) * limit,
      }),
      getAllIngredients(),
      getAllCuisines(),
      getAllMainProteins(),
    ]);
    
    return NextResponse.json({
      dishes: dishData.dishes,
      total: dishData.total,
      page,
      limit,
      ingredients,
      cuisines: allCuisines,
      mainProteins: allMainProteins,
    });
  } catch (error) {
    console.error('Error fetching dishes:', error);
    
    // Provide more specific error information in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isDatabaseError = errorMessage.includes('Prisma') || errorMessage.includes('database');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dishes',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        isDatabaseError,
      },
      { status: 500 }
    );
  }
}
