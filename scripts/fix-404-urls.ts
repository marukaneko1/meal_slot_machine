/**
 * Fix 404 URLs in the database
 * 
 * This script:
 * 1. Identifies URLs that return 404
 * 2. Attempts to fix common URL issues
 * 3. Removes or nullifies URLs that can't be fixed
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/fix-404-urls.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');

interface UrlCheckResult {
  dishId: string;
  dishName: string;
  originalUrl: string;
  status: 'valid' | '404' | 'error' | 'timeout';
  fixedUrl?: string;
}

/**
 * Check if a URL is accessible
 */
async function checkUrl(url: string, timeout = 5000): Promise<{ status: 'valid' | '404' | 'error' | 'timeout'; statusCode?: number }> {
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
      return { status: '404', statusCode: 404 };
    }

    if (response.status >= 200 && response.status < 400) {
      return { status: 'valid', statusCode: response.status };
    }

    return { status: 'error', statusCode: response.status };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { status: 'timeout' };
    }
    return { status: 'error' };
  }
}

/**
 * Try to fix common URL issues
 */
function tryFixUrl(url: string): string[] {
  const fixes: string[] = [];
  
  // Allrecipes.com fixes
  if (url.includes('allrecipes.com')) {
    // Try removing trailing slashes
    fixes.push(url.replace(/\/+$/, ''));
    
    // Try with /recipe/ prefix variations
    const match = url.match(/allrecipes\.com\/recipe\/(\d+)\/([^\/]+)/);
    if (match) {
      const [, id, slug] = match;
      // Try different formats
      fixes.push(`https://www.allrecipes.com/recipe/${id}/${slug}/`);
      fixes.push(`https://www.allrecipes.com/recipe/${id}/`);
    }
  }
  
  // Kosher.com fixes
  if (url.includes('kosher.com')) {
    // Remove trailing slashes
    fixes.push(url.replace(/\/+$/, ''));
    
    // Try with /recipe/ prefix
    if (!url.includes('/recipe/')) {
      const match = url.match(/kosher\.com\/(.+)/);
      if (match) {
        fixes.push(`https://www.kosher.com/recipe/${match[1]}`);
      }
    }
  }
  
  return [...new Set(fixes)]; // Remove duplicates
}

async function fix404Urls() {
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

    if (dishes.length === 0) {
      console.log('✅ No dishes with sourceUrl found.');
      return;
    }

    const results: UrlCheckResult[] = [];
    let checked = 0;
    let fixed = 0;
    let removed = 0;

    for (const dish of dishes) {
      if (!dish.sourceUrl) continue;

      checked++;
      process.stdout.write(`   Checking ${checked}/${dishes.length}: ${dish.name}... `);

      // Check original URL
      const checkResult = await checkUrl(dish.sourceUrl);
      
      if (checkResult.status === 'valid') {
        console.log('✅');
        results.push({
          dishId: dish.id,
          dishName: dish.name,
          originalUrl: dish.sourceUrl,
          status: 'valid',
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      if (checkResult.status === '404') {
        console.log('❌ 404 - attempting fixes...');
        
        // Try to fix the URL
        const fixes = tryFixUrl(dish.sourceUrl);
        let fixedUrl: string | null = null;

        for (const fixUrl of fixes) {
          if (fixUrl === dish.sourceUrl) continue; // Skip if same as original
          
          const fixCheck = await checkUrl(fixUrl);
          if (fixCheck.status === 'valid') {
            fixedUrl = fixUrl;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        if (fixedUrl) {
          console.log(`      ✅ Fixed: ${fixedUrl}`);
          
          if (!DRY_RUN) {
            await prisma.dish.update({
              where: { id: dish.id },
              data: { sourceUrl: fixedUrl },
            });
          }
          
          fixed++;
          results.push({
            dishId: dish.id,
            dishName: dish.name,
            originalUrl: dish.sourceUrl,
            status: 'valid',
            fixedUrl,
          });
        } else {
          console.log(`      ❌ Could not fix - removing URL`);
          
          if (!DRY_RUN) {
            await prisma.dish.update({
              where: { id: dish.id },
              data: { sourceUrl: null },
            });
          }
          
          removed++;
          results.push({
            dishId: dish.id,
            dishName: dish.name,
            originalUrl: dish.sourceUrl,
            status: '404',
          });
        }
      } else {
        console.log(`⚠️  ${checkResult.status}`);
        results.push({
          dishId: dish.id,
          dishName: dish.name,
          originalUrl: dish.sourceUrl,
          status: checkResult.status,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Summary
    const valid = results.filter(r => r.status === 'valid').length;
    const invalid = results.filter(r => r.status !== 'valid').length;

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Valid URLs: ${valid}`);
    console.log(`   🔧 Fixed URLs: ${fixed}`);
    console.log(`   🗑️  Removed URLs: ${removed}`);
    console.log(`   ❌ Invalid URLs: ${invalid - removed}`);
    
    if (DRY_RUN) {
      console.log(`\n⚠️  DRY RUN MODE - No changes were made to the database`);
    } else {
      console.log(`\n✨ Database updated!`);
    }

  } catch (error) {
    console.error('❌ Error fixing URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run fix
fix404Urls()
  .then(() => {
    console.log('\n✨ URL fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 URL fix failed:', error);
    process.exit(1);
  });
