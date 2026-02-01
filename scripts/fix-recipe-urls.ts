/**
 * Fix recipe URLs in the database
 * 
 * This script:
 * 1. Finds all dishes with sourceUrl
 * 2. Normalizes URLs (adds https:// if missing, removes trailing slashes, etc.)
 * 3. Validates URLs are properly formatted
 * 4. Updates invalid or malformed URLs
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/fix-recipe-urls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Normalizes a URL to ensure it's a valid absolute URL
 */
function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  
  let normalized = url.trim();
  
  // Remove leading/trailing whitespace
  normalized = normalized.trim();
  
  // If it doesn't start with http:// or https://, add https://
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    // Check if it looks like a domain
    if (normalized.includes('.') && !normalized.startsWith('www.')) {
      normalized = 'https://www.' + normalized;
    } else if (normalized.startsWith('www.')) {
      normalized = 'https://' + normalized;
    } else {
      // Assume it's a domain
      normalized = 'https://' + normalized;
    }
  }
  
  // Remove trailing slash (optional, but cleaner)
  normalized = normalized.replace(/\/+$/, '');
  
  // Basic validation - must be a valid URL format
  try {
    new URL(normalized);
    return normalized;
  } catch {
    return null;
  }
}

/**
 * Validates if a URL is properly formatted
 */
function isValidUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return false;
  
  try {
    const urlObj = new URL(url);
    // Must have http or https protocol
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

async function fixRecipeUrls() {
  console.log('🔍 Finding dishes with sourceUrl values...\n');

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
      console.log('✅ No dishes with sourceUrl found.');
      return;
    }

    // Analyze and fix URLs
    let fixed = 0;
    let invalid = 0;
    let unchanged = 0;
    const fixes: Array<{ name: string; old: string; new: string }> = [];

    for (const dish of dishes) {
      if (!dish.sourceUrl) continue;

      const originalUrl = dish.sourceUrl;
      const normalizedUrl = normalizeUrl(originalUrl);
      const isValid = isValidUrl(normalizedUrl);

      if (!isValid || !normalizedUrl) {
        console.log(`   ❌ Invalid URL for "${dish.name}": "${originalUrl}"`);
        invalid++;
        // Set to null if we can't fix it
        await prisma.dish.update({
          where: { id: dish.id },
          data: { sourceUrl: null },
        });
        continue;
      }

      if (normalizedUrl !== originalUrl) {
        fixes.push({
          name: dish.name,
          old: originalUrl,
          new: normalizedUrl,
        });
        
        await prisma.dish.update({
          where: { id: dish.id },
          data: { sourceUrl: normalizedUrl },
        });
        fixed++;
      } else {
        unchanged++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Unchanged: ${unchanged}`);
    console.log(`   Invalid (set to null): ${invalid}\n`);

    if (fixes.length > 0) {
      console.log('🔧 Fixed URLs:');
      fixes.slice(0, 20).forEach((fix) => {
        console.log(`   "${fix.name}":`);
        console.log(`     Old: ${fix.old}`);
        console.log(`     New: ${fix.new}\n`);
      });
      if (fixes.length > 20) {
        console.log(`   ... and ${fixes.length - 20} more\n`);
      }
    }

    // Verify all URLs are now valid
    const remainingDishes = await prisma.dish.findMany({
      where: {
        sourceUrl: { not: null },
      },
      select: {
        id: true,
        name: true,
        sourceUrl: true,
      },
    });

    const stillInvalid = remainingDishes.filter(
      (d) => !isValidUrl(d.sourceUrl)
    );

    if (stillInvalid.length === 0) {
      console.log('✅ All sourceUrl values are now valid!\n');
    } else {
      console.log(`⚠️  Warning: ${stillInvalid.length} dishes still have invalid sourceUrl\n`);
      stillInvalid.forEach((d) => {
        console.log(`   - ${d.name}: "${d.sourceUrl}"`);
      });
    }

  } catch (error) {
    console.error('❌ Error fixing URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run fix
fixRecipeUrls()
  .then(() => {
    console.log('✨ Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });
