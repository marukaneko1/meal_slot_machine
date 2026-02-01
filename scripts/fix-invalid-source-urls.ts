/**
 * Fix invalid sourceUrl values in the database
 * 
 * This script:
 * 1. Finds all dishes with invalid sourceUrl (not starting with http:// or https://)
 * 2. Sets them to null so they won't show broken links
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/fix-invalid-source-urls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function isValidAbsoluteUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

async function fixInvalidSourceUrls() {
  console.log('🔍 Finding dishes with invalid sourceUrl values...\n');

  try {
    // Get all dishes with sourceUrl
    const dishes = await prisma.dish.findMany({
      where: {
        sourceUrl: { not: null },
      },
      select: {
        id: true,
        name: true,
        sourceUrl: true,
      },
    });

    console.log(`   Found ${dishes.length} dishes with sourceUrl\n`);

    if (dishes.length === 0) {
      console.log('✅ No dishes with sourceUrl found. Nothing to fix.');
      return;
    }

    // Find invalid URLs
    const invalidDishes = dishes.filter(
      (dish) => !isValidAbsoluteUrl(dish.sourceUrl)
    );

    console.log(`   Found ${invalidDishes.length} dishes with invalid sourceUrl\n`);

    if (invalidDishes.length === 0) {
      console.log('✅ All sourceUrl values are valid!');
      return;
    }

    // Show preview
    console.log('📋 Dishes with invalid sourceUrl:');
    invalidDishes.slice(0, 10).forEach((dish) => {
      console.log(`   - ${dish.name}: "${dish.sourceUrl}"`);
    });
    if (invalidDishes.length > 10) {
      console.log(`   ... and ${invalidDishes.length - 10} more\n`);
    } else {
      console.log('');
    }

    // Update invalid URLs to null
    console.log('🔧 Fixing invalid sourceUrl values...\n');
    let fixed = 0;

    for (const dish of invalidDishes) {
      await prisma.dish.update({
        where: { id: dish.id },
        data: { sourceUrl: null },
      });
      fixed++;
      if (fixed % 10 === 0) {
        console.log(`   Fixed ${fixed}/${invalidDishes.length}...`);
      }
    }

    console.log(`\n✅ Fixed ${fixed} dishes with invalid sourceUrl\n`);

    // Verify
    const remainingInvalid = await prisma.dish.findMany({
      where: {
        sourceUrl: { not: null },
      },
    });

    const stillInvalid = remainingInvalid.filter(
      (d) => !isValidAbsoluteUrl(d.sourceUrl)
    );

    if (stillInvalid.length === 0) {
      console.log('🎉 All sourceUrl values are now valid!\n');
    } else {
      console.log(`⚠️  Warning: ${stillInvalid.length} dishes still have invalid sourceUrl\n`);
    }

  } catch (error) {
    console.error('❌ Error fixing sourceUrls:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run fix
fixInvalidSourceUrls()
  .then(() => {
    console.log('✨ Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });
