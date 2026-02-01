/**
 * Check all recipe URLs in the database
 * 
 * This script:
 * 1. Fetches all dishes with sourceUrl
 * 2. Tests each URL to see if it's accessible
 * 3. Reports which URLs are returning 404 or other errors
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/check-recipe-urls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UrlCheckResult {
  dishId: string;
  dishName: string;
  url: string;
  status: 'valid' | '404' | 'error' | 'timeout';
  statusCode?: number;
  error?: string;
}

/**
 * Check if a URL is accessible
 */
async function checkUrl(url: string, timeout = 5000): Promise<{ status: 'valid' | '404' | 'error' | 'timeout'; statusCode?: number; error?: string }> {
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

    return { status: 'error', statusCode: response.status, error: `HTTP ${response.status}` };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { status: 'timeout', error: 'Request timeout' };
    }
    return { status: 'error', error: error.message || 'Unknown error' };
  }
}

/**
 * Normalize a URL to ensure it's a valid absolute URL
 */
function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  
  let normalized = url.trim();
  
  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');
  
  // If it doesn't start with http:// or https://, add https://
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    // Check if it looks like a domain
    if (normalized.startsWith('www.')) {
      normalized = 'https://' + normalized;
    } else if (normalized.includes('.') && !normalized.includes(' ')) {
      // Looks like a domain without www
      normalized = 'https://www.' + normalized;
    } else {
      // Can't normalize, return null
      return null;
    }
  }
  
  // Basic validation - must be a valid URL format
  try {
    const urlObj = new URL(normalized);
    // Must have http or https protocol
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

async function checkAllUrls() {
  console.log('🔍 Fetching all dishes with sourceUrl...\n');

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

    // Check URLs in batches to avoid overwhelming the server
    for (const dish of dishes) {
      if (!dish.sourceUrl) continue;

      const normalizedUrl = normalizeUrl(dish.sourceUrl);
      if (!normalizedUrl) {
        results.push({
          dishId: dish.id,
          dishName: dish.name,
          url: dish.sourceUrl,
          status: 'error',
          error: 'Invalid URL format',
        });
        continue;
      }

      // Update URL if it was normalized
      if (normalizedUrl !== dish.sourceUrl) {
        await prisma.dish.update({
          where: { id: dish.id },
          data: { sourceUrl: normalizedUrl },
        });
        console.log(`   🔧 Normalized URL for "${dish.name}"`);
        console.log(`      Old: ${dish.sourceUrl}`);
        console.log(`      New: ${normalizedUrl}\n`);
      }

      // Check URL
      process.stdout.write(`   Checking ${++checked}/${dishes.length}: ${dish.name}... `);
      const checkResult = await checkUrl(normalizedUrl);
      console.log(checkResult.status === 'valid' ? '✅' : '❌');

      results.push({
        dishId: dish.id,
        dishName: dish.name,
        url: normalizedUrl,
        ...checkResult,
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Summary
    const valid = results.filter(r => r.status === 'valid').length;
    const notFound = results.filter(r => r.status === '404').length;
    const errors = results.filter(r => r.status === 'error').length;
    const timeouts = results.filter(r => r.status === 'timeout').length;

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Valid: ${valid}`);
    console.log(`   ❌ 404 Not Found: ${notFound}`);
    console.log(`   ⚠️  Errors: ${errors}`);
    console.log(`   ⏱️  Timeouts: ${timeouts}\n`);

    // Group by domain
    const byDomain: Record<string, { valid: number; invalid: number; urls: UrlCheckResult[] }> = {};
    results.forEach(result => {
      try {
        const domain = new URL(result.url).hostname;
        if (!byDomain[domain]) {
          byDomain[domain] = { valid: 0, invalid: 0, urls: [] };
        }
        byDomain[domain].urls.push(result);
        if (result.status === 'valid') {
          byDomain[domain].valid++;
        } else {
          byDomain[domain].invalid++;
        }
      } catch {}
    });

    console.log('📈 By Domain:');
    Object.entries(byDomain)
      .sort((a, b) => (b[1].invalid + b[1].valid) - (a[1].invalid + a[1].valid))
      .forEach(([domain, stats]) => {
        const total = stats.valid + stats.invalid;
        const percentage = ((stats.valid / total) * 100).toFixed(1);
        console.log(`   ${domain}: ${stats.valid}/${total} valid (${percentage}%)`);
      });

    // Show problematic URLs
    if (notFound > 0 || errors > 0) {
      console.log(`\n❌ Problematic URLs:\n`);
      results
        .filter(r => r.status !== 'valid')
        .slice(0, 20)
        .forEach(result => {
          console.log(`   "${result.dishName}"`);
          console.log(`   ${result.url}`);
          console.log(`   Status: ${result.status}${result.statusCode ? ` (${result.statusCode})` : ''}${result.error ? ` - ${result.error}` : ''}\n`);
        });
      
      if (notFound + errors > 20) {
        console.log(`   ... and ${notFound + errors - 20} more\n`);
      }
    }

    // Show some valid URLs as examples
    if (valid > 0) {
      console.log(`\n✅ Sample Valid URLs:\n`);
      results
        .filter(r => r.status === 'valid')
        .slice(0, 5)
        .forEach(result => {
          console.log(`   "${result.dishName}"`);
          console.log(`   ${result.url}\n`);
        });
    }

  } catch (error) {
    console.error('❌ Error checking URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run check
checkAllUrls()
  .then(() => {
    console.log('✨ URL check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 URL check failed:', error);
    process.exit(1);
  });
