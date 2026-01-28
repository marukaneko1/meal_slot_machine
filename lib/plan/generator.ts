'use server';

import prisma from '@/lib/db';
import { createSeededRNG, generateSeed, shuffleArray, pickRandom } from '@/lib/utils/rng';
import {
  SLOT_CATEGORIES,
  type SlotCategory,
  type FilterOptions,
  type LockedDishes,
  type PlanMode,
  type DishWithRelations,
  type PlanGenerationResult,
  type GeneratedPlan,
  type GeneratedDay,
  type PlanError,
} from '@/lib/types';

// Include relations for dish queries
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
 * Builds a Prisma where clause from filter options
 */
function buildWhereClause(
  category: SlotCategory,
  filters: FilterOptions
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    slotCategory: category,
  };

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

  // Max total time filter
  if (filters.maxTotalTimeMinutes) {
    // This is a bit tricky - we need to filter on combined time
    // For now, we'll handle this in post-processing
  }

  // Include ingredients - dish must have ALL specified ingredients
  if (filters.includeIngredients && filters.includeIngredients.length > 0) {
    where.ingredients = {
      some: {
        ingredient: {
          name: { in: filters.includeIngredients.map((i) => i.toLowerCase()) },
        },
      },
    };
  }

  // Exclude ingredients - dish must NOT have ANY of the specified ingredients
  if (filters.excludeIngredients && filters.excludeIngredients.length > 0) {
    where.NOT = {
      ingredients: {
        some: {
          ingredient: {
            name: { in: filters.excludeIngredients.map((i) => i.toLowerCase()) },
          },
        },
      },
    };
  }

  // Exclude allergens
  if (filters.excludeAllergens && filters.excludeAllergens.length > 0) {
    const notClause = where.NOT as Record<string, unknown> | undefined;
    if (notClause) {
      // Combine with existing NOT clause
      where.AND = [
        { NOT: notClause },
        {
          NOT: {
            allergens: {
              some: {
                allergen: {
                  name: { in: filters.excludeAllergens.map((a) => a.toLowerCase()) },
                },
              },
            },
          },
        },
      ];
      delete where.NOT;
    } else {
      where.NOT = {
        allergens: {
          some: {
            allergen: {
              name: { in: filters.excludeAllergens.map((a) => a.toLowerCase()) },
            },
          },
        },
      };
    }
  }

  return where;
}

/**
 * Post-filters dishes by total time
 */
function filterByTotalTime(
  dishes: DishWithRelations[],
  maxTotalTime: number | undefined
): DishWithRelations[] {
  if (!maxTotalTime) return dishes;

  return dishes.filter((dish) => {
    const prep = dish.prepTimeMinutes || 0;
    const cook = dish.cookTimeMinutes || 0;
    return prep + cook <= maxTotalTime;
  });
}

/**
 * Gets candidate dishes for a category with filters applied
 */
async function getCandidates(
  category: SlotCategory,
  filters: FilterOptions,
  excludeIds: string[] = []
): Promise<DishWithRelations[]> {
  const where = buildWhereClause(category, filters);

  // Add exclusion of already selected dishes
  if (excludeIds.length > 0) {
    if (where.AND) {
      (where.AND as unknown[]).push({ id: { notIn: excludeIds } });
    } else {
      where.id = { notIn: excludeIds };
    }
  }

  const dishes = await prisma.dish.findMany({
    where,
    include: dishInclude,
  });

  // Post-filter by total time
  return filterByTotalTime(dishes as unknown as DishWithRelations[], filters.maxTotalTimeMinutes);
}

/**
 * Gets a specific dish by ID with relations
 */
async function getDishById(id: string): Promise<DishWithRelations | null> {
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: dishInclude,
  });

  return dish as unknown as DishWithRelations | null;
}

/**
 * Checks if a locked dish satisfies the given filters
 */
async function validateLockedDish(
  dishId: string,
  category: SlotCategory,
  filters: FilterOptions
): Promise<{ valid: boolean; dish?: DishWithRelations; reason?: string }> {
  const dish = await getDishById(dishId);

  if (!dish) {
    return { valid: false, reason: 'Locked dish not found' };
  }

  if (dish.slotCategory !== category) {
    return { valid: false, reason: `Locked dish is not in category ${category}` };
  }

  // Check kosher filter
  if (filters.kosherOnly && !dish.kosher) {
    return { valid: false, reason: 'Locked dish is not kosher' };
  }

  // Check kosher style filter
  if (filters.kosherStyles && filters.kosherStyles.length > 0) {
    if (!filters.kosherStyles.includes(dish.kosherStyle as any)) {
      return { valid: false, reason: `Locked dish kosher style (${dish.kosherStyle}) not allowed` };
    }
  }

  // Check difficulty filter
  if (filters.difficulties && filters.difficulties.length > 0) {
    if (!filters.difficulties.includes(dish.difficulty as any)) {
      return { valid: false, reason: `Locked dish difficulty (${dish.difficulty}) not allowed` };
    }
  }

  // Check main protein filter
  if (filters.mainProteins && filters.mainProteins.length > 0) {
    if (dish.mainProtein && !filters.mainProteins.includes(dish.mainProtein)) {
      return { valid: false, reason: `Locked dish protein (${dish.mainProtein}) not allowed` };
    }
  }

  // Check exclude ingredients
  if (filters.excludeIngredients && filters.excludeIngredients.length > 0) {
    const dishIngredients = dish.ingredients.map((i) => i.ingredient.name.toLowerCase());
    const excluded = filters.excludeIngredients.find((ing) =>
      dishIngredients.includes(ing.toLowerCase())
    );
    if (excluded) {
      return { valid: false, reason: `Locked dish contains excluded ingredient: ${excluded}` };
    }
  }

  // Check exclude allergens
  if (filters.excludeAllergens && filters.excludeAllergens.length > 0) {
    const dishAllergens = dish.allergens.map((a) => a.allergen.name.toLowerCase());
    const excluded = filters.excludeAllergens.find((alg) =>
      dishAllergens.includes(alg.toLowerCase())
    );
    if (excluded) {
      return { valid: false, reason: `Locked dish contains excluded allergen: ${excluded}` };
    }
  }

  // Check total time
  if (filters.maxTotalTimeMinutes) {
    const totalTime = (dish.prepTimeMinutes || 0) + (dish.cookTimeMinutes || 0);
    if (totalTime > filters.maxTotalTimeMinutes) {
      return { valid: false, reason: `Locked dish total time (${totalTime}min) exceeds maximum` };
    }
  }

  return { valid: true, dish };
}

/**
 * Gets count of dishes per category
 */
async function getDishCountsByCategory(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  for (const category of SLOT_CATEGORIES) {
    counts[category] = await prisma.dish.count({
      where: { slotCategory: category },
    });
  }

  return counts;
}

/**
 * Generates a single day's dishes
 */
async function generateDay(
  dayIndex: number,
  categories: SlotCategory[],
  filters: FilterOptions,
  locks: LockedDishes,
  rng: () => number,
  usedDishIds: Set<string>
): Promise<{
  success: boolean;
  dishes?: Record<SlotCategory, DishWithRelations>;
  errors?: PlanError[];
  warnings?: string[];
}> {
  const selectedDishes: Record<string, DishWithRelations> = {};
  const errors: PlanError[] = [];
  const warnings: string[] = [];
  const dayUsedIds = new Set<string>();

  for (const category of categories) {
    // Check if this category has a locked dish
    const lockedId = locks[category];

    if (lockedId) {
      // Validate the locked dish
      const validation = await validateLockedDish(lockedId, category, filters);

      if (!validation.valid) {
        errors.push({
          code: 'LOCK_CONFLICT',
          message: `Locked dish for ${category}: ${validation.reason}`,
          category,
          details: {
            failedConstraint: validation.reason,
          },
        });
        continue;
      }

      selectedDishes[category] = validation.dish!;
      dayUsedIds.add(lockedId);
      continue;
    }

    // Get candidates, excluding already used dishes today
    const excludeIds = [...Array.from(dayUsedIds), ...Array.from(usedDishIds)];
    let candidates = await getCandidates(category, filters, excludeIds);

    // If no candidates and we're excluding weekly repeats, try without that exclusion
    if (candidates.length === 0 && usedDishIds.size > 0) {
      candidates = await getCandidates(category, filters, Array.from(dayUsedIds));
      if (candidates.length > 0) {
        warnings.push(
          `Day ${dayIndex + 1}: Had to repeat a dish from earlier in the week for ${category}`
        );
      }
    }

    // If still no candidates, this is an error
    if (candidates.length === 0) {
      // Get more details for error reporting
      const allCandidates = await getCandidates(category, {}, []);
      const filteredCandidates = await getCandidates(category, filters, []);

      errors.push({
        code: 'NO_CANDIDATES_FOR_CATEGORY',
        message: `No dishes available for ${category} that match your filters`,
        category,
        details: {
          totalDishes: allCandidates.length,
          candidatesPerCategory: { [category]: filteredCandidates.length },
          appliedFilters: filters,
          failedConstraint:
            allCandidates.length === 0
              ? 'No dishes in this category'
              : 'All dishes filtered out by constraints',
        },
      });
      continue;
    }

    // Shuffle and pick one
    const shuffled = shuffleArray(candidates, rng);
    const selected = shuffled[0];
    selectedDishes[category] = selected;
    dayUsedIds.add(selected.id);
  }

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  // Add day's dishes to the weekly used set
  Array.from(dayUsedIds).forEach((id) => {
    usedDishIds.add(id);
  });

  return {
    success: true,
    dishes: selectedDishes as Record<SlotCategory, DishWithRelations>,
    warnings,
  };
}

