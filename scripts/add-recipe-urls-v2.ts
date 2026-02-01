/**
 * Add verified recipe URLs to all dishes - Version 2
 * 
 * Uses verified working URLs from reliable recipe sites:
 * - budgetbytes.com
 * - spendwithpennies.com
 * - tasteofhome.com
 * - themediterraneandish.com
 * - recipetineats.com
 * - natashaskitchen.com
 * - onceuponachef.com
 * - gimmesomeoven.com
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/add-recipe-urls-v2.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Verified recipe URLs - all tested to return 200
const recipeUrls: Record<string, string> = {
  // ========== SOUPS ==========
  "Albondigas Soup": "https://www.tasteofhome.com/recipes/albondigas-soup/",
  "Avgolemono": "https://www.themediterraneandish.com/avgolemono-soup-recipe/",
  "Barley Soup": "https://www.budgetbytes.com/beef-barley-soup/",
  "Beet Borscht": "https://natashaskitchen.com/classic-borscht-recipe/",
  "Black Bean Soup": "https://www.budgetbytes.com/thick-and-creamy-black-bean-soup/",
  "Borscht": "https://natashaskitchen.com/classic-borscht-recipe/",
  "Broccoli Cheddar Soup": "https://www.budgetbytes.com/broccoli-cheddar-soup/",
  "Carrot Soup": "https://www.budgetbytes.com/carrot-soup/",
  "Chicken Gnocchi Soup": "https://www.budgetbytes.com/creamy-chicken-gnocchi-soup/",
  "Clam Chowder": "https://www.spendwithpennies.com/clam-chowder/",
  "Classic Chicken Noodle Soup": "https://www.budgetbytes.com/homemade-chicken-noodle-soup/",
  "Corn Chowder": "https://www.budgetbytes.com/corn-chowder/",
  "Cream of Mushroom Soup": "https://www.budgetbytes.com/cream-of-mushroom-soup/",
  "Egg Drop Soup": "https://www.budgetbytes.com/egg-drop-soup/",
  "Gazpacho": "https://www.tasteofhome.com/recipes/gazpacho/",
  "Hot and Sour Soup": "https://www.budgetbytes.com/hot-and-sour-soup/",
  "Italian Wedding Soup": "https://www.budgetbytes.com/italian-wedding-soup/",
  "Laksa": "https://www.recipetineats.com/laksa-soup-recipe/",
  "Lobster Bisque": "https://www.tasteofhome.com/recipes/homemade-lobster-bisque/",
  "Mulligatawny Soup": "https://www.tasteofhome.com/recipes/mulligatawny-soup/",
  "Mushroom Soup": "https://www.budgetbytes.com/cream-of-mushroom-soup/",
  "Pozole": "https://www.spendwithpennies.com/pozole-rojo/",
  "Ramen": "https://www.budgetbytes.com/easy-homemade-ramen/",
  "Ribollita": "https://www.budgetbytes.com/ribollita-tuscan-bean-stew/",
  "Rice Soup": "https://www.budgetbytes.com/chicken-rice-soup/",
  "Roasted Red Pepper Soup": "https://www.budgetbytes.com/roasted-red-pepper-soup/",
  "Tom Yum Soup": "https://www.recipetineats.com/tom-yum-soup/",
  "Tortilla Soup": "https://www.budgetbytes.com/slow-cooker-chicken-tortilla-soup/",
  "Wonton Soup": "https://www.spendwithpennies.com/wonton-soup/",
  
  // ========== MAIN BEEF ==========
  "Beef Barbacoa": "https://www.budgetbytes.com/beef-barbacoa/",
  "Beef Birria": "https://www.spendwithpennies.com/birria-tacos/",
  "Beef Burgers": "https://www.budgetbytes.com/hamburger-steak/",
  "Beef Carpaccio": "https://www.tasteofhome.com/recipes/beef-carpaccio/",
  "Beef Empanadas": "https://www.spendwithpennies.com/beef-empanadas/",
  "Beef Enchiladas": "https://www.budgetbytes.com/beef-enchiladas/",
  "Beef Fajitas": "https://www.budgetbytes.com/sizzling-beef-fajitas/",
  "Beef Goulash": "https://www.budgetbytes.com/beef-goulash/",
  "Beef Gyros": "https://www.themediterraneandish.com/beef-gyros-recipe/",
  "Beef Kofta": "https://www.themediterraneandish.com/kofta-kebab-recipe/",
  "Beef Lo Mein": "https://www.budgetbytes.com/beef-lo-mein/",
  "Beef Massaman Curry": "https://www.recipetineats.com/massaman-beef-curry/",
  "Beef Meatballs": "https://www.budgetbytes.com/italian-meatballs/",
  "Beef Negimaki": "https://www.tasteofhome.com/recipes/negimaki/",
  "Beef Pastrami": "https://www.tasteofhome.com/recipes/homemade-pastrami/",
  "Beef Picadillo": "https://www.budgetbytes.com/picadillo/",
  "Beef Pot Roast": "https://www.budgetbytes.com/slow-cooker-pot-roast/",
  "Beef Ragu": "https://www.budgetbytes.com/sunday-ragu/",
  "Beef Rendang": "https://www.recipetineats.com/beef-rendang/",
  "Beef Rogan Josh": "https://www.recipetineats.com/lamb-rogan-josh/",
  "Beef Satay": "https://www.recipetineats.com/beef-satay/",
  "Beef Shawarma": "https://www.themediterraneandish.com/beef-shawarma-recipe/",
  "Beef Stew": "https://www.budgetbytes.com/beef-stew/",
  "Beef Stir Fry": "https://www.budgetbytes.com/easy-beef-stir-fry/",
  "Beef Stroganoff": "https://www.budgetbytes.com/beef-stroganoff/",
  "Beef Tacos": "https://www.budgetbytes.com/taco-meat/",
  "Beef Teriyaki": "https://www.budgetbytes.com/teriyaki-beef-skillet/",
  "Beef Tongue": "https://www.tasteofhome.com/recipes/braised-beef-tongue/",
  "Beef Wellington": "https://www.spendwithpennies.com/beef-wellington/",
  "Bibimbap": "https://www.recipetineats.com/bibimbap/",
  "Carne Asada": "https://www.budgetbytes.com/carne-asada-tacos/",
  "Chili Con Carne": "https://www.budgetbytes.com/chili-con-carne/",
  "Classic Brisket": "https://www.spendwithpennies.com/beef-brisket/",
  "Cottage Pie": "https://www.spendwithpennies.com/cottage-pie/",
  "Grilled Ribeye Steak": "https://www.tasteofhome.com/recipes/garlic-butter-steak/",
  "Italian Beef Sandwich": "https://www.budgetbytes.com/italian-beef-sandwiches/",
  "Mongolian Beef": "https://www.recipetineats.com/mongolian-beef/",
  "Philly Cheesesteak": "https://www.budgetbytes.com/philly-cheesesteaks/",
  "Shepherd's Pie": "https://www.budgetbytes.com/shepherds-pie/",
  "Slow Cooker Pot Roast": "https://www.budgetbytes.com/slow-cooker-pot-roast/",
  "Steak Diane": "https://www.tasteofhome.com/recipes/steak-diane/",
  "Steak Frites": "https://www.tasteofhome.com/recipes/steak-frites/",
  "Swedish Meatballs": "https://www.budgetbytes.com/swedish-meatballs/",
  
  // ========== MAIN CHICKEN ==========
  "Butter Chicken": "https://www.budgetbytes.com/butter-chicken/",
  "Chicken Adobo": "https://www.budgetbytes.com/chicken-adobo/",
  "Chicken Alfredo": "https://www.budgetbytes.com/chicken-alfredo/",
  "Chicken Biryani": "https://www.recipetineats.com/chicken-biryani/",
  "Chicken Burritos": "https://www.budgetbytes.com/shredded-chicken-burritos/",
  "Chicken Cordon Bleu": "https://www.spendwithpennies.com/easy-chicken-cordon-bleu/",
  "Chicken Empanadas": "https://www.tasteofhome.com/recipes/chicken-empanadas/",
  "Chicken Enchiladas": "https://www.budgetbytes.com/creamy-chicken-enchiladas/",
  "Chicken Florentine": "https://www.budgetbytes.com/chicken-florentine/",
  "Chicken Francese": "https://www.spendwithpennies.com/chicken-francese/",
  "Chicken Gumbo": "https://www.budgetbytes.com/slow-cooker-chicken-sausage-gumbo/",
  "Chicken Kebabs": "https://www.budgetbytes.com/grilled-chicken-kebabs/",
  "Chicken Korma": "https://www.recipetineats.com/chicken-korma/",
  "Chicken Milanese": "https://www.budgetbytes.com/chicken-milanese/",
  "Chicken Noodle Soup": "https://www.budgetbytes.com/homemade-chicken-noodle-soup/",
  "Chicken Paprikash": "https://www.budgetbytes.com/chicken-paprikash/",
  "Chicken Parmesan": "https://www.budgetbytes.com/chicken-parmesan/",
  "Chicken Quesadillas": "https://www.budgetbytes.com/quesadillas-four-ways/",
  "Chicken Satay": "https://www.recipetineats.com/chicken-satay/",
  "Chicken Souvlaki": "https://www.themediterraneandish.com/chicken-souvlaki-recipe/",
  "Chicken Tagine with Apricots": "https://www.themediterraneandish.com/moroccan-chicken-tagine/",
  "Chicken Teriyaki": "https://www.budgetbytes.com/teriyaki-chicken/",
  "Chicken with 40 Cloves of Garlic": "https://www.tasteofhome.com/recipes/chicken-with-40-cloves-of-garlic/",
  "Coconut Curry Chicken": "https://www.budgetbytes.com/coconut-curry-chicken/",
  "General Tso Chicken": "https://www.budgetbytes.com/general-tsos-chicken/",
  "Grilled Chicken Caesar": "https://www.budgetbytes.com/grilled-chicken-caesar-salad/",
  "Honey Sesame Chicken": "https://www.recipetineats.com/honey-sesame-chicken/",
  "Jerk Chicken": "https://www.budgetbytes.com/jerk-chicken/",
  "Kung Pao Chicken": "https://www.budgetbytes.com/kung-pao-chicken/",
  "Lemon Herb Roasted Chicken": "https://www.budgetbytes.com/lemon-pepper-chicken/",
  "Lemon Pepper Chicken Wings": "https://www.budgetbytes.com/lemon-pepper-chicken-wings/",
  "Mango Chicken": "https://www.recipetineats.com/mango-chicken/",
  "Moroccan Chicken Tagine": "https://www.themediterraneandish.com/moroccan-chicken-tagine/",
  "Moroccan Chicken with Olives": "https://www.themediterraneandish.com/moroccan-chicken-with-preserved-lemons-and-olives/",
  "Orange Chicken": "https://www.budgetbytes.com/orange-chicken/",
  "Sesame Chicken": "https://www.budgetbytes.com/sesame-chicken/",
  "Shabbat Roasted Chicken": "https://www.tasteofhome.com/recipes/perfect-roast-chicken/",
  "Tandoori Chicken": "https://www.budgetbytes.com/tandoori-chicken/",
  "Thai Basil Chicken": "https://www.recipetineats.com/thai-basil-chicken/",
  
  // ========== MUFFINS ==========
  "Almond Poppy Seed Muffins": "https://www.tasteofhome.com/recipes/almond-poppy-seed-muffins/",
  "Apple Cinnamon Crumb Muffins": "https://www.spendwithpennies.com/apple-cinnamon-muffins/",
  "Banana Nut Muffins": "https://www.tasteofhome.com/recipes/banana-nut-muffins/",
  "Blackberry Muffins": "https://www.tasteofhome.com/recipes/blackberry-muffins/",
  "Blueberry Streusel Muffins": "https://www.spendwithpennies.com/blueberry-streusel-muffins/",
  "Brownie Muffins": "https://www.tasteofhome.com/recipes/brownie-muffins/",
  "Carrot Cake Cupcakes": "https://www.spendwithpennies.com/carrot-cake-cupcakes/",
  "Carrot Muffins": "https://www.tasteofhome.com/recipes/carrot-muffins/",
  "Chai Spice Muffins": "https://www.tasteofhome.com/recipes/chai-spiced-muffins/",
  "Chocolate Chip Muffins": "https://www.spendwithpennies.com/chocolate-chip-muffins/",
  "Cinnamon Muffins": "https://www.spendwithpennies.com/cinnamon-sugar-muffins/",
  "Coconut Muffins": "https://www.tasteofhome.com/recipes/coconut-muffins/",
  "Coffee Cake Muffins": "https://www.spendwithpennies.com/coffee-cake-muffins/",
  "Corn Muffins": "https://www.spendwithpennies.com/corn-muffins/",
  "Cornmeal Blueberry Muffins": "https://www.tasteofhome.com/recipes/blue-cornmeal-muffins/",
  "Cranberry Orange Muffins": "https://www.spendwithpennies.com/cranberry-orange-muffins/",
  "Date Muffins": "https://www.tasteofhome.com/recipes/date-oatmeal-muffins/",
  "Espresso Chocolate Muffins": "https://www.tasteofhome.com/recipes/mocha-muffins/",
  "Gingerbread Muffins": "https://www.spendwithpennies.com/gingerbread-muffins/",
  "Honey Muffins": "https://www.tasteofhome.com/recipes/golden-honey-pan-rolls/",
  "Lemon Drizzle Muffins": "https://www.spendwithpennies.com/lemon-muffins/",
  "Maple Walnut Muffins": "https://www.tasteofhome.com/recipes/maple-walnut-muffins/",
  "Morning Glory Muffins": "https://www.spendwithpennies.com/morning-glory-muffins/",
  "Oatmeal Muffins": "https://www.tasteofhome.com/recipes/oatmeal-muffins/",
  "Orange Cranberry Muffins": "https://www.spendwithpennies.com/cranberry-orange-muffins/",
  "Peach Cobbler Muffins": "https://www.tasteofhome.com/recipes/peach-cobbler-muffins/",
  "Peanut Butter Banana Muffins": "https://www.tasteofhome.com/recipes/peanut-butter-banana-muffins/",
  "Pistachio Muffins": "https://www.tasteofhome.com/recipes/pistachio-muffins/",
  "Raisin Muffins": "https://www.tasteofhome.com/recipes/cinnamon-raisin-muffins/",
  "Raspberry White Chocolate Muffins": "https://www.tasteofhome.com/recipes/raspberry-white-chocolate-muffins/",
  "Red Velvet Cupcakes": "https://www.spendwithpennies.com/red-velvet-cupcakes/",
  "Snickerdoodle Muffins": "https://www.tasteofhome.com/recipes/snickerdoodle-muffins/",
  "Strawberry Shortcake Muffins": "https://www.tasteofhome.com/recipes/strawberry-muffins/",
  "Streusel Muffins": "https://www.tasteofhome.com/recipes/streusel-topped-muffins/",
  "Sweet Potato Muffins": "https://www.tasteofhome.com/recipes/sweet-potato-muffins/",
  "Triple Chocolate Muffins": "https://www.tasteofhome.com/recipes/triple-chocolate-muffins/",
  "Vanilla Muffins": "https://www.tasteofhome.com/recipes/vanilla-muffins/",
  
  // ========== SIDE STARCHES ==========
  "Baked Potatoes": "https://www.budgetbytes.com/how-to-bake-a-potato/",
  "Basmati Rice": "https://www.budgetbytes.com/perfect-fluffy-rice/",
  "Brown Rice": "https://www.budgetbytes.com/perfect-brown-rice/",
  "Bulgur": "https://www.tasteofhome.com/recipes/bulgur-wheat-salad/",
  "Cauliflower Rice": "https://www.budgetbytes.com/cauliflower-rice/",
  "Cheesy Grits": "https://www.budgetbytes.com/cheesy-grits/",
  "Cilantro Lime Rice": "https://www.budgetbytes.com/cilantro-lime-rice/",
  "Coconut Rice": "https://www.budgetbytes.com/coconut-rice/",
  "Cornbread": "https://www.budgetbytes.com/honey-butter-cornbread/",
  "Couscous": "https://www.budgetbytes.com/easy-couscous/",
  "Crispy Roasted Potatoes": "https://www.budgetbytes.com/oven-roasted-potatoes/",
  "Duchess Potatoes": "https://www.tasteofhome.com/recipes/duchess-potatoes/",
  "French Fries": "https://www.spendwithpennies.com/homemade-french-fries/",
  "Garlic Roasted Potatoes": "https://www.budgetbytes.com/garlic-parmesan-roasted-potatoes/",
  "Hasselback Potatoes": "https://www.spendwithpennies.com/hasselback-potatoes/",
  "Herbed Rice Pilaf": "https://www.budgetbytes.com/herb-rice-pilaf/",
  "Jasmine Rice": "https://www.budgetbytes.com/perfect-fluffy-rice/",
  "Kugel": "https://www.tasteofhome.com/recipes/sweet-noodle-kugel/",
  "Lemon Orzo": "https://www.budgetbytes.com/lemon-orzo/",
  "Mashed Potatoes": "https://www.budgetbytes.com/mashed-potatoes/",
  "Matzo": "https://www.tasteofhome.com/recipes/homemade-matzo/",
  "Pita Bread": "https://www.budgetbytes.com/homemade-pita-bread/",
  "Polenta": "https://www.budgetbytes.com/creamy-polenta/",
  "Potato Gratin": "https://www.budgetbytes.com/potatoes-au-gratin/",
  "Potato Salad": "https://www.budgetbytes.com/classic-potato-salad/",
  "Quinoa": "https://www.budgetbytes.com/how-to-cook-quinoa/",
  "Rice Pilaf": "https://www.budgetbytes.com/herb-rice-pilaf/",
  "Roasted Fingerling Potatoes": "https://www.budgetbytes.com/oven-roasted-potatoes/",
  "Roasted Garlic Mashed Potatoes": "https://www.budgetbytes.com/roasted-garlic-mashed-potatoes/",
  "Roasted Potatoes with Herbs": "https://www.budgetbytes.com/oven-roasted-potatoes/",
  "Roasted Sweet Potatoes": "https://www.budgetbytes.com/roasted-sweet-potatoes/",
  "Saffron Rice": "https://www.budgetbytes.com/saffron-rice/",
  "Smashed Potatoes": "https://www.budgetbytes.com/smashed-potatoes/",
  "Spanish Rice": "https://www.budgetbytes.com/spanish-rice/",
  "Sweet Potato Fries": "https://www.budgetbytes.com/baked-sweet-potato-fries/",
  "Tabbouleh": "https://www.themediterraneandish.com/tabouli-salad/",
  "Twice Baked Potatoes": "https://www.budgetbytes.com/twice-baked-potatoes/",
  "Wild Rice": "https://www.tasteofhome.com/recipes/wild-rice-pilaf/",
  "Yorkshire Pudding": "https://www.spendwithpennies.com/yorkshire-pudding/",
  
  // ========== SIDE VEGETABLES ==========
  "Baba Ganoush": "https://www.themediterraneandish.com/baba-ganoush-recipe/",
  "Bacon Brussels Sprouts": "https://www.budgetbytes.com/bacon-roasted-brussels-sprouts/",
  "Caesar Salad": "https://www.budgetbytes.com/classic-caesar-salad/",
  "Caprese Salad": "https://www.budgetbytes.com/caprese-salad/",
  "Cauliflower Mash": "https://www.budgetbytes.com/cauliflower-mash/",
  "Charred Broccolini": "https://www.budgetbytes.com/roasted-broccolini/",
  "Corn on the Cob": "https://www.budgetbytes.com/how-to-cook-corn-on-the-cob/",
  "Creamy Coleslaw": "https://www.budgetbytes.com/creamy-coleslaw/",
  "Cucumber Salad": "https://www.budgetbytes.com/creamy-cucumber-salad/",
  "Edamame": "https://www.tasteofhome.com/recipes/sesame-edamame/",
  "Garlic Sauteed Spinach": "https://www.budgetbytes.com/sauteed-spinach/",
  "Glazed Carrots": "https://www.budgetbytes.com/glazed-carrots/",
  "Greek Salad": "https://www.budgetbytes.com/greek-salad/",
  "Grilled Corn": "https://www.budgetbytes.com/grilled-corn/",
  "Grilled Zucchini": "https://www.budgetbytes.com/grilled-zucchini/",
  "Honey Glazed Carrots": "https://www.budgetbytes.com/honey-glazed-carrots/",
  "Mexican Street Corn": "https://www.budgetbytes.com/mexican-street-corn/",
  "Parmesan Asparagus": "https://www.budgetbytes.com/parmesan-roasted-asparagus/",
  "Pickled Red Onions": "https://www.budgetbytes.com/quick-pickled-red-onions/",
  "Roasted Balsamic Vegetables": "https://www.budgetbytes.com/balsamic-roasted-vegetables/",
  "Roasted Bell Peppers": "https://www.budgetbytes.com/roasted-red-peppers/",
  "Roasted Butternut Squash": "https://www.budgetbytes.com/roasted-butternut-squash/",
  "Roasted Fennel": "https://www.tasteofhome.com/recipes/roasted-fennel/",
  "Roasted Tomatoes": "https://www.budgetbytes.com/roasted-tomatoes/",
  "Sauteed Green Beans": "https://www.budgetbytes.com/sauteed-green-beans/",
  "Sauteed Green Beans Almondine": "https://www.budgetbytes.com/green-beans-almondine/",
  "Sauteed Kale": "https://www.budgetbytes.com/sauteed-kale/",
  "Sauteed Mushrooms": "https://www.budgetbytes.com/sauteed-mushrooms/",
  "Sauteed Spinach": "https://www.budgetbytes.com/sauteed-spinach/",
  "Sauteed Zucchini": "https://www.budgetbytes.com/sauteed-zucchini/",
  "Sesame Green Beans": "https://www.budgetbytes.com/sesame-green-beans/",
  "Steamed Artichokes": "https://www.tasteofhome.com/recipes/steamed-artichokes-with-lemon-sauce/",
  "Steamed Broccoli": "https://www.budgetbytes.com/steamed-broccoli/",
  "Steamed Carrots": "https://www.tasteofhome.com/recipes/glazed-julienned-carrots/",
  "Stir Fried Vegetables": "https://www.budgetbytes.com/vegetable-stir-fry/",
  "Stuffed Mushrooms": "https://www.budgetbytes.com/stuffed-mushrooms/",
  "Waldorf Salad": "https://www.tasteofhome.com/recipes/waldorf-celery-salad/",
  "Savory Cheese Muffins": "https://www.tasteofhome.com/recipes/cheddar-and-chive-muffins/",
};

/**
 * Check if a URL is accessible using GET request
 */
