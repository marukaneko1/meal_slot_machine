import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Importing kosher dishes...\n');

  const csvPath = path.join(__dirname, '../samples/kosher_dishes.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('Kosher dishes CSV not found at', csvPath);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Find column indices
  const nameIdx = headers.indexOf('name');
  const categoryIdx = headers.indexOf('slot_category');
  const ingredientsIdx = headers.indexOf('ingredients');
  const kosherIdx = headers.indexOf('kosher');
  const kosherStyleIdx = headers.indexOf('kosher_style');
  const difficultyIdx = headers.indexOf('difficulty');
  const mainProteinIdx = headers.indexOf('main_protein');
  const prepTimeIdx = headers.indexOf('prep_time_minutes');
  const cookTimeIdx = headers.indexOf('cook_time_minutes');
  const servingsIdx = headers.indexOf('servings');
  const cuisineIdx = headers.indexOf('cuisine');
  const tagsIdx = headers.indexOf('tags');
  const allergensIdx = headers.indexOf('contains_allergens');
  const notesIdx = headers.indexOf('notes');
  const sourceUrlIdx = headers.indexOf('source_url');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 1; i < lines.length; i++) {
    // Parse CSV line (handling quoted fields)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const name = values[nameIdx]?.replace(/"/g, '');
    const slotCategory = values[categoryIdx]?.replace(/"/g, '');

    if (!name || !slotCategory) {
      skipped++;
      continue;
    }

    // Check if dish already exists
    const existing = await prisma.dish.findUnique({
      where: { name_slotCategory: { name, slotCategory } },
    });

    if (existing) {
      skipped++;
      continue;
    }

    try {
      // Parse ingredients
      const ingredientsRaw = values[ingredientsIdx]?.replace(/"/g, '') || '';
      const ingredientNames = ingredientsRaw
        .split(',')
        .map(i => i.trim().toLowerCase())
        .filter(i => i.length > 0);

      // Create ingredients
      const ingredientIds: string[] = [];
      for (const ingName of ingredientNames) {
        const ing = await prisma.ingredient.upsert({
          where: { name: ingName },
          update: {},
          create: { name: ingName },
        });
        ingredientIds.push(ing.id);
      }

      // Parse tags
      const tagsRaw = values[tagsIdx]?.replace(/"/g, '') || '';
      const tagNames = tagsRaw
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      // Create tags
      const tagIds: string[] = [];
      for (const tagName of tagNames) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        tagIds.push(tag.id);
      }

      // Parse allergens
      const allergensRaw = values[allergensIdx]?.replace(/"/g, '') || '';
      const allergenNames = allergensRaw
        .split(',')
        .map(a => a.trim().toLowerCase())
        .filter(a => a.length > 0);

      // Get allergen IDs
      const allergenIds: string[] = [];
      for (const allergenName of allergenNames) {
        const allergen = await prisma.allergen.findUnique({
          where: { name: allergenName },
        });
        if (allergen) {
          allergenIds.push(allergen.id);
        }
      }

      // Parse boolean and numeric fields
      const kosherValue = values[kosherIdx]?.toLowerCase() || '';
      const kosher = kosherValue === 'true' || kosherValue === 'yes' || kosherValue === '1';
      const kosherStyle = values[kosherStyleIdx] || 'unknown';
      const difficulty = values[difficultyIdx] || 'unknown';
      const mainProtein = values[mainProteinIdx] || null;
      const prepTime = parseInt(values[prepTimeIdx]) || null;
      const cookTime = parseInt(values[cookTimeIdx]) || null;
      const servings = parseInt(values[servingsIdx]) || null;
      const cuisine = values[cuisineIdx] || null;
      const notes = values[notesIdx]?.replace(/"/g, '') || null;
      const sourceUrl = values[sourceUrlIdx] || null;

      // Create dish with relations
      await prisma.dish.create({
        data: {
          name,
          slotCategory,
          kosher,
          kosherStyle,
          difficulty,
          mainProtein,
          cuisine,
          prepTimeMinutes: prepTime,
          cookTimeMinutes: cookTime,
          servings,
          notes,
          sourceUrl,
          ingredients: {
            create: ingredientIds.map(ingredientId => ({ ingredientId })),
          },
          tags: {
            create: tagIds.map(tagId => ({ tagId })),
          },
          allergens: {
            create: allergenIds.map(allergenId => ({ allergenId })),
          },
        },
      });

      imported++;
      if (imported % 10 === 0) {
        console.log(`  Imported ${imported} dishes...`);
      }
    } catch (error) {
      console.error(`Error importing row ${i + 1} (${name}):`, error);
      errors++;
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);

  // Print summary
  const totalDishes = await prisma.dish.count();
  const kosherDishes = await prisma.dish.count({ where: { kosher: true } });
  
  console.log(`\n📊 Database Summary:`);
  console.log(`   Total dishes: ${totalDishes}`);
  console.log(`   Kosher dishes: ${kosherDishes}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
