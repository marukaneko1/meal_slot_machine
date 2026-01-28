import { NextRequest, NextResponse } from 'next/server';
import { getDishes, getAllIngredients, getAllCuisines, getAllMainProteins } from '@/lib/db/dishes';
import type { FilterOptions, KosherStyle, DifficultyLevel } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    
    // Build filters
    const filters: FilterOptions = {};
    
    if (searchParams.get('kosherOnly') === 'true') {
      filters.kosherOnly = true;
    }
    
    const kosherStyles = searchParams.get('kosherStyles');
    if (kosherStyles) {
      filters.kosherStyles = kosherStyles.split(',') as KosherStyle[];
    }
    
    const difficulties = searchParams.get('difficulties');
    if (difficulties) {
      filters.difficulties = difficulties.split(',') as DifficultyLevel[];
    }
    
    const mainProteins = searchParams.get('mainProteins');
    if (mainProteins) {
      filters.mainProteins = mainProteins.split(',');
    }
    
    const cuisines = searchParams.get('cuisines');
    if (cuisines) {
      filters.cuisines = cuisines.split(',');
    }
    
    const includeIngredients = searchParams.get('includeIngredients');
    if (includeIngredients) {
      filters.includeIngredients = includeIngredients.split(',');
    }
    
    const excludeIngredients = searchParams.get('excludeIngredients');
    if (excludeIngredients) {
      filters.excludeIngredients = excludeIngredients.split(',');
    }
    
    const excludeAllergens = searchParams.get('excludeAllergens');
    if (excludeAllergens) {
      filters.excludeAllergens = excludeAllergens.split(',');
    }
    
    const maxTime = searchParams.get('maxTime');
    if (maxTime) {
      filters.maxTotalTimeMinutes = parseInt(maxTime);
    }
    
    // Fetch data in parallel
    const [dishData, ingredients, allCuisines, allMainProteins] = await Promise.all([
      getDishes(filters, {
        searchQuery: search,
        slotCategory: category as any,
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
      ingredients,
      cuisines: allCuisines,
      mainProteins: allMainProteins,
    });
  } catch (error) {
    console.error('Error fetching dishes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dishes' },
      { status: 500 }
    );
  }
}
