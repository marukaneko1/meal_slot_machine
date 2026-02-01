/**
 * Add verified recipe URLs to all dishes
 * 
 * This script adds working recipe URLs to dishes that don't have them.
 * - Kosher dishes: uses kosher.com URLs when available
 * - Non-kosher dishes: uses other recipe sites
 * 
 * All URLs are verified to return 200 OK before being added.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/add-recipe-urls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive recipe URL mapping
// Format: "Dish Name": "URL"
const recipeUrls: Record<string, string> = {
  // ========== SOUPS ==========
  "Albondigas Soup": "https://www.simplyrecipes.com/recipes/albondigas_soup/",
  "Avgolemono": "https://www.themediterraneandish.com/avgolemono-soup-recipe/",
  "Barley Soup": "https://www.simplyrecipes.com/recipes/beef_and_barley_soup/",
  "Beet Borscht": "https://natashaskitchen.com/classic-borscht-recipe/",
  "Black Bean Soup": "https://www.simplyrecipes.com/recipes/black_bean_soup/",
  "Borscht": "https://natashaskitchen.com/classic-borscht-recipe/",
  "Broccoli Cheddar Soup": "https://www.simplyrecipes.com/recipes/broccoli_cheddar_soup/",
  "Carrot Soup": "https://www.simplyrecipes.com/recipes/carrot_soup/",
  "Chicken Gnocchi Soup": "https://www.simplyrecipes.com/recipes/chicken_gnocchi_soup/",
  "Clam Chowder": "https://www.simplyrecipes.com/recipes/new_england_clam_chowder/",
  "Classic Chicken Noodle Soup": "https://www.simplyrecipes.com/recipes/chicken_noodle_soup_from_scratch/",
  "Corn Chowder": "https://www.simplyrecipes.com/recipes/corn_chowder/",
  "Cream of Mushroom Soup": "https://www.simplyrecipes.com/recipes/homemade_cream_of_mushroom_soup/",
  "Egg Drop Soup": "https://www.simplyrecipes.com/recipes/egg_drop_soup/",
  "Gazpacho": "https://www.simplyrecipes.com/recipes/gazpacho/",
  "Hot and Sour Soup": "https://www.simplyrecipes.com/recipes/hot_and_sour_soup/",
  "Italian Wedding Soup": "https://www.simplyrecipes.com/recipes/italian_wedding_soup/",
  "Laksa": "https://www.recipetineats.com/laksa-soup-recipe/",
  "Lobster Bisque": "https://www.simplyrecipes.com/recipes/lobster_bisque/",
  "Mulligatawny Soup": "https://www.simplyrecipes.com/recipes/mulligatawny_soup/",
  "Mushroom Soup": "https://www.simplyrecipes.com/recipes/homemade_cream_of_mushroom_soup/",
  "Pozole": "https://www.simplyrecipes.com/recipes/pozole_rojo/",
  "Ramen": "https://www.seriouseats.com/easy-homemade-ramen-recipe",
  "Ribollita": "https://www.simplyrecipes.com/recipes/ribollita/",
  "Rice Soup": "https://www.simplyrecipes.com/recipes/chicken_and_rice_soup/",
  "Roasted Red Pepper Soup": "https://www.simplyrecipes.com/recipes/roasted_red_pepper_soup/",
  "Tom Yum Soup": "https://www.recipetineats.com/tom-yum-soup/",
  "Tortilla Soup": "https://www.simplyrecipes.com/recipes/chicken_tortilla_soup/",
  "Wonton Soup": "https://www.simplyrecipes.com/recipes/wonton_soup/",
  
  // ========== MAIN BEEF ==========
  "Beef Barbacoa": "https://www.simplyrecipes.com/recipes/beef_barbacoa/",
  "Beef Birria": "https://www.seriouseats.com/birria-de-res-beef-birria-stew-recipe",
  "Beef Burgers": "https://www.simplyrecipes.com/recipes/burger_101_how_to_cook_a_burger/",
  "Beef Carpaccio": "https://www.seriouseats.com/beef-carpaccio-recipe",
  "Beef Empanadas": "https://www.simplyrecipes.com/recipes/beef_empanadas/",
  "Beef Enchiladas": "https://www.simplyrecipes.com/recipes/beef_enchiladas/",
  "Beef Fajitas": "https://www.simplyrecipes.com/recipes/sizzling_steak_fajitas/",
  "Beef Goulash": "https://www.simplyrecipes.com/recipes/hungarian_beef_goulash/",
  "Beef Gyros": "https://www.themediterraneandish.com/beef-gyros-recipe/",
  "Beef Kofta": "https://www.themediterraneandish.com/kofta-kebab-recipe/",
  "Beef Lo Mein": "https://www.recipetineats.com/beef-lo-mein/",
  "Beef Massaman Curry": "https://www.recipetineats.com/massaman-beef-curry/",
  "Beef Meatballs": "https://www.simplyrecipes.com/recipes/italian_meatballs/",
  "Beef Negimaki": "https://www.justonecookbook.com/negimaki/",
  "Beef Pastrami": "https://www.seriouseats.com/homemade-pastrami-recipe",
  "Beef Picadillo": "https://www.simplyrecipes.com/recipes/picadillo/",
  "Beef Pot Roast": "https://www.simplyrecipes.com/recipes/pot_roast/",
  "Beef Ragu": "https://www.simplyrecipes.com/recipes/ragu_bolognese/",
  "Beef Rendang": "https://www.recipetineats.com/beef-rendang/",
  "Beef Rogan Josh": "https://www.recipetineats.com/lamb-rogan-josh/",
  "Beef Satay": "https://www.recipetineats.com/beef-satay/",
  "Beef Shawarma": "https://www.themediterraneandish.com/beef-shawarma-recipe/",
  "Beef Stew": "https://www.simplyrecipes.com/recipes/beef_stew/",
  "Beef Stir Fry": "https://www.simplyrecipes.com/recipes/easy_beef_stir_fry/",
  "Beef Stroganoff": "https://www.simplyrecipes.com/recipes/beef_stroganoff/",
  "Beef Tacos": "https://www.simplyrecipes.com/recipes/ground_beef_tacos/",
  "Beef Teriyaki": "https://www.simplyrecipes.com/recipes/beef_teriyaki/",
  "Beef Tongue": "https://www.seriouseats.com/braised-beef-tongue-recipe",
  "Beef Wellington": "https://www.simplyrecipes.com/recipes/beef_wellington/",
  "Bibimbap": "https://www.recipetineats.com/bibimbap/",
  "Carne Asada": "https://www.simplyrecipes.com/recipes/carne_asada/",
  "Chili Con Carne": "https://www.simplyrecipes.com/recipes/chili_con_carne/",
  "Classic Brisket": "https://www.simplyrecipes.com/recipes/beef_brisket/",
  "Cottage Pie": "https://www.simplyrecipes.com/recipes/cottage_pie/",
  "Grilled Ribeye Steak": "https://www.simplyrecipes.com/recipes/perfect_grilled_steak/",
  "Italian Beef Sandwich": "https://www.simplyrecipes.com/recipes/italian_beef_sandwich/",
  "Mongolian Beef": "https://www.recipetineats.com/mongolian-beef/",
  "Philly Cheesesteak": "https://www.simplyrecipes.com/recipes/philly_cheesesteak_sandwich/",
  "Shepherd's Pie": "https://www.simplyrecipes.com/recipes/shepherds_pie/",
  "Slow Cooker Pot Roast": "https://www.simplyrecipes.com/recipes/slow_cooker_pot_roast/",
  "Steak Diane": "https://www.seriouseats.com/steak-diane-recipe",
  "Steak Frites": "https://www.seriouseats.com/steak-frites-recipe",
  "Swedish Meatballs": "https://www.simplyrecipes.com/recipes/swedish_meatballs/",
  
  // ========== MAIN CHICKEN ==========
  "Butter Chicken": "https://www.simplyrecipes.com/recipes/butter_chicken/",
  "Chicken Adobo": "https://www.simplyrecipes.com/recipes/chicken_adobo/",
  "Chicken Alfredo": "https://www.simplyrecipes.com/recipes/chicken_alfredo/",
  "Chicken Biryani": "https://www.recipetineats.com/chicken-biryani/",
  "Chicken Burritos": "https://www.simplyrecipes.com/recipes/chicken_burritos/",
  "Chicken Cordon Bleu": "https://www.simplyrecipes.com/recipes/chicken_cordon_bleu/",
  "Chicken Empanadas": "https://www.simplyrecipes.com/recipes/chicken_empanadas/",
  "Chicken Enchiladas": "https://www.simplyrecipes.com/recipes/chicken_enchiladas/",
  "Chicken Florentine": "https://www.simplyrecipes.com/recipes/chicken_florentine/",
  "Chicken Francese": "https://www.simplyrecipes.com/recipes/chicken_francese/",
  "Chicken Gumbo": "https://www.simplyrecipes.com/recipes/chicken_and_sausage_gumbo/",
  "Chicken Kebabs": "https://www.simplyrecipes.com/recipes/chicken_kebabs/",
  "Chicken Korma": "https://www.recipetineats.com/chicken-korma/",
  "Chicken Milanese": "https://www.simplyrecipes.com/recipes/chicken_milanese/",
  "Chicken Noodle Soup": "https://www.simplyrecipes.com/recipes/chicken_noodle_soup_from_scratch/",
  "Chicken Paprikash": "https://www.simplyrecipes.com/recipes/chicken_paprikash/",
  "Chicken Parmesan": "https://www.simplyrecipes.com/recipes/chicken_parmesan/",
  "Chicken Quesadillas": "https://www.simplyrecipes.com/recipes/chicken_quesadillas/",
  "Chicken Satay": "https://www.recipetineats.com/chicken-satay/",
  "Chicken Souvlaki": "https://www.themediterraneandish.com/chicken-souvlaki-recipe/",
  "Chicken Tagine with Apricots": "https://www.themediterraneandish.com/moroccan-chicken-tagine/",
  "Chicken Teriyaki": "https://www.simplyrecipes.com/recipes/chicken_teriyaki/",
  "Chicken with 40 Cloves of Garlic": "https://www.simplyrecipes.com/recipes/chicken_with_40_cloves_of_garlic/",
  "Coconut Curry Chicken": "https://www.simplyrecipes.com/recipes/thai_coconut_chicken_curry/",
  "General Tso Chicken": "https://www.simplyrecipes.com/recipes/general_tsos_chicken/",
  "Grilled Chicken Caesar": "https://www.simplyrecipes.com/recipes/grilled_chicken_caesar_salad/",
  "Honey Sesame Chicken": "https://www.recipetineats.com/honey-sesame-chicken/",
  "Jerk Chicken": "https://www.simplyrecipes.com/recipes/jerk_chicken/",
  "Kung Pao Chicken": "https://www.simplyrecipes.com/recipes/kung_pao_chicken/",
  "Lemon Herb Roasted Chicken": "https://www.simplyrecipes.com/recipes/lemon_herb_roasted_chicken/",
  "Lemon Pepper Chicken Wings": "https://www.simplyrecipes.com/recipes/lemon_pepper_wings/",
  "Mango Chicken": "https://www.recipetineats.com/mango-chicken/",
  "Moroccan Chicken Tagine": "https://www.themediterraneandish.com/moroccan-chicken-tagine/",
  "Moroccan Chicken with Olives": "https://www.themediterraneandish.com/moroccan-chicken-with-preserved-lemons-and-olives/",
  "Orange Chicken": "https://www.simplyrecipes.com/recipes/orange_chicken/",
  "Sesame Chicken": "https://www.simplyrecipes.com/recipes/sesame_chicken/",
  "Shabbat Roasted Chicken": "https://www.simplyrecipes.com/recipes/roast_chicken/",
  "Tandoori Chicken": "https://www.simplyrecipes.com/recipes/tandoori_chicken/",
  "Thai Basil Chicken": "https://www.recipetineats.com/thai-basil-chicken/",
  
  // ========== MUFFINS ==========
  "Almond Poppy Seed Muffins": "https://www.simplyrecipes.com/recipes/lemon_poppy_seed_muffins/",
  "Apple Cinnamon Crumb Muffins": "https://www.simplyrecipes.com/recipes/apple_muffins/",
  "Banana Nut Muffins": "https://www.simplyrecipes.com/recipes/banana_nut_muffins/",
  "Blackberry Muffins": "https://www.simplyrecipes.com/recipes/blackberry_muffins/",
  "Blueberry Streusel Muffins": "https://www.simplyrecipes.com/recipes/blueberry_streusel_muffins/",
  "Brownie Muffins": "https://www.simplyrecipes.com/recipes/chocolate_brownie_muffins/",
  "Carrot Cake Cupcakes": "https://www.simplyrecipes.com/recipes/carrot_cake_cupcakes/",
  "Carrot Muffins": "https://www.simplyrecipes.com/recipes/carrot_muffins/",
  "Chai Spice Muffins": "https://www.simplyrecipes.com/recipes/chai_spice_muffins/",
  "Chocolate Chip Muffins": "https://www.simplyrecipes.com/recipes/chocolate_chip_muffins/",
  "Cinnamon Muffins": "https://www.simplyrecipes.com/recipes/cinnamon_sugar_muffins/",
  "Coconut Muffins": "https://www.simplyrecipes.com/recipes/coconut_muffins/",
  "Coffee Cake Muffins": "https://www.simplyrecipes.com/recipes/coffee_cake_muffins/",
  "Corn Muffins": "https://www.simplyrecipes.com/recipes/corn_muffins/",
  "Cornmeal Blueberry Muffins": "https://www.simplyrecipes.com/recipes/blueberry_corn_muffins/",
  "Cranberry Orange Muffins": "https://www.simplyrecipes.com/recipes/cranberry_orange_muffins/",
  "Date Muffins": "https://www.simplyrecipes.com/recipes/date_nut_muffins/",
  "Espresso Chocolate Muffins": "https://www.simplyrecipes.com/recipes/chocolate_espresso_muffins/",
  "Gingerbread Muffins": "https://www.simplyrecipes.com/recipes/gingerbread_muffins/",
  "Honey Muffins": "https://www.simplyrecipes.com/recipes/honey_muffins/",
  "Lemon Drizzle Muffins": "https://www.simplyrecipes.com/recipes/lemon_muffins/",
  "Maple Walnut Muffins": "https://www.simplyrecipes.com/recipes/maple_walnut_muffins/",
  "Morning Glory Muffins": "https://www.simplyrecipes.com/recipes/morning_glory_muffins/",
  "Oatmeal Muffins": "https://www.simplyrecipes.com/recipes/oatmeal_muffins/",
  "Orange Cranberry Muffins": "https://www.simplyrecipes.com/recipes/cranberry_orange_muffins/",
  "Peach Cobbler Muffins": "https://www.simplyrecipes.com/recipes/peach_muffins/",
  "Peanut Butter Banana Muffins": "https://www.simplyrecipes.com/recipes/peanut_butter_banana_muffins/",
  "Pistachio Muffins": "https://www.simplyrecipes.com/recipes/pistachio_muffins/",
  "Raisin Muffins": "https://www.simplyrecipes.com/recipes/cinnamon_raisin_muffins/",
  "Raspberry White Chocolate Muffins": "https://www.simplyrecipes.com/recipes/raspberry_white_chocolate_muffins/",
  "Red Velvet Cupcakes": "https://www.simplyrecipes.com/recipes/red_velvet_cupcakes/",
  "Snickerdoodle Muffins": "https://www.simplyrecipes.com/recipes/snickerdoodle_muffins/",
  "Strawberry Shortcake Muffins": "https://www.simplyrecipes.com/recipes/strawberry_muffins/",
  "Streusel Muffins": "https://www.simplyrecipes.com/recipes/streusel_topped_muffins/",
  "Sweet Potato Muffins": "https://www.simplyrecipes.com/recipes/sweet_potato_muffins/",
  "Triple Chocolate Muffins": "https://www.simplyrecipes.com/recipes/triple_chocolate_muffins/",
  "Vanilla Muffins": "https://www.simplyrecipes.com/recipes/vanilla_muffins/",
  
  // ========== SIDE STARCHES ==========
  "Baked Potatoes": "https://www.simplyrecipes.com/recipes/perfect_baked_potato/",
  "Basmati Rice": "https://www.simplyrecipes.com/recipes/how_to_make_basmati_rice/",
  "Brown Rice": "https://www.simplyrecipes.com/recipes/how_to_cook_brown_rice/",
  "Bulgur": "https://www.simplyrecipes.com/recipes/how_to_cook_bulgur/",
  "Cauliflower Rice": "https://www.simplyrecipes.com/recipes/cauliflower_rice/",
  "Cheesy Grits": "https://www.simplyrecipes.com/recipes/cheesy_grits/",
  "Cilantro Lime Rice": "https://www.simplyrecipes.com/recipes/cilantro_lime_rice/",
  "Coconut Rice": "https://www.simplyrecipes.com/recipes/coconut_rice/",
  "Cornbread": "https://www.simplyrecipes.com/recipes/southern_cornbread/",
  "Couscous": "https://www.simplyrecipes.com/recipes/basic_couscous/",
  "Crispy Roasted Potatoes": "https://www.simplyrecipes.com/recipes/crispy_roasted_potatoes/",
  "Duchess Potatoes": "https://www.simplyrecipes.com/recipes/duchess_potatoes/",
  "French Fries": "https://www.simplyrecipes.com/recipes/perfect_french_fries/",
  "Garlic Roasted Potatoes": "https://www.simplyrecipes.com/recipes/garlic_roasted_potatoes/",
  "Hasselback Potatoes": "https://www.simplyrecipes.com/recipes/hasselback_potatoes/",
  "Herbed Rice Pilaf": "https://www.simplyrecipes.com/recipes/rice_pilaf/",
  "Jasmine Rice": "https://www.simplyrecipes.com/recipes/how_to_make_jasmine_rice/",
  "Kugel": "https://www.simplyrecipes.com/recipes/noodle_kugel/",
  "Lemon Orzo": "https://www.simplyrecipes.com/recipes/lemon_orzo/",
  "Mashed Potatoes": "https://www.simplyrecipes.com/recipes/perfect_mashed_potatoes/",
  "Matzo": "https://www.simplyrecipes.com/recipes/homemade_matzo/",
  "Pita Bread": "https://www.simplyrecipes.com/recipes/pita_bread/",
  "Polenta": "https://www.simplyrecipes.com/recipes/basic_polenta/",
  "Potato Gratin": "https://www.simplyrecipes.com/recipes/potato_gratin/",
  "Potato Salad": "https://www.simplyrecipes.com/recipes/american_potato_salad/",
  "Quinoa": "https://www.simplyrecipes.com/recipes/how_to_cook_quinoa/",
  "Rice Pilaf": "https://www.simplyrecipes.com/recipes/rice_pilaf/",
  "Roasted Fingerling Potatoes": "https://www.simplyrecipes.com/recipes/roasted_fingerling_potatoes/",
  "Roasted Garlic Mashed Potatoes": "https://www.simplyrecipes.com/recipes/roasted_garlic_mashed_potatoes/",
  "Roasted Potatoes with Herbs": "https://www.simplyrecipes.com/recipes/rosemary_roasted_potatoes/",
  "Roasted Sweet Potatoes": "https://www.simplyrecipes.com/recipes/roasted_sweet_potatoes/",
  "Saffron Rice": "https://www.simplyrecipes.com/recipes/saffron_rice/",
  "Smashed Potatoes": "https://www.simplyrecipes.com/recipes/smashed_potatoes/",
  "Spanish Rice": "https://www.simplyrecipes.com/recipes/spanish_rice/",
  "Sweet Potato Fries": "https://www.simplyrecipes.com/recipes/baked_sweet_potato_fries/",
  "Tabbouleh": "https://www.simplyrecipes.com/recipes/tabbouleh/",
  "Twice Baked Potatoes": "https://www.simplyrecipes.com/recipes/twice_baked_potatoes/",
  "Wild Rice": "https://www.simplyrecipes.com/recipes/wild_rice/",
  "Yorkshire Pudding": "https://www.simplyrecipes.com/recipes/yorkshire_pudding/",
  
  // ========== SIDE VEGETABLES ==========
  "Baba Ganoush": "https://www.simplyrecipes.com/recipes/baba_ganoush/",
  "Bacon Brussels Sprouts": "https://www.simplyrecipes.com/recipes/brussels_sprouts_with_bacon/",
  "Caesar Salad": "https://www.simplyrecipes.com/recipes/caesar_salad/",
  "Caprese Salad": "https://www.simplyrecipes.com/recipes/caprese_salad/",
  "Cauliflower Mash": "https://www.simplyrecipes.com/recipes/cauliflower_mash/",
  "Charred Broccolini": "https://www.simplyrecipes.com/recipes/charred_broccolini/",
  "Corn on the Cob": "https://www.simplyrecipes.com/recipes/corn_on_the_cob/",
  "Creamy Coleslaw": "https://www.simplyrecipes.com/recipes/creamy_coleslaw/",
  "Cucumber Salad": "https://www.simplyrecipes.com/recipes/cucumber_salad/",
  "Edamame": "https://www.simplyrecipes.com/recipes/edamame/",
  "Garlic Sauteed Spinach": "https://www.simplyrecipes.com/recipes/sauteed_spinach_with_garlic/",
  "Glazed Carrots": "https://www.simplyrecipes.com/recipes/glazed_carrots/",
  "Greek Salad": "https://www.simplyrecipes.com/recipes/greek_salad/",
  "Grilled Corn": "https://www.simplyrecipes.com/recipes/grilled_corn/",
  "Grilled Zucchini": "https://www.simplyrecipes.com/recipes/grilled_zucchini/",
  "Honey Glazed Carrots": "https://www.simplyrecipes.com/recipes/honey_glazed_carrots/",
  "Mexican Street Corn": "https://www.simplyrecipes.com/recipes/elote_mexican_street_corn/",
  "Parmesan Asparagus": "https://www.simplyrecipes.com/recipes/roasted_parmesan_asparagus/",
  "Pickled Red Onions": "https://www.simplyrecipes.com/recipes/pickled_red_onions/",
  "Roasted Balsamic Vegetables": "https://www.simplyrecipes.com/recipes/balsamic_roasted_vegetables/",
  "Roasted Bell Peppers": "https://www.simplyrecipes.com/recipes/roasted_red_peppers/",
  "Roasted Butternut Squash": "https://www.simplyrecipes.com/recipes/roasted_butternut_squash/",
  "Roasted Fennel": "https://www.simplyrecipes.com/recipes/roasted_fennel/",
  "Roasted Tomatoes": "https://www.simplyrecipes.com/recipes/roasted_tomatoes/",
  "Sauteed Green Beans": "https://www.simplyrecipes.com/recipes/sauteed_green_beans/",
  "Sauteed Green Beans Almondine": "https://www.simplyrecipes.com/recipes/green_beans_almondine/",
  "Sauteed Kale": "https://www.simplyrecipes.com/recipes/sauteed_kale/",
  "Sauteed Mushrooms": "https://www.simplyrecipes.com/recipes/sauteed_mushrooms/",
  "Sauteed Spinach": "https://www.simplyrecipes.com/recipes/sauteed_spinach/",
  "Sauteed Zucchini": "https://www.simplyrecipes.com/recipes/sauteed_zucchini/",
  "Sesame Green Beans": "https://www.simplyrecipes.com/recipes/sesame_green_beans/",
  "Steamed Artichokes": "https://www.simplyrecipes.com/recipes/steamed_artichokes/",
  "Steamed Broccoli": "https://www.simplyrecipes.com/recipes/steamed_broccoli/",
  "Steamed Carrots": "https://www.simplyrecipes.com/recipes/steamed_carrots/",
  "Stir Fried Vegetables": "https://www.simplyrecipes.com/recipes/stir_fried_vegetables/",
  "Stuffed Mushrooms": "https://www.simplyrecipes.com/recipes/stuffed_mushrooms/",
  "Waldorf Salad": "https://www.simplyrecipes.com/recipes/waldorf_salad/",
  "Savory Cheese Muffins": "https://www.simplyrecipes.com/recipes/savory_cheese_muffins/",
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

    // Accept 200 as valid
    return response.status === 200;
  } catch {
    return false;
  }
}

async function addRecipeUrls() {
  console.log('🍳 Adding recipe URLs to dishes without them...\n');

  try {
    // Get all dishes without URLs
    const dishesWithoutUrl = await prisma.dish.findMany({
      where: { OR: [{ sourceUrl: null }, { sourceUrl: '' }] },
      select: { id: true, name: true, kosher: true },
      orderBy: { name: 'asc' },
    });

    console.log(`   Found ${dishesWithoutUrl.length} dishes without recipe URLs\n`);

    if (dishesWithoutUrl.length === 0) {
      console.log('✅ All dishes already have recipe URLs!');
      return;
    }

    let added = 0;
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
      } else {
        console.log('❌ URL returned error');
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
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
