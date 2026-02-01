/**
 * Remove 404 URLs from the database
 * 
 * This script identifies and removes (sets to null) all sourceUrl values
 * that return 404 errors, since these links are broken and unusable.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/remove-404-urls.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Check if a URL is accessible
 */
async function checkUrl(url: string, timeout = 5000): Promise<{ status: 'valid' | '404' | 'error' | 'timeout' }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      return { status: '404' };
    }

    if (response.status >= 200 && response.status < 400) {
      return { status: 'valid' };
    }

    return { status: 'error' };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { status: 'timeout' };
    }
    return { status: 'error' };
  }
}

async function remove404Urls() {
  console.log('🔍 Fetching all dishes with sourceUrl...\n');

  try {
    const dishes = await prisma.dish.findMany({
      where: {
        sourceUrl: { not: null },
      },
      select: {
        id: true,
        name: true,
        sourceUrl: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`   Found ${dishes.length} dishes with sourceUrl\n`);
    console.log(`   Checking URLs...\n`);

    if (dishes.length === 0) {
      console.log('✅ No dishes with sourceUrl found.');
      return;
    }

    const toRemove: Array<{ id: string; name: string; url: string }> = [];
    let checked = 0;
    let valid = 0;

    for (const dish of dishes) {
      if (!dish.sourceUrl) continue;

      checked++;
      if (checked % 10 === 0) {
        process.stdout.write(`   Checked ${checked}/${dishes.length}...\r`);
      }

      const checkResult = await checkUrl(dish.sourceUrl);
      
      if (checkResult.status === 'valid') {
        valid++;
      } else if (checkResult.status === '404') {
        toRemove.push({
          id: dish.id,
          name: dish.name,
          url: dish.sourceUrl,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n   Checked ${checked} URLs\n`);

    // Summary
    console.log(`📊 Results:`);
    console.log(`   ✅ Valid URLs: ${valid}`);
    console.log(`   ❌ 404 URLs to remove: ${toRemove.length}\n`);

    if (toRemove.length === 0) {
      console.log('✅ No 404 URLs found!');
      return;
    }

    // Show some examples
    console.log(`📋 Sample URLs to remove (showing first 10):\n`);
    toRemove.slice(0, 10).forEach((item, idx) => {
      console.log(`   ${idx + 1}. "${item.name}"`);
      console.log(`      ${item.url}\n`);
    });

    if (toRemove.length > 10) {
      console.log(`   ... and ${toRemove.length - 10} more\n`);
    }

    // Remove 404 URLs
    if (!DRY_RUN) {
      console.log(`🗑️  Removing ${toRemove.length} 404 URLs...\n`);
      
      for (let i = 0; i < toRemove.length; i++) {
        const item = toRemove[i];
        await prisma.dish.update({
          where: { id: item.id },
          data: { sourceUrl: null },
        });
        
        if ((i + 1) % 10 === 0) {
          process.stdout.write(`   Removed ${i + 1}/${toRemove.length}...\r`);
        }
      }
      
      console.log(`\n   ✅ Removed ${toRemove.length} 404 URLs\n`);
    } else {
      console.log(`⚠️  DRY RUN MODE - No changes were made to the database`);
      console.log(`   Run without --dry-run to actually remove these URLs\n`);
    }

  } catch (error) {
    console.error('❌ Error removing 404 URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run removal
remove404Urls()
  .then(() => {
    console.log('✨ URL cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 URL cleanup failed:', error);
    process.exit(1);
  });