/**
 * Main plan generation function
 */
export async function generatePlan(
  filters: FilterOptions,
  mode: PlanMode,
  profileId: string | undefined,
  locks: LockedDishes,
  providedSeed: string | undefined,
  noRepeatsAcrossWeek: boolean
): Promise<PlanGenerationResult> {
  // Check if there are any dishes in the database
  const totalDishes = await prisma.dish.count();
  if (totalDishes === 0) {
    return {
      success: false,
      errors: [
        {
          code: 'NO_DISHES_IN_DB',
          message: 'No dishes in database. Please upload a CSV to add dishes.',
          details: { totalDishes: 0 },
        },
      ],
    };
  }

  // Get categories from profile or use default
  let categories = [...SLOT_CATEGORIES];

  if (profileId) {
    const profile = await prisma.customerProfile.findUnique({
      where: { id: profileId },
    });

    if (profile) {
      try {
        const rules = JSON.parse(profile.rulesJson);
        if (rules.categories && Array.isArray(rules.categories)) {
          categories = rules.categories;
        }
      } catch {
        // Use default categories
      }
    }
  }

  // Initialize RNG
  const seed = providedSeed || generateSeed();
  const rng = createSeededRNG(seed);

  // Determine number of days
  const numDays = mode === 'weekly' ? 7 : 1;

  // Track used dishes across the week (if requested)
  const usedDishIds = noRepeatsAcrossWeek ? new Set<string>() : new Set<string>();

  const days: GeneratedDay[] = [];
  const allWarnings: string[] = [];
  const allErrors: PlanError[] = [];

  // Generate each day
  for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
    const dayResult = await generateDay(
      dayIndex,
      categories,
      filters,
      // Only apply locks to first day (or all days if single day mode)
      mode === 'daily' ? locks : {},
      rng,
      usedDishIds
    );

    if (!dayResult.success) {
      allErrors.push(...(dayResult.errors || []));
    } else {
      days.push({
        dayIndex,
        dishes: dayResult.dishes!,
      });
    }

    if (dayResult.warnings) {
      allWarnings.push(...dayResult.warnings);
    }
  }

  // If we couldn't generate any days, return errors
  if (days.length === 0) {
    return {
      success: false,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  // If we generated some but not all days, still return partial results with warnings
  if (days.length < numDays) {
    allWarnings.push(
      `Could only generate ${days.length} out of ${numDays} days due to constraints`
    );
  }

  return {
    success: true,
    plan: {
      days,
      seed,
      mode,
      profileId,
    },
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
    errors: allErrors.length > 0 ? allErrors : undefined,
  };
}

/**
 * Saves a generated plan to the database
 */
export async function savePlan(
  plan: GeneratedPlan,
  startDate?: Date
): Promise<{ success: boolean; planId?: string; error?: string }> {
  try {
    const savedPlan = await prisma.$transaction(async (tx) => {
      // Create the plan
      const newPlan = await tx.plan.create({
        data: {
          profileId: plan.profileId,
          startDate,
          mode: plan.mode,
          seed: plan.seed,
        },
      });

      // Create plan items
      const items: Array<{
        planId: string;
        dayIndex: number;
        slotCategory: string;
        dishId: string;
      }> = [];

      for (const day of plan.days) {
        for (const [category, dish] of Object.entries(day.dishes)) {
          items.push({
            planId: newPlan.id,
            dayIndex: day.dayIndex,
            slotCategory: category,
            dishId: dish.id,
          });
        }
      }

      await tx.planItem.createMany({ data: items });

      return newPlan;
    });

    return { success: true, planId: savedPlan.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save plan',
    };
  }
}

/**
 * Gets a saved plan by ID
 */
export async function getPlanById(planId: string) {
  return prisma.plan.findUnique({
    where: { id: planId },
    include: {
      profile: true,
      items: {
        include: {
          dish: {
            include: dishInclude,
          },
        },
        orderBy: [{ dayIndex: 'asc' }, { slotCategory: 'asc' }],
      },
    },
  });
}

/**
 * Gets all saved plans
 */
export async function getPlans(limit = 50, offset = 0) {
  return prisma.plan.findMany({
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
    include: {
      profile: true,
      _count: {
        select: { items: true },
      },
    },
  });
}

/**
 * Deletes a plan
 */
export async function deletePlan(planId: string) {
  await prisma.plan.delete({ where: { id: planId } });
}
