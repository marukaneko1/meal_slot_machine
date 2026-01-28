'use server';

import prisma from '@/lib/db';
import type { FilterOptions, DishWithRelations, SlotCategory } from '@/lib/types';

const dishInclude = {
  ingredients: {
    include: { ingredient: true },
  },
  tags: {
    include: { tag: true },
  },
  allergens: {
    include: { allergen: true },
  },
};

/**
 * Builds where clause from filter options
 */
function buildWhereClause(filters: FilterOptions, searchQuery?: string): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  const andConditions: Record<string, unknown>[] = [];

  // Search query
  if (searchQuery && searchQuery.trim()) {
    andConditions.push({
      name: { contains: searchQuery.trim() },
    });
  }

  // Kosher filter
  if (filters.kosherOnly) {
    where.kosher = true;
  }

  // Kosher style filter
  if (filters.kosherStyles && filters.kosherStyles.length > 0) {
    where.kosherStyle = { in: filters.kosherStyles };
  }

  // Difficulty filter
  if (filters.difficulties && filters.difficulties.length > 0) {
    where.difficulty = { in: filters.difficulties };
  }

  // Main protein filter
  if (filters.mainProteins && filters.mainProteins.length > 0) {
    where.mainProtein = { in: filters.mainProteins };
  }

  // Cuisine filter
  if (filters.cuisines && filters.cuisines.length > 0) {
    where.cuisine = { in: filters.cuisines };
  }

  // Include ingredients
  if (filters.includeIngredients && filters.includeIngredients.length > 0) {
    andConditions.push({
      ingredients: {
        some: {
          ingredient: {
            name: { in: filters.includeIngredients.map((i) => i.toLowerCase()) },
          },
        },
      },
    });
  }

  // Exclude ingredients
  if (filters.excludeIngredients && filters.excludeIngredients.length > 0) {
    andConditions.push({
      NOT: {
        ingredients: {
          some: {
            ingredient: {
              name: { in: filters.excludeIngredients.map((i) => i.toLowerCase()) },
            },
          },
        },
      },
    });
  }

  // Exclude allergens
  if (filters.excludeAllergens && filters.excludeAllergens.length > 0) {
    andConditions.push({
      NOT: {
        allergens: {
          some: {
            allergen: {
              name: { in: filters.excludeAllergens.map((a) => a.toLowerCase()) },
            },
          },
        },
      },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

/**
 * Gets all dishes with filtering, pagination, and search
 */
export async function getDishes(
  filters: FilterOptions = {},
  options: {
    searchQuery?: string;
    slotCategory?: SlotCategory;
    limit?: number;
    offset?: number;
    orderBy?: 'name' | 'createdAt' | 'updatedAt';
    orderDir?: 'asc' | 'desc';
  } = {}
): Promise<{ dishes: DishWithRelations[]; total: number }> {
  const where = buildWhereClause(filters, options.searchQuery);

  if (options.slotCategory) {
    where.slotCategory = options.slotCategory;
  }

  // Apply max time filter in post-processing if needed
  const maxTime = filters.maxTotalTimeMinutes;

  const [dishes, total] = await Promise.all([
    prisma.dish.findMany({
      where,
      include: dishInclude,
      take: options.limit || 50,
      skip: options.offset || 0,
      orderBy: { [options.orderBy || 'name']: options.orderDir || 'asc' },
    }),
    prisma.dish.count({ where }),
  ]);

  let filteredDishes = dishes as unknown as DishWithRelations[];

  // Post-filter by total time
  if (maxTime) {
    filteredDishes = filteredDishes.filter((dish) => {
      const totalTime = (dish.prepTimeMinutes || 0) + (dish.cookTimeMinutes || 0);
      return totalTime === 0 || totalTime <= maxTime;
    });
  }

  return { dishes: filteredDishes, total };
}

/**
 * Gets a single dish by ID
 */
export async function getDishById(id: string): Promise<DishWithRelations | null> {
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: dishInclude,
  });

  return dish as unknown as DishWithRelations | null;
}

/**
 * Gets dish counts by category
 */
export async function getDishCountsByCategory(): Promise<Record<string, number>> {
  const categories = await prisma.dish.groupBy({
    by: ['slotCategory'],
    _count: true,
  });

  return Object.fromEntries(categories.map((c) => [c.slotCategory, c._count]));
}

/**
 * Gets all unique ingredients
 */
export async function getAllIngredients(): Promise<string[]> {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { name: 'asc' },
  });
  return ingredients.map((i) => i.name);
}

/**
 * Gets all unique cuisines
 */
export async function getAllCuisines(): Promise<string[]> {
  const cuisines = await prisma.dish.findMany({
    where: { cuisine: { not: null } },
    select: { cuisine: true },
    distinct: ['cuisine'],
    orderBy: { cuisine: 'asc' },
  });
  return cuisines.map((c) => c.cuisine!).filter(Boolean);
}

/**
 * Gets all unique main proteins
 */
export async function getAllMainProteins(): Promise<string[]> {
  const proteins = await prisma.dish.findMany({
    where: { mainProtein: { not: null } },
    select: { mainProtein: true },
    distinct: ['mainProtein'],
    orderBy: { mainProtein: 'asc' },
  });
  return proteins.map((p) => p.mainProtein!).filter(Boolean);
}

/**
 * Gets all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
  });
  return tags.map((t) => t.name);
}

/**
 * Gets all allergens
 */
export async function getAllAllergens(): Promise<string[]> {
  const allergens = await prisma.allergen.findMany({
    orderBy: { name: 'asc' },
  });
  return allergens.map((a) => a.name);
}

/**
 * Deletes a dish by ID
 */
export async function deleteDish(id: string): Promise<void> {
  await prisma.dish.delete({ where: { id } });
}

/**
 * Gets total dish count
 */
export async function getTotalDishCount(): Promise<number> {
  return prisma.dish.count();
}
