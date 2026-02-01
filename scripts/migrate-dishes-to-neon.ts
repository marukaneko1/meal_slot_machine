/**
 * Migrate dishes from local SQLite to Neon PostgreSQL
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/migrate-dishes-to-neon.ts
 * 
 * Or set DATABASE_URL in .env.production and run:
 *   npx tsx scripts/migrate-dishes-to-neon.ts
 */

import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import { join } from 'path';

// Local SQLite database path
const LOCAL_DB_PATH = join(__dirname, '../prisma/dev.db');

// Create Neon PostgreSQL Prisma client (from DATABASE_URL env var)
const neonPrisma = new PrismaClient();

// Connect to local SQLite using better-sqlite3
let localDb: Database.Database | null = null;

function getLocalDb(): Database.Database {
  if (!localDb) {
    localDb = new Database(LOCAL_DB_PATH, { readonly: true });
  }
  return localDb;
}

interface LocalDish {
  id: string;
  name: string;
  slotCategory: string;
  kosher: number; // SQLite stores boolean as 0/1
  kosherStyle: string;
  difficulty: string;
  mainProtein: string | null;
  cuisine: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  notes: string | null;
  sourceUrl: string | null;
  ingredients: Array<{ name: string }>;
  tags: Array<{ name: string }>;
  allergens: Array<{ name: string }>;
}

