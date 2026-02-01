import prisma from '@/lib/db';
import type { NormalizedDishData } from '@/lib/types';

/**
 * Creates or retrieves an ingredient by name
 */
async function getOrCreateIngredient(name: string): Promise<string> {
  const normalizedName = name.toLowerCase().trim();
  
  const existing = await prisma.ingredient.findUnique({
    where: { name: normalizedName },
  });
  
  if (existing) return existing.id;
  
  const created = await prisma.ingredient.create({
    data: { name: normalizedName },
  });
  
  return created.id;
}

/**
 * Creates or retrieves a tag by name
 */
async function getOrCreateTag(name: string): Promise<string> {
  const normalizedName = name.toLowerCase().trim();
  
  const existing = await prisma.tag.findUnique({
    where: { name: normalizedName },
  });
  
  if (existing) return existing.id;
  
  const created = await prisma.tag.create({
    data: { name: normalizedName },
  });
  
  return created.id;
}

/**
 * Creates or retrieves an allergen by name
 */
async function getOrCreateAllergen(name: string): Promise<string> {
  const normalizedName = name.toLowerCase().trim();
  
  const existing = await prisma.allergen.findUnique({
    where: { name: normalizedName },
  });
  
  if (existing) return existing.id;
  
  const created = await prisma.allergen.create({
    data: { name: normalizedName },
  });
  
  return created.id;
}

/**
 * Creates a dish in the database
 * This is a shared function that can be used by both server actions and API routes
 */
export async function createDish(
  data: NormalizedDishData,
  updateExisting: boolean = false
): Promise<{ action: 'created' | 'updated' | 'skipped' }> {
  // Check if dish already exists
  const existing = await prisma.dish.findUnique({
    where: {
      name_slotCategory: {
        name: data.name,
        slotCategory: data.slotCategory,
      },
    },
  });

  if (existing && !updateExisting) {
    return { action: 'skipped' };
  }

  // Get or create related entities
  const ingredientIds = await Promise.all(
    data.ingredients.map((name) => getOrCreateIngredient(name))
  );

  const tagIds = await Promise.all(
    data.tags.map((name) => getOrCreateTag(name))
  );

  const allergenIds = await Promise.all(
    data.allergens.map((name) => getOrCreateAllergen(name))
  );

  if (existing && updateExisting) {
    // Update existing dish
    await prisma.$transaction(async (tx) => {
      // Delete old relations
      await tx.dishIngredient.deleteMany({ where: { dishId: existing.id } });
      await tx.dishTag.deleteMany({ where: { dishId: existing.id } });
      await tx.dishAllergen.deleteMany({ where: { dishId: existing.id } });

      // Update dish
      await tx.dish.update({
        where: { id: existing.id },
        data: {
          kosher: data.kosher,
          kosherStyle: data.kosherStyle,
          difficulty: data.difficulty,
          mainProtein: data.mainProtein,
          cuisine: data.cuisine,
          prepTimeMinutes: data.prepTimeMinutes,
          cookTimeMinutes: data.cookTimeMinutes,
          servings: data.servings,
          notes: data.notes,
          sourceUrl: data.sourceUrl,
        },
      });

      // Create new relations
      if (ingredientIds.length > 0) {
        await tx.dishIngredient.createMany({
          data: ingredientIds.map((ingredientId) => ({
            dishId: existing.id,
            ingredientId,
          })),
        });
      }

      if (tagIds.length > 0) {
        await tx.dishTag.createMany({
          data: tagIds.map((tagId) => ({
            dishId: existing.id,
            tagId,
          })),
        });
      }

      if (allergenIds.length > 0) {
        await tx.dishAllergen.createMany({
          data: allergenIds.map((allergenId) => ({
            dishId: existing.id,
            allergenId,
          })),
        });
      }
    });

    return { action: 'updated' };
  } else {
    // Create new dish
    await prisma.$transaction(async (tx) => {
      const dish = await tx.dish.create({
        data: {
          name: data.name,
          slotCategory: data.slotCategory,
          kosher: data.kosher,
          kosherStyle: data.kosherStyle,
          difficulty: data.difficulty,
          mainProtein: data.mainProtein,
          cuisine: data.cuisine,
          prepTimeMinutes: data.prepTimeMinutes,
          cookTimeMinutes: data.cookTimeMinutes,
          servings: data.servings,
          notes: data.notes,
          sourceUrl: data.sourceUrl,
        },
      });

      // Create relations
      if (ingredientIds.length > 0) {
        await tx.dishIngredient.createMany({
          data: ingredientIds.map((ingredientId) => ({
            dishId: dish.id,
            ingredientId,
          })),
        });
      }

      if (tagIds.length > 0) {
        await tx.dishTag.createMany({
          data: tagIds.map((tagId) => ({
            dishId: dish.id,
            tagId,
          })),
        });
      }

      if (allergenIds.length > 0) {
        await tx.dishAllergen.createMany({
          data: allergenIds.map((allergenId) => ({
            dishId: dish.id,
            allergenId,
          })),
        });
      }
    });

    return { action: 'created' };
  }
}
