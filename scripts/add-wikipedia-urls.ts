/**
 * Add Wikipedia URLs to dishes without recipe links
 * 
 * Wikipedia URLs are stable and provide informational content about each dish.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/add-wikipedia-urls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Wikipedia URL mapping - dish name to Wikipedia article
const wikipediaUrls: Record<string, string> = {
  // Muffins
  "Almond Poppy Seed Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Apple Cinnamon Crumb Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Brownie Muffins": "https://en.wikipedia.org/wiki/Chocolate_brownie",
  "Chai Spice Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Chocolate Chip Muffins": "https://en.wikipedia.org/wiki/Chocolate_chip",
  "Cinnamon Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Coffee Cake Muffins": "https://en.wikipedia.org/wiki/Coffee_cake",
  "Corn Muffins": "https://en.wikipedia.org/wiki/Corn_muffin",
  "Cornmeal Blueberry Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Cranberry Orange Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Date Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Espresso Chocolate Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Gingerbread Muffins": "https://en.wikipedia.org/wiki/Gingerbread",
  "Honey Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Lemon Drizzle Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Maple Walnut Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Oatmeal Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Orange Cranberry Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Peach Cobbler Muffins": "https://en.wikipedia.org/wiki/Cobbler_(food)",
  "Peanut Butter Banana Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Pistachio Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Raisin Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Raspberry White Chocolate Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Red Velvet Cupcakes": "https://en.wikipedia.org/wiki/Red_velvet_cake",
  "Snickerdoodle Muffins": "https://en.wikipedia.org/wiki/Snickerdoodle",
  "Streusel Muffins": "https://en.wikipedia.org/wiki/Streusel",
  "Sweet Potato Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Triple Chocolate Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Vanilla Muffins": "https://en.wikipedia.org/wiki/Muffin",
  "Savory Cheese Muffins": "https://en.wikipedia.org/wiki/Muffin",
  
  // Soups
  "Barley Soup": "https://en.wikipedia.org/wiki/Beef_barley_soup",
  "Beet Borscht": "https://en.wikipedia.org/wiki/Borscht",
  "Borscht": "https://en.wikipedia.org/wiki/Borscht",
  "Chicken Gnocchi Soup": "https://en.wikipedia.org/wiki/Gnocchi",
  "Chicken Noodle Soup": "https://en.wikipedia.org/wiki/Chicken_soup",
  "Clam Chowder": "https://en.wikipedia.org/wiki/Clam_chowder",
  "Classic Chicken Noodle Soup": "https://en.wikipedia.org/wiki/Chicken_soup",
  "Cream of Mushroom Soup": "https://en.wikipedia.org/wiki/Cream_of_mushroom_soup",
  "Laksa": "https://en.wikipedia.org/wiki/Laksa",
  "Lobster Bisque": "https://en.wikipedia.org/wiki/Bisque_(food)",
  "Mushroom Soup": "https://en.wikipedia.org/wiki/Cream_of_mushroom_soup",
  "Pozole": "https://en.wikipedia.org/wiki/Pozole",
  "Ramen": "https://en.wikipedia.org/wiki/Ramen",
  "Ribollita": "https://en.wikipedia.org/wiki/Ribollita",
  "Rice Soup": "https://en.wikipedia.org/wiki/Rice_soup",
  "Roasted Red Pepper Soup": "https://en.wikipedia.org/wiki/Bell_pepper",
  "Wonton Soup": "https://en.wikipedia.org/wiki/Wonton_soup",
  
  // Main Beef
  "Beef Barbacoa": "https://en.wikipedia.org/wiki/Barbacoa",
  "Beef Birria": "https://en.wikipedia.org/wiki/Birria",
  "Beef Burgers": "https://en.wikipedia.org/wiki/Hamburger",
  "Beef Carpaccio": "https://en.wikipedia.org/wiki/Carpaccio",
  "Beef Empanadas": "https://en.wikipedia.org/wiki/Empanada",
  "Beef Fajitas": "https://en.wikipedia.org/wiki/Fajita",
  "Beef Goulash": "https://en.wikipedia.org/wiki/Goulash",
  "Beef Gyros": "https://en.wikipedia.org/wiki/Gyro_(food)",
  "Beef Lo Mein": "https://en.wikipedia.org/wiki/Lo_mein",
  "Beef Massaman Curry": "https://en.wikipedia.org/wiki/Massaman_curry",
  "Beef Negimaki": "https://en.wikipedia.org/wiki/Negimaki",
  "Beef Pastrami": "https://en.wikipedia.org/wiki/Pastrami",
  "Beef Ragu": "https://en.wikipedia.org/wiki/Rag%C3%B9",
  "Beef Rogan Josh": "https://en.wikipedia.org/wiki/Rogan_josh",
  "Beef Shawarma": "https://en.wikipedia.org/wiki/Shawarma",
  "Beef Stir Fry": "https://en.wikipedia.org/wiki/Stir_frying",
  "Beef Tacos": "https://en.wikipedia.org/wiki/Taco",
  "Beef Teriyaki": "https://en.wikipedia.org/wiki/Teriyaki",
  "Beef Tongue": "https://en.wikipedia.org/wiki/Tongue_(foodstuff)",
  "Italian Beef Sandwich": "https://en.wikipedia.org/wiki/Italian_beef",
  "Mongolian Beef": "https://en.wikipedia.org/wiki/Mongolian_beef",
  "Philly Cheesesteak": "https://en.wikipedia.org/wiki/Cheesesteak",
  "Shepherd's Pie": "https://en.wikipedia.org/wiki/Shepherd%27s_pie",
  
  // Main Chicken
  "Chicken Biryani": "https://en.wikipedia.org/wiki/Biryani",
  "Chicken Burritos": "https://en.wikipedia.org/wiki/Burrito",
  "Chicken Empanadas": "https://en.wikipedia.org/wiki/Empanada",
  "Chicken Enchiladas": "https://en.wikipedia.org/wiki/Enchilada",
  "Chicken Florentine": "https://en.wikipedia.org/wiki/Florentine_(food)",
  "Chicken Gumbo": "https://en.wikipedia.org/wiki/Gumbo",
  "Chicken Kebabs": "https://en.wikipedia.org/wiki/Kebab",
  "Chicken Korma": "https://en.wikipedia.org/wiki/Korma",
  "Chicken Milanese": "https://en.wikipedia.org/wiki/Milanese_(dish)",
  "Chicken Quesadillas": "https://en.wikipedia.org/wiki/Quesadilla",
  "Chicken Souvlaki": "https://en.wikipedia.org/wiki/Souvlaki",
  "Chicken Tagine with Apricots": "https://en.wikipedia.org/wiki/Tagine",
  "Chicken Teriyaki": "https://en.wikipedia.org/wiki/Teriyaki",
  "Chicken with 40 Cloves of Garlic": "https://en.wikipedia.org/wiki/Chicken_with_forty_cloves_of_garlic",
  "Coconut Curry Chicken": "https://en.wikipedia.org/wiki/Curry",
  "General Tso Chicken": "https://en.wikipedia.org/wiki/General_Tso%27s_chicken",
  "Grilled Chicken Caesar": "https://en.wikipedia.org/wiki/Caesar_salad",
  "Honey Sesame Chicken": "https://en.wikipedia.org/wiki/Sesame_chicken",
  "Lemon Pepper Chicken Wings": "https://en.wikipedia.org/wiki/Buffalo_wing",
  "Mango Chicken": "https://en.wikipedia.org/wiki/Mango_chicken",
  "Moroccan Chicken Tagine": "https://en.wikipedia.org/wiki/Tagine",
  "Moroccan Chicken with Olives": "https://en.wikipedia.org/wiki/Tagine",
  "Orange Chicken": "https://en.wikipedia.org/wiki/Orange_chicken",
  "Sesame Chicken": "https://en.wikipedia.org/wiki/Sesame_chicken",
  "Shabbat Roasted Chicken": "https://en.wikipedia.org/wiki/Roast_chicken",
  
  // Side Starches
  "Baked Potatoes": "https://en.wikipedia.org/wiki/Baked_potato",
  "Basmati Rice": "https://en.wikipedia.org/wiki/Basmati",
  "Cauliflower Rice": "https://en.wikipedia.org/wiki/Cauliflower_rice",
  "Cheesy Grits": "https://en.wikipedia.org/wiki/Grits",
  "Couscous": "https://en.wikipedia.org/wiki/Couscous",
  "Crispy Roasted Potatoes": "https://en.wikipedia.org/wiki/Roast_potato",
  "French Fries": "https://en.wikipedia.org/wiki/French_fries",
  "Garlic Roasted Potatoes": "https://en.wikipedia.org/wiki/Roast_potato",
  "Hasselback Potatoes": "https://en.wikipedia.org/wiki/Hasselback_potatoes",
  "Jasmine Rice": "https://en.wikipedia.org/wiki/Jasmine_rice",
  "Kugel": "https://en.wikipedia.org/wiki/Kugel",
  "Lemon Orzo": "https://en.wikipedia.org/wiki/Orzo",
  "Matzo": "https://en.wikipedia.org/wiki/Matzo",
  "Pita Bread": "https://en.wikipedia.org/wiki/Pita",
  "Potato Salad": "https://en.wikipedia.org/wiki/Potato_salad",
  "Roasted Fingerling Potatoes": "https://en.wikipedia.org/wiki/Fingerling_potato",
  "Roasted Garlic Mashed Potatoes": "https://en.wikipedia.org/wiki/Mashed_potato",
  "Roasted Potatoes with Herbs": "https://en.wikipedia.org/wiki/Roast_potato",
  "Roasted Sweet Potatoes": "https://en.wikipedia.org/wiki/Sweet_potato",
  "Saffron Rice": "https://en.wikipedia.org/wiki/Saffron_rice",
  "Smashed Potatoes": "https://en.wikipedia.org/wiki/Mashed_potato",
  "Wild Rice": "https://en.wikipedia.org/wiki/Wild_rice",
  "Yorkshire Pudding": "https://en.wikipedia.org/wiki/Yorkshire_pudding",
  
  // Side Vegetables
  "Bacon Brussels Sprouts": "https://en.wikipedia.org/wiki/Brussels_sprout",
  "Cauliflower Mash": "https://en.wikipedia.org/wiki/Cauliflower",
  "Charred Broccolini": "https://en.wikipedia.org/wiki/Broccolini",
  "Corn on the Cob": "https://en.wikipedia.org/wiki/Corn_on_the_cob",
  "Creamy Coleslaw": "https://en.wikipedia.org/wiki/Coleslaw",
  "Edamame": "https://en.wikipedia.org/wiki/Edamame",
  "Garlic Sauteed Spinach": "https://en.wikipedia.org/wiki/Spinach",
  "Honey Glazed Carrots": "https://en.wikipedia.org/wiki/Glazed_carrots",
  "Mexican Street Corn": "https://en.wikipedia.org/wiki/Elote",
  "Parmesan Asparagus": "https://en.wikipedia.org/wiki/Asparagus",
  "Roasted Bell Peppers": "https://en.wikipedia.org/wiki/Bell_pepper",
  "Roasted Tomatoes": "https://en.wikipedia.org/wiki/Tomato",
  "Sauteed Green Beans Almondine": "https://en.wikipedia.org/wiki/Almandine_(cuisine)",
  "Sauteed Kale": "https://en.wikipedia.org/wiki/Kale",
  "Sauteed Mushrooms": "https://en.wikipedia.org/wiki/Mushroom",
  "Sauteed Spinach": "https://en.wikipedia.org/wiki/Spinach",
  "Sauteed Zucchini": "https://en.wikipedia.org/wiki/Zucchini",
  "Sesame Green Beans": "https://en.wikipedia.org/wiki/Green_bean",
  "Steamed Artichokes": "https://en.wikipedia.org/wiki/Artichoke",
  "Stir Fried Vegetables": "https://en.wikipedia.org/wiki/Stir_frying",
  "Waldorf Salad": "https://en.wikipedia.org/wiki/Waldorf_salad",
};

async function addWikipediaUrls() {
  console.log('📚 Adding Wikipedia URLs to dishes without recipe links...\n');

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
    let notMapped = 0;

    for (const dish of dishesWithoutUrl) {
      const url = wikipediaUrls[dish.name];
      
      if (!url) {
        console.log(`   ⚠️  No Wikipedia mapping for: ${dish.name}`);
        notMapped++;
        continue;
      }

      await prisma.dish.update({
        where: { id: dish.id },
        data: { sourceUrl: url },
      });
      console.log(`   ✅ Added: ${dish.name}`);
      added++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Added Wikipedia URLs: ${added}`);
    console.log(`   ⚠️  Not mapped: ${notMapped}`);

  } catch (error) {
    console.error('❌ Error adding URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
addWikipediaUrls()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