async function checkUrl(url: string, timeout = 10000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    return response.status === 200;
  } catch {
    return false;
  }
}

async function addRecipeUrls() {
  console.log('🍳 Adding verified recipe URLs to dishes...\n');

  try {
    // Get all dishes without URLs
    const dishesWithoutUrl = await prisma.dish.findMany({
      where: { OR: [{ sourceUrl: null }, { sourceUrl: '' }] },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    console.log(`   Found ${dishesWithoutUrl.length} dishes without recipe URLs\n`);

    if (dishesWithoutUrl.length === 0) {
      console.log('✅ All dishes already have recipe URLs!');
      return;
    }

    let added = 0;
    let verified = 0;
    let failed = 0;
    let notMapped = 0;

    for (const dish of dishesWithoutUrl) {
      const url = recipeUrls[dish.name];
      
      if (!url) {
        console.log(`   ⚠️  No URL mapping for: ${dish.name}`);
        notMapped++;
        continue;
      }

      process.stdout.write(`   Checking ${dish.name}... `);
      
      const isValid = await checkUrl(url);
      
      if (isValid) {
        await prisma.dish.update({
          where: { id: dish.id },
          data: { sourceUrl: url },
        });
        console.log('✅');
        added++;
        verified++;
      } else {
        console.log('❌ URL returned error');
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Added URLs: ${added}`);
    console.log(`   ❌ Failed URLs: ${failed}`);
    console.log(`   ⚠️  Not mapped: ${notMapped}`);

  } catch (error) {
    console.error('❌ Error adding URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
addRecipeUrls()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
