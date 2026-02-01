'use server';

import prisma from '@/lib/db';
import { parseCSV, validateCSV } from './parser';
import type { NormalizedDishData, ImportResult, CSVValidationResult } from '@/lib/types';

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
 * Imports a single dish into the database
 */
export async function importDish(
  data: NormalizedDishData,
  updateExisting: boolean
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

  // Get or create all related entities
  const ingredientIds = await Promise.all(
    data.ingredients.map((name) => getOrCreateIngredient(name))
  );
  const tagIds = await Promise.all(data.tags.map((name) => getOrCreateTag(name)));
  const allergenIds = await Promise.all(
    data.allergens.map((name) => getOrCreateAllergen(name))
  );

  if (existing) {
    // Update existing dish
    await prisma.$transaction(async (tx) => {
      // Delete existing relations
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

/**
 * Preview CSV import - validates and returns preview data
 */
export async function previewCSVImport(csvContent: string): Promise<{
  headers: string[];
  validationResults: CSVValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}> {
  const { headers, rows } = parseCSV(csvContent);
  const validationResults = validateCSV(rows);

  const valid = validationResults.filter((r) => r.valid).length;
  const invalid = validationResults.filter((r) => !r.valid).length;

  return {
    headers,
    validationResults,
    summary: {
      total: rows.length,
      valid,
      invalid,
    },
  };
}

/**
 * Import dishes from CSV
 */
export async function importDishesFromCSV(
  csvContent: string,
  options: {
    updateExisting: boolean;
    importValidOnly: boolean;
  }
): Promise<ImportResult> {
  const { rows } = parseCSV(csvContent);
  const validationResults = validateCSV(rows);

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: { row: number; errors: string[] }[] = [];

  for (const result of validationResults) {
    if (!result.valid) {
      if (options.importValidOnly) {
        errors.push({ row: result.row, errors: result.errors });
        skipped++;
        continue;
      } else {
        errors.push({ row: result.row, errors: result.errors });
        continue;
      }
    }

    try {
      const { action } = await importDish(result.data!, options.updateExisting);
      switch (action) {
        case 'created':
          imported++;
          break;
        case 'updated':
          updated++;
          break;
        case 'skipped':
          skipped++;
          break;
      }
    } catch (error) {
      errors.push({
        row: result.row,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  return {
    totalRows: rows.length,
    imported,
    updated,
    skipped,
    errors,
  };
}