async function migrateDishes() {
  console.log('🔄 Starting dish migration from SQLite to Neon PostgreSQL...\n');

  try {
    // Step 1: Read all dishes from local SQLite
    console.log('📖 Reading dishes from local SQLite database...');
    const db = getLocalDb();
    
    const dishRows = db.prepare('SELECT * FROM Dish').all() as any[];
    console.log(`   Found ${dishRows.length} dishes in local database\n`);

    if (dishRows.length === 0) {
      console.log('⚠️  No dishes found in local database. Nothing to migrate.');
      return;
    }

    // Fetch related data for each dish
    const localDishes: LocalDish[] = dishRows.map((dish) => {
      // Get ingredients
      const ingredientRows = db
        .prepare(`
          SELECT i.name 
          FROM Ingredient i
          JOIN DishIngredient di ON i.id = di.ingredientId
          WHERE di.dishId = ?
        `)
        .all(dish.id) as Array<{ name: string }>;

      // Get tags
      const tagRows = db
        .prepare(`
          SELECT t.name 
          FROM Tag t
          JOIN DishTag dt ON t.id = dt.tagId
          WHERE dt.dishId = ?
        `)
        .all(dish.id) as Array<{ name: string }>;

      // Get allergens
      const allergenRows = db
        .prepare(`
          SELECT a.name 
          FROM Allergen a
          JOIN DishAllergen da ON a.id = da.allergenId
          WHERE da.dishId = ?
        `)
        .all(dish.id) as Array<{ name: string }>;

      return {
        id: dish.id,
        name: dish.name,
        slotCategory: dish.slotCategory,
        kosher: dish.kosher,
        kosherStyle: dish.kosherStyle,
        difficulty: dish.difficulty,
        mainProtein: dish.mainProtein,
        cuisine: dish.cuisine,
        prepTimeMinutes: dish.prepTimeMinutes,
        cookTimeMinutes: dish.cookTimeMinutes,
        servings: dish.servings,
        notes: dish.notes,
        sourceUrl: dish.sourceUrl,
        ingredients: ingredientRows,
        tags: tagRows,
        allergens: allergenRows,
      };
    });

    if (localDishes.length === 0) {
      console.log('⚠️  No dishes found in local database. Nothing to migrate.');
      return;
    }

    // Step 2: Check Neon database
    console.log('🔍 Checking Neon PostgreSQL database...');
    const existingCount = await neonPrisma.dish.count();
    console.log(`   Found ${existingCount} existing dishes in Neon database\n`);

    if (existingCount > 0) {
      console.log('⚠️  WARNING: Neon database already has dishes!');
      console.log('   This script will skip duplicates (by name + category).\n');
    }

    // Step 3: Migrate dishes
    console.log('📦 Migrating dishes to Neon PostgreSQL...\n');
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const dish of localDishes) {
      try {
        // Check if dish already exists
        const existing = await neonPrisma.dish.findUnique({
          where: {
            name_slotCategory: {
              name: dish.name,
              slotCategory: dish.slotCategory,
            },
          },
        });

        if (existing) {
          console.log(`   ⏭️  Skipped: ${dish.name} (${dish.slotCategory}) - already exists`);
          skipped++;
          continue;
        }

        // Create dish with all relations
        await neonPrisma.$transaction(async (tx) => {
          // Create dish (convert SQLite boolean 0/1 to boolean)
          const newDish = await tx.dish.create({
            data: {
              name: dish.name,
              slotCategory: dish.slotCategory,
              kosher: dish.kosher === 1,
              kosherStyle: dish.kosherStyle,
              difficulty: dish.difficulty,
              mainProtein: dish.mainProtein,
              cuisine: dish.cuisine,
              prepTimeMinutes: dish.prepTimeMinutes,
              cookTimeMinutes: dish.cookTimeMinutes,
              servings: dish.servings,
              notes: dish.notes,
              sourceUrl: dish.sourceUrl,
            },
          });

          // Migrate ingredients
          for (const ingredientData of dish.ingredients) {
            const ingredientName = ingredientData.name.toLowerCase();
            
            // Get or create ingredient
            let ingredientRecord = await tx.ingredient.findUnique({
              where: { name: ingredientName },
            });
            
            if (!ingredientRecord) {
              ingredientRecord = await tx.ingredient.create({
                data: { name: ingredientName },
              });
            }

            // Create dish-ingredient relation
            await tx.dishIngredient.create({
              data: {
                dishId: newDish.id,
                ingredientId: ingredientRecord.id,
              },
            });
          }

          // Migrate tags
          for (const tagData of dish.tags) {
            const tagName = tagData.name.toLowerCase();
            
            // Get or create tag
            let tagRecord = await tx.tag.findUnique({
              where: { name: tagName },
            });
            
            if (!tagRecord) {
              tagRecord = await tx.tag.create({
                data: { name: tagName },
              });
            }

            // Create dish-tag relation
            await tx.dishTag.create({
              data: {
                dishId: newDish.id,
                tagId: tagRecord.id,
              },
            });
          }

          // Migrate allergens
          for (const allergenData of dish.allergens) {
            const allergenName = allergenData.name.toLowerCase();
            
            // Get or create allergen
            let allergenRecord = await tx.allergen.findUnique({
              where: { name: allergenName },
            });
            
            if (!allergenRecord) {
              allergenRecord = await tx.allergen.create({
                data: { name: allergenName },
              });
            }

            // Create dish-allergen relation
            await tx.dishAllergen.create({
              data: {
                dishId: newDish.id,
                allergenId: allergenRecord.id,
              },
            });
          }
        });

        console.log(`   ✅ Migrated: ${dish.name} (${dish.slotCategory})`);
        migrated++;
      } catch (error) {
        console.error(`   ❌ Error migrating ${dish.name}:`, error instanceof Error ? error.message : error);
        errors++;
      }
    }

    // Step 4: Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated} dishes`);
    console.log(`   ⏭️  Skipped: ${skipped} dishes (duplicates)`);
    console.log(`   ❌ Errors: ${errors} dishes`);
    console.log(`   📦 Total: ${localDishes.length} dishes processed\n`);

    // Step 5: Verify
    const finalCount = await neonPrisma.dish.count();
    console.log(`🎉 Final count in Neon database: ${finalCount} dishes\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (localDb) {
      localDb.close();
    }
    await neonPrisma.$disconnect();
  }
}

// Run migration
migrateDishes()
  .then(() => {
    console.log('✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
