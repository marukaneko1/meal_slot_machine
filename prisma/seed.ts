import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const DEFAULT_PROFILE = {
  name: 'Standard Weekly',
  rulesJson: JSON.stringify({
    categories: ['main_chicken', 'main_beef', 'side_veg', 'side_starch', 'soup', 'muffin'],
    name: 'Standard Weekly',
    description: '2 mains (1 chicken + 1 beef), 2 sides (1 vegetable + 1 starch), 1 soup, 1 muffin',
  }),
  isDefault: true,
};

const LIGHT_PROFILE = {
  name: 'Light Meals',
  rulesJson: JSON.stringify({
    categories: ['main_chicken', 'side_veg', 'soup'],
    name: 'Light Meals',
    description: 'Lighter meal plan with chicken, vegetables, and soup',
  }),
  isDefault: false,
};

const PROTEIN_HEAVY_PROFILE = {
  name: 'Protein Heavy',
  rulesJson: JSON.stringify({
    categories: ['main_chicken', 'main_beef', 'side_starch'],
    name: 'Protein Heavy',
    description: 'High protein meal plan with two mains and a starch',
  }),
  isDefault: false,
};

const STANDARD_ALLERGENS = ['dairy', 'eggs', 'nuts', 'gluten'];

async function main() {
  console.log('🌱 Starting seed...\n');

  // Create standard allergens
  console.log('Creating standard allergens...');
  for (const allergen of STANDARD_ALLERGENS) {
    await prisma.allergen.upsert({
      where: { name: allergen },
      update: {},
      create: { name: allergen },
    });
  }
  console.log('✓ Allergens created\n');

  // Create default profiles
  console.log('Creating customer profiles...');
  
  await prisma.customerProfile.upsert({
    where: { name: DEFAULT_PROFILE.name },
    update: {
      rulesJson: DEFAULT_PROFILE.rulesJson,
      isDefault: DEFAULT_PROFILE.isDefault,
    },
    create: DEFAULT_PROFILE,
  });

  await prisma.customerProfile.upsert({
    where: { name: LIGHT_PROFILE.name },
    update: {
      rulesJson: LIGHT_PROFILE.rulesJson,
    },
    create: LIGHT_PROFILE,
  });

  await prisma.customerProfile.upsert({
    where: { name: PROTEIN_HEAVY_PROFILE.name },
    update: {
      rulesJson: PROTEIN_HEAVY_PROFILE.rulesJson,
    },
    create: PROTEIN_HEAVY_PROFILE,
  });

  console.log('✓ Profiles created\n');

  // Check if sample CSV exists and import it
  const sampleCsvPath = path.join(__dirname, '../samples/sample_dishes.csv');
  
  if (fs.existsSync(sampleCsvPath)) {
    console.log('Found sample CSV, importing dishes...');
    
    const csvContent = fs.readFileSync(sampleCsvPath, 'utf-8');
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
      } catch (error) {
        console.error(`Error importing row ${i + 1}:`, error);
        skipped++;
      }
    }

    console.log(`✓ Imported ${imported} dishes, skipped ${skipped}\n`);
  } else {
    console.log('No sample CSV found at', sampleCsvPath);
    console.log('Run "npm run db:seed" after placing a CSV in /samples/\n');
  }

  // Print summary
  const dishCount = await prisma.dish.count();
  const profileCount = await prisma.customerProfile.count();
  const ingredientCount = await prisma.ingredient.count();
  const tagCount = await prisma.tag.count();

  console.log('📊 Database Summary:');
  console.log(`   Dishes: ${dishCount}`);
  console.log(`   Profiles: ${profileCount}`);
  console.log(`   Ingredients: ${ingredientCount}`);
  console.log(`   Tags: ${tagCount}`);
  console.log(`   Allergens: ${STANDARD_ALLERGENS.length}`);
  console.log('\n✅ Seed completed!');
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
