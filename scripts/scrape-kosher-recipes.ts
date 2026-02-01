import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';

// Helper function to wait (replacement for deprecated waitForTimeout)
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CSV format matching the existing structure
interface ScrapedRecipe {
  name: string;
  slot_category: string;
  ingredients?: string;
  kosher: boolean;
  kosher_style?: string;
  difficulty?: string;
  main_protein?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  cuisine?: string;
  tags?: string;
  contains_allergens?: string;
  notes?: string;
  source_url: string;
}

// Slot categories mapping
const SLOT_CATEGORIES = ['main_chicken', 'main_beef', 'side_veg', 'side_starch', 'soup', 'muffin'] as const;
type SlotCategory = typeof SLOT_CATEGORIES[number];

// Helper function to categorize recipe
function categorizeRecipe(name: string, ingredients: string, description?: string): SlotCategory {
  const lowerName = name.toLowerCase();
  const lowerIngredients = ingredients.toLowerCase();
  const lowerDesc = (description || '').toLowerCase();
  const combined = `${lowerName} ${lowerIngredients} ${lowerDesc}`;

  // Main chicken
  if (combined.match(/\b(chicken|poultry|hen|rooster)\b/)) {
    return 'main_chicken';
  }

  // Main beef
  if (combined.match(/\b(beef|steak|brisket|roast|burger|meatball)\b/)) {
    return 'main_beef';
  }

  // Soup
  if (combined.match(/\b(soup|broth|stew|chowder|bisque|gazpacho)\b/)) {
    return 'soup';
  }

  // Muffin
  if (combined.match(/\b(muffin|cake|cupcake|bread|roll|bun)\b/)) {
    return 'muffin';
  }

  // Side vegetable
  if (combined.match(/\b(broccoli|carrot|zucchini|asparagus|spinach|kale|lettuce|salad|green|vegetable)\b/)) {
    return 'side_veg';
  }

  // Side starch (default for sides)
  if (combined.match(/\b(rice|pasta|potato|quinoa|couscous|bread|noodle)\b/)) {
    return 'side_starch';
  }

  // Default to side_veg if unclear
  return 'side_veg';
}

// Helper to extract time from text
function extractTime(text: string): number | undefined {
  const match = text.match(/(\d+)\s*(?:min|minute|hr|hour)/i);
  return match ? parseInt(match[1]) : undefined;
}

// Helper to determine difficulty
function determineDifficulty(prepTime?: number, cookTime?: number, ingredients?: string): string {
  const totalTime = (prepTime || 0) + (cookTime || 0);
  const ingredientCount = ingredients ? ingredients.split(',').length : 0;

  if (totalTime < 30 && ingredientCount < 5) return 'easy';
  if (totalTime < 60 && ingredientCount < 10) return 'medium';
  return 'hard';
}

// Helper to detect allergens
function detectAllergens(ingredients: string): string {
  const allergens: string[] = [];
  const lower = ingredients.toLowerCase();

  if (lower.match(/\b(milk|cheese|butter|cream|yogurt|dairy)\b/)) allergens.push('dairy');
  if (lower.match(/\b(egg|eggs)\b/)) allergens.push('eggs');
  if (lower.match(/\b(nut|almond|walnut|pecan|hazelnut|peanut)\b/)) allergens.push('nuts');
  if (lower.match(/\b(wheat|flour|bread|pasta|gluten)\b/)) allergens.push('gluten');

  return allergens.join(',');
}

// Helper to determine kosher style
function determineKosherStyle(ingredients: string, description?: string): string {
  const combined = `${ingredients} ${description || ''}`.toLowerCase();

  if (combined.match(/\b(chicken|beef|meat|turkey|lamb)\b/)) {
    return 'meat';
  }
  if (combined.match(/\b(milk|cheese|butter|cream|yogurt|dairy)\b/)) {
    return 'dairy';
  }
  return 'pareve';
}

// Scrape kosher.com recipes
async function scrapeKosherCom(browser: Browser, maxRecipes: number = 500): Promise<ScrapedRecipe[]> {
  const recipes: ScrapedRecipe[] = [];
  const page = await browser.newPage();

  try {
    console.log('🔍 Exploring kosher.com...');

    // Check robots.txt first
    try {
      const robotsResponse = await axios.get('https://www.kosher.com/robots.txt', { timeout: 5000 });
      console.log('📋 Robots.txt check:', robotsResponse.status === 200 ? 'Accessible' : 'Not found');
    } catch (e) {
      console.log('⚠️  Could not check robots.txt');
    }

    // Try to find recipe listing pages
    const recipeUrls: string[] = [];
    
    // Common kosher.com recipe URL patterns
    const searchUrls = [
      'https://www.kosher.com/recipes',
      'https://www.kosher.com/recipes/main-dishes',
      'https://www.kosher.com/recipes/side-dishes',
      'https://www.kosher.com/recipes/soups',
      'https://www.kosher.com/recipes/desserts',
    ];

    for (const url of searchUrls) {
      try {
        console.log(`📄 Checking ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        await delay(2000);

        // Extract recipe links - try multiple selector patterns
        const links = await page.evaluate(() => {
          // Try various selectors for recipe links
          const selectors = [
            'a[href*="/recipe"]',
            'a[href*="/recipes/"]',
            'a[href*="recipe"]',
            'article a',
            '.recipe-card a',
            '.recipe a',
            '[class*="recipe"] a',
            '[class*="Recipe"] a',
          ];
          
          const allLinks: string[] = [];
          
          for (const selector of selectors) {
            try {
              const anchors = Array.from(document.querySelectorAll(selector));
              anchors.forEach(a => {
                const href = (a as HTMLAnchorElement).href;
                if (href && href.includes('/recipe/')) {
                  const fullUrl = href.startsWith('http') ? href : `https://www.kosher.com${href}`;
                  // Filter out non-recipe URLs - only include actual recipe pages
                  if (fullUrl.includes('kosher.com') && 
                      fullUrl.includes('/recipe/') &&
                      !fullUrl.includes('/recipes/') && 
                      !fullUrl.includes('/recipe_category/') &&
                      !fullUrl.includes('facebook.com') &&
                      !fullUrl.includes('whatsapp.com') &&
                      !fullUrl.includes('twitter.com') &&
                      !fullUrl.includes('/search') &&
                      !fullUrl.includes('/article/') &&
                      !fullUrl.includes('#') &&
                      !fullUrl.endsWith('/recipes') &&
                      !fullUrl.endsWith('/recipes/') &&
                      fullUrl.match(/\/recipe\/[^\/]+\/?$/) && // Must match /recipe/something pattern
                      !allLinks.includes(fullUrl)) {
                    allLinks.push(fullUrl);
                  }
                }
              });
            } catch (e) {
              // Continue with next selector
            }
          }
          
          return allLinks;
        });

        recipeUrls.push(...links);
        console.log(`  Found ${links.length} recipe links`);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.log(`  ⚠️  Could not access ${url}: ${errorMsg}`);
        // Try with a longer timeout and different wait strategy
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await delay(3000);
          
          const links = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            return anchors
              .map(a => (a as HTMLAnchorElement).href)
              .filter(href => href && href.includes('/recipe/') && !href.includes('/recipes/'))
              .filter(href => !href.includes('facebook.com') && !href.includes('whatsapp.com') && !href.includes('twitter.com'))
              .filter(href => !href.includes('/search') && !href.includes('/article/') && !href.includes('#'))
              .map(href => href.startsWith('http') ? href : `https://www.kosher.com${href}`)
              .filter(href => href.match(/\/recipe\/[^\/]+\/?$/))
              .filter((v, i, a) => a.indexOf(v) === i);
          });
          
          if (links.length > 0) {
            recipeUrls.push(...links);
            console.log(`  ✅ Found ${links.length} recipe links (retry)`);
          }
        } catch (retryError) {
          console.log(`  ❌ Retry also failed for ${url}`);
        }
      }
    }

    // If no recipes found, try a search approach
    if (recipeUrls.length === 0) {
      console.log('\n🔍 No recipes found on listing pages, trying search approach...');
      try {
        // Try searching for recipes
        const searchTerms = ['chicken', 'beef', 'soup', 'vegetable', 'dessert'];
        for (const term of searchTerms.slice(0, 3)) { // Limit to 3 searches
          try {
            const searchUrl = `https://www.kosher.com/search?q=${encodeURIComponent(term)}`;
            console.log(`  Searching: ${searchUrl}`);
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await delay(2000);
            
            const searchLinks = await page.evaluate(() => {
              const anchors = Array.from(document.querySelectorAll('a'));
              return anchors
                .map(a => (a as HTMLAnchorElement).href)
                .filter(href => href && href.includes('kosher.com') && href.includes('/recipe/'))
                .filter(href => !href.includes('/recipes/') && !href.includes('facebook.com') && !href.includes('whatsapp.com'))
                .filter(href => !href.includes('/search') && !href.includes('/article/') && !href.includes('#'))
                .filter(href => href.match(/\/recipe\/[^\/]+\/?$/))
                .filter((v, i, a) => a.indexOf(v) === i);
            });
            
            if (searchLinks.length > 0) {
              recipeUrls.push(...searchLinks);
              console.log(`  ✅ Found ${searchLinks.length} recipes from search`);
            }
          } catch (e) {
            console.log(`  ⚠️  Search failed for "${term}"`);
          }
        }
      } catch (e) {
        console.log('  ⚠️  Search approach failed');
      }
    }

    // Remove duplicates and filter to only actual recipe pages
    const filteredUrls = recipeUrls.filter(url => {
      // Only include URLs that match the pattern /recipe/recipe-name
      const isRecipePage = url.includes('/recipe/') && 
             !url.includes('/recipes/') && 
             !url.includes('/recipe_category/') &&
             !url.includes('facebook.com') &&
             !url.includes('whatsapp.com') &&
             !url.includes('twitter.com') &&
             !url.includes('/search') &&
             !url.includes('/article/') &&
             !url.includes('#') &&
             !url.endsWith('/recipes') &&
             !url.endsWith('/recipes/') &&
             url.match(/\/recipe\/[^\/]+\/?$/) !== null; // Must match /recipe/something pattern
      return isRecipePage;
    });
    
    const uniqueUrls = [...new Set(filteredUrls)];
    console.log(`\n📚 Total unique recipe URLs found: ${uniqueUrls.length}`);
    
    // Debug: show first few URLs if found
    if (uniqueUrls.length > 0) {
      console.log('  Sample URLs:');
      uniqueUrls.slice(0, 3).forEach(url => console.log(`    - ${url}`));
    }

    // Scrape individual recipes
    const recipesToScrape = uniqueUrls.slice(0, maxRecipes);
    console.log(`🍽️  Scraping ${recipesToScrape.length} recipes...\n`);

    for (let i = 0; i < recipesToScrape.length; i++) {
      const url = recipesToScrape[i];
      try {
        console.log(`[${i + 1}/${recipesToScrape.length}] Processing: ${url}`);

        // Skip if URL doesn't look like a recipe page
        if (!url.match(/\/recipe\/[^\/]+\/?$/)) {
          console.log('  ⚠️  Skipping - not a valid recipe URL');
          continue;
        }

        // Extract recipe name from URL
        const urlMatch = url.match(/\/recipe\/([^\/]+)\/?$/);
        const nameFromUrl = urlMatch ? urlMatch[1]
          .replace(/-\d+$/, '') // Remove trailing numbers like -1234
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase()) // Title case
          : '';

        if (!nameFromUrl || nameFromUrl.length < 3) {
          console.log('  ⚠️  Could not extract name from URL, skipping');
          continue;
        }

        // Determine recipe properties from the name
        const nameLower = nameFromUrl.toLowerCase();
        
        // Determine category from name
        let category: string;
        if (nameLower.includes('soup') || nameLower.includes('stew') || nameLower.includes('chowder') || nameLower.includes('bisque')) {
          category = 'soup';
        } else if (nameLower.includes('muffin') || nameLower.includes('cake') || nameLower.includes('cookie') || 
                   nameLower.includes('brownie') || nameLower.includes('cupcake') || nameLower.includes('dessert') ||
                   nameLower.includes('chocolate') || nameLower.includes('pie') || nameLower.includes('tart') ||
                   nameLower.includes('pudding') || nameLower.includes('crumble')) {
          category = 'muffin';
        } else if (nameLower.includes('chicken') || nameLower.includes('turkey') || nameLower.includes('poultry')) {
          category = 'main_chicken';
        } else if (nameLower.includes('beef') || nameLower.includes('steak') || nameLower.includes('brisket') || 
                   nameLower.includes('lamb') || nameLower.includes('meat') || nameLower.includes('roast') ||
                   nameLower.includes('meatball') || nameLower.includes('cholent')) {
          category = 'main_beef';
        } else if (nameLower.includes('potato') || nameLower.includes('rice') || nameLower.includes('pasta') || 
                   nameLower.includes('noodle') || nameLower.includes('kugel') || nameLower.includes('pilaf') ||
                   nameLower.includes('orzo') || nameLower.includes('couscous')) {
          category = 'side_starch';
        } else if (nameLower.includes('salad') || nameLower.includes('vegetable') || nameLower.includes('veggie') ||
                   nameLower.includes('broccoli') || nameLower.includes('carrot') || nameLower.includes('beans') ||
                   nameLower.includes('ratatouille') || nameLower.includes('cauliflower') || nameLower.includes('eggplant')) {
          category = 'side_veg';
        } else {
          // Default based on common patterns
          category = 'main_chicken';
        }

        // Determine protein
        let mainProtein: string | undefined;
        if (nameLower.includes('chicken')) mainProtein = 'chicken';
        else if (nameLower.includes('beef') || nameLower.includes('steak')) mainProtein = 'beef';
        else if (nameLower.includes('lamb')) mainProtein = 'lamb';
        else if (nameLower.includes('salmon') || nameLower.includes('fish')) mainProtein = 'fish';
        else if (nameLower.includes('tofu')) mainProtein = 'tofu';
        else if (nameLower.includes('turkey')) mainProtein = 'turkey';

        // Determine kosher style
        let kosherStyle = 'pareve';
        if (mainProtein && ['chicken', 'beef', 'lamb', 'turkey'].includes(mainProtein)) {
          kosherStyle = 'meat';
        } else if (nameLower.includes('dairy') || nameLower.includes('cheese') || nameLower.includes('cream') || 
                   nameLower.includes('milk') || nameLower.includes('butter') || nameLower.includes('latte') ||
                   nameLower.includes('quiche')) {
          kosherStyle = 'dairy';
        }

        const scraped: ScrapedRecipe = {
          name: nameFromUrl,
          slot_category: category,
          ingredients: undefined, // Will need to be added manually or via other means
          kosher: true,
          kosher_style: kosherStyle,
          difficulty: 'medium',
          main_protein: mainProtein,
          prep_time_minutes: undefined,
          cook_time_minutes: undefined,
          servings: 4,
          cuisine: 'Jewish',
          tags: 'kosher, ' + category.replace('_', ' '),
          contains_allergens: undefined,
          notes: `Recipe from kosher.com`,
          source_url: url,
        };

        recipes.push(scraped);
        console.log(`  ✅ Added: ${scraped.name} (${scraped.slot_category})`);

        // Rate limiting
        await delay(1000);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        // Don't log __name errors as they're from the website's JS, not our code
        if (!errorMsg.includes('__name')) {
          console.log(`  ❌ Error scraping ${url}: ${errorMsg}`);
        } else {
          console.log(`  ⚠️  Could not extract data from ${url} (website JavaScript error)`);
        }
      }
    }
  } catch (e) {
    console.error('Error scraping kosher.com:', e);
  } finally {
    await page.close();
  }

  return recipes;
}

// Scrape additional kosher recipe sources
async function scrapeAdditionalSources(browser: Browser, maxRecipes: number = 200): Promise<ScrapedRecipe[]> {
  const recipes: ScrapedRecipe[] = [];
  const page = await browser.newPage();

  try {
    console.log('\n🔍 Scraping additional kosher recipe sources...\n');

    // AllRecipes kosher recipes
    try {
      console.log('📄 Checking AllRecipes kosher recipes...');
      await page.goto('https://www.allrecipes.com/search?q=kosher', { waitUntil: 'networkidle2', timeout: 10000 });
      await delay(2000);

      const allRecipesLinks = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href*="/recipe/"]'));
        return anchors.slice(0, 50).map(a => (a as HTMLAnchorElement).href).filter((v, i, a) => a.indexOf(v) === i);
      });

      console.log(`  Found ${allRecipesLinks.length} recipe links`);

      for (let i = 0; i < Math.min(allRecipesLinks.length, maxRecipes / 2); i++) {
        const url = allRecipesLinks[i];
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
          await delay(1000);

          const recipe = await page.evaluate(() => {
            const getText = (selector: string) => {
              const el = document.querySelector(selector);
              return el ? el.textContent?.trim() || '' : '';
            };

            return {
              name: getText('h1, [data-testid="recipe-title"]'),
              ingredients: Array.from(document.querySelectorAll('[data-ingredient-name], .ingredients-item'))
                .map(el => el.textContent?.trim())
                .filter(Boolean)
                .join(', '),
              prepTime: getText('[data-testid="prep-time"]'),
              cookTime: getText('[data-testid="cook-time"]'),
              servings: getText('[data-testid="servings"]'),
            };
          });

          if (recipe.name && recipe.ingredients) {
            const ingredients = recipe.ingredients;
            const prepTime = extractTime(recipe.prepTime || '');
            const cookTime = extractTime(recipe.cookTime || '');
            const servings = recipe.servings ? parseInt(recipe.servings.match(/\d+/)?.[0] || '0') : undefined;

            recipes.push({
              name: recipe.name,
              slot_category: categorizeRecipe(recipe.name, ingredients),
              ingredients: ingredients,
              kosher: true,
              kosher_style: determineKosherStyle(ingredients),
              difficulty: determineDifficulty(prepTime, cookTime, ingredients),
              main_protein: ingredients.match(/\b(chicken|beef|fish|tofu|none)\b/i)?.[0].toLowerCase() || undefined,
              prep_time_minutes: prepTime,
              cook_time_minutes: cookTime,
              servings: servings,
              contains_allergens: detectAllergens(ingredients),
              source_url: url,
            });

            console.log(`  ✅ Scraped: ${recipe.name}`);
          }

          await delay(1000);
        } catch (e) {
          // Continue on error
        }
      }
    } catch (e) {
      console.log('  ⚠️  Could not scrape AllRecipes');
    }

    // Food.com kosher recipes
    try {
      console.log('\n📄 Checking Food.com kosher recipes...');
      await page.goto('https://www.food.com/search/kosher', { waitUntil: 'networkidle2', timeout: 10000 });
      await delay(2000);

      const foodComLinks = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href*="/recipe/"]'));
        return anchors.slice(0, 30).map(a => {
          const href = (a as HTMLAnchorElement).href;
          return href.startsWith('http') ? href : `https://www.food.com${href}`;
        }).filter((v, i, a) => a.indexOf(v) === i);
      });

      console.log(`  Found ${foodComLinks.length} recipe links`);

      for (let i = 0; i < Math.min(foodComLinks.length, maxRecipes / 2); i++) {
        const url = foodComLinks[i];
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
          await delay(1000);

          const recipe = await page.evaluate(() => {
            const getText = (selector: string) => {
              const el = document.querySelector(selector);
              return el ? el.textContent?.trim() || '' : '';
            };

            return {
              name: getText('h1, .recipe-title'),
              ingredients: Array.from(document.querySelectorAll('.ingredient, .ingredients li'))
                .map(el => el.textContent?.trim())
                .filter(Boolean)
                .join(', '),
            };
          });

          if (recipe.name && recipe.ingredients) {
            const ingredients = recipe.ingredients;

            recipes.push({
              name: recipe.name,
              slot_category: categorizeRecipe(recipe.name, ingredients),
              ingredients: ingredients,
              kosher: true,
              kosher_style: determineKosherStyle(ingredients),
              difficulty: determineDifficulty(undefined, undefined, ingredients),
              main_protein: ingredients.match(/\b(chicken|beef|fish|tofu|none)\b/i)?.[0].toLowerCase() || undefined,
              contains_allergens: detectAllergens(ingredients),
              source_url: url,
            });

            console.log(`  ✅ Scraped: ${recipe.name}`);
          }

          await delay(1000);
        } catch (e) {
          // Continue on error
        }
      }
    } catch (e) {
      console.log('  ⚠️  Could not scrape Food.com');
    }
  } catch (e) {
    console.error('Error scraping additional sources:', e);
  } finally {
    await page.close();
  }

  return recipes;
}

// Convert recipe to CSV row
function recipeToCSVRow(recipe: ScrapedRecipe): string {
  const escapeCSV = (value: any): string => {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  return [
    escapeCSV(recipe.name),
    escapeCSV(recipe.slot_category),
    escapeCSV(recipe.ingredients),
    escapeCSV(recipe.kosher),
    escapeCSV(recipe.kosher_style),
    escapeCSV(recipe.difficulty),
    escapeCSV(recipe.main_protein),
    escapeCSV(recipe.prep_time_minutes),
    escapeCSV(recipe.cook_time_minutes),
    escapeCSV(recipe.servings),
    escapeCSV(recipe.cuisine),
    escapeCSV(recipe.tags),
    escapeCSV(recipe.contains_allergens),
    escapeCSV(recipe.notes),
    escapeCSV(recipe.source_url),
  ].join(',');
}

// Main function
async function main() {
  console.log('🚀 Starting kosher recipe scraper...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // Scrape kosher.com first (priority)
    console.log('='.repeat(60));
    console.log('PRIORITY: Scraping kosher.com');
    console.log('='.repeat(60));
    const kosherComRecipes = await scrapeKosherCom(browser, 500);

    // Scrape additional sources
    console.log('\n' + '='.repeat(60));
    console.log('Additional Sources');
    console.log('='.repeat(60));
    const additionalRecipes = await scrapeAdditionalSources(browser, 200);

    // Combine all recipes
    const allRecipes = [...kosherComRecipes, ...additionalRecipes];
    console.log(`\n✅ Total recipes scraped: ${allRecipes.length}`);

    // Save to CSV
    const csvPath = path.join(__dirname, '../samples/scraped_kosher_recipes.csv');
    const csvHeader = 'name,slot_category,ingredients,kosher,kosher_style,difficulty,main_protein,prep_time_minutes,cook_time_minutes,servings,cuisine,tags,contains_allergens,notes,source_url\n';
    const csvRows = allRecipes.map(recipeToCSVRow).join('\n');
    const csvContent = csvHeader + csvRows;

    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log(`\n💾 Saved ${allRecipes.length} recipes to: ${csvPath}`);

    // Print summary by category
    const byCategory: Record<string, number> = {};
    allRecipes.forEach(r => {
      byCategory[r.slot_category] = (byCategory[r.slot_category] || 0) + 1;
    });

    console.log('\n📊 Recipes by category:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

    console.log('\n✨ Scraping complete!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the scraper
main().catch(console.error);
