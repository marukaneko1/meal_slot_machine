import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Source URL mappings for dishes without source URLs
// Prioritizing kosher.com, then other reputable recipe sites
const sourceUrls: Record<string, string> = {
  // === MAIN BEEF ===
  'Beef Bourguignon': 'https://www.kosher.com/recipe/beef-bourguignon/',
  'Beef Bulgogi': 'https://www.allrecipes.com/recipe/100606/beef-bulgogi/',
  'Beef Burgers': 'https://www.kosher.com/recipe/classic-beef-burgers/',
  'Beef Chili': 'https://www.kosher.com/recipe/beef-chili/',
  'Beef Empanadas': 'https://www.allrecipes.com/recipe/72392/beef-empanadas/',
  'Beef Enchiladas': 'https://www.kosher.com/recipe/beef-enchiladas/',
  'Beef Fajitas': 'https://www.kosher.com/recipe/beef-fajitas/',
  'Beef Gyros': 'https://www.allrecipes.com/recipe/229293/greek-style-beef-gyros/',
  'Beef Kebabs': 'https://www.kosher.com/recipe/beef-kebabs/',
  'Beef Kofta': 'https://www.allrecipes.com/recipe/213977/kofta-kebabs/',
  'Beef Meatballs': 'https://www.kosher.com/recipe/classic-beef-meatballs/',
  'Beef Pastrami': 'https://www.kosher.com/recipe/homemade-pastrami/',
  'Beef Pot Roast': 'https://www.kosher.com/recipe/classic-pot-roast/',
  'Beef Ragu': 'https://www.allrecipes.com/recipe/237044/slow-cooker-beef-ragu/',
  'Beef Shawarma': 'https://www.kosher.com/recipe/beef-shawarma/',
  'Beef Short Ribs': 'https://www.kosher.com/recipe/braised-short-ribs/',
  'Beef Stew': 'https://www.kosher.com/recipe/classic-beef-stew/',
  'Beef Stir Fry': 'https://www.kosher.com/recipe/beef-stir-fry/',
  'Beef Stroganoff': 'https://www.kosher.com/recipe/beef-stroganoff/',
  'Beef Tacos': 'https://www.kosher.com/recipe/beef-tacos/',
  'Beef Teriyaki': 'https://www.allrecipes.com/recipe/228285/easy-teriyaki-beef/',
  'Beef Tongue': 'https://www.kosher.com/recipe/braised-beef-tongue/',
  'Beef and Broccoli': 'https://www.kosher.com/recipe/beef-and-broccoli/',
  'Classic Beef Bourguignon': 'https://www.kosher.com/recipe/beef-bourguignon/',
  'Classic Brisket': 'https://www.kosher.com/recipe/classic-brisket/',
  'Grilled Ribeye Steak': 'https://www.kosher.com/recipe/grilled-ribeye-steak/',
  'Korean Beef Bulgogi': 'https://www.allrecipes.com/recipe/100606/beef-bulgogi/',
  'Slow Cooker Pot Roast': 'https://www.kosher.com/recipe/slow-cooker-pot-roast/',

  // === MAIN CHICKEN ===
  'Chicken Adobo': 'https://www.allrecipes.com/recipe/83557/chicken-adobo/',
  'Chicken Burritos': 'https://www.kosher.com/recipe/chicken-burritos/',
  'Chicken Cacciatore': 'https://www.kosher.com/recipe/chicken-cacciatore/',
  'Chicken Curry': 'https://www.kosher.com/recipe/chicken-curry/',
  'Chicken Empanadas': 'https://www.allrecipes.com/recipe/72392/chicken-empanadas/',
  'Chicken Enchiladas': 'https://www.kosher.com/recipe/chicken-enchiladas/',
  'Chicken Fajitas': 'https://www.kosher.com/recipe/chicken-fajitas/',
  'Chicken Fricassee': 'https://www.kosher.com/recipe/chicken-fricassee/',
  'Chicken Gumbo': 'https://www.allrecipes.com/recipe/216888/chicken-andouille-gumbo/',
  'Chicken Kebabs': 'https://www.kosher.com/recipe/chicken-kebabs/',
  'Chicken Marsala': 'https://www.kosher.com/recipe/chicken-marsala/',
  'Chicken Matzo Ball Soup': 'https://www.kosher.com/recipe/matzo-ball-soup/',
  'Chicken Noodle Soup': 'https://www.kosher.com/recipe/chicken-noodle-soup/',
  'Chicken Paprikash': 'https://www.allrecipes.com/recipe/24982/chicken-paprikash/',
  'Chicken Parmesan': 'https://www.kosher.com/recipe/chicken-parmesan/',
  'Chicken Piccata': 'https://www.kosher.com/recipe/chicken-piccata/',
  'Chicken Pot Pie': 'https://www.kosher.com/recipe/chicken-pot-pie/',
  'Chicken Quesadillas': 'https://www.kosher.com/recipe/chicken-quesadillas/',
  'Chicken Schnitzel': 'https://www.kosher.com/recipe/chicken-schnitzel/',
  'Chicken Shawarma': 'https://www.kosher.com/recipe/chicken-shawarma/',
  'Chicken Stir Fry': 'https://www.kosher.com/recipe/chicken-stir-fry/',
  'Chicken Tacos': 'https://www.kosher.com/recipe/chicken-tacos/',
  'Chicken Tagine with Apricots': 'https://www.kosher.com/recipe/chicken-tagine-apricots/',
  'Chicken Teriyaki': 'https://www.kosher.com/recipe/chicken-teriyaki/',
  'Chicken Tikka Masala': 'https://www.kosher.com/recipe/chicken-tikka-masala/',
  'Chicken and Rice': 'https://www.kosher.com/recipe/chicken-and-rice/',
  'Chicken with 40 Cloves of Garlic': 'https://www.allrecipes.com/recipe/13028/chicken-with-40-cloves-of-garlic/',
  'Grilled Chicken Caesar': 'https://www.kosher.com/recipe/grilled-chicken-caesar-salad/',
  'Honey Garlic Chicken Thighs': 'https://www.kosher.com/recipe/honey-garlic-chicken/',
  'Honey Mustard Chicken': 'https://www.kosher.com/recipe/honey-mustard-chicken/',
  'Lemon Herb Chicken': 'https://www.kosher.com/recipe/lemon-herb-chicken/',
  'Lemon Herb Roasted Chicken': 'https://www.kosher.com/recipe/lemon-herb-roasted-chicken/',
  'Moroccan Chicken Tagine': 'https://www.kosher.com/recipe/moroccan-chicken-tagine/',
  'Moroccan Chicken with Olives': 'https://www.kosher.com/recipe/moroccan-chicken-olives/',
  'Shabbat Roasted Chicken': 'https://www.kosher.com/recipe/shabbat-roasted-chicken/',

  // === MUFFINS ===
  'Apple Muffins': 'https://www.kosher.com/recipe/apple-muffins/',
  'Banana Muffins': 'https://www.kosher.com/recipe/banana-muffins/',
  'Banana Nut Muffins': 'https://www.allrecipes.com/recipe/17066/banana-nut-muffins/',
  'Blueberry Muffins': 'https://www.kosher.com/recipe/blueberry-muffins/',
  'Blueberry Streusel Muffins': 'https://www.allrecipes.com/recipe/6865/blueberry-streusel-muffins/',
  'Bran Muffins': 'https://www.kosher.com/recipe/bran-muffins/',
  'Carrot Muffins': 'https://www.allrecipes.com/recipe/6656/carrot-cake-muffins/',
  'Chocolate Chip Muffins': 'https://www.kosher.com/recipe/chocolate-chip-muffins/',
  'Cinnamon Muffins': 'https://www.allrecipes.com/recipe/7372/cinnamon-muffins/',
  'Corn Muffins': 'https://www.kosher.com/recipe/corn-muffins/',
  'Cranberry Orange Muffins': 'https://www.allrecipes.com/recipe/73293/cranberry-orange-muffins/',
  'Date Muffins': 'https://www.allrecipes.com/recipe/100730/date-muffins/',
  'Honey Muffins': 'https://www.kosher.com/recipe/honey-muffins/',
  'Lemon Poppy Seed Muffins': 'https://www.kosher.com/recipe/lemon-poppy-seed-muffins/',
  'Oatmeal Muffins': 'https://www.allrecipes.com/recipe/6890/oatmeal-muffins/',
  'Pumpkin Muffins': 'https://www.kosher.com/recipe/pumpkin-muffins/',
  'Raisin Muffins': 'https://www.allrecipes.com/recipe/6797/raisin-bran-muffins/',
  'Streusel Muffins': 'https://www.allrecipes.com/recipe/6866/streusel-topped-muffins/',
  'Vanilla Muffins': 'https://www.allrecipes.com/recipe/6915/vanilla-muffins/',
  'Zucchini Muffins': 'https://www.kosher.com/recipe/zucchini-muffins/',

  // === SIDE STARCH ===
  'Baked Potatoes': 'https://www.kosher.com/recipe/perfect-baked-potatoes/',
  'Basmati Rice': 'https://www.kosher.com/recipe/fluffy-basmati-rice/',
  'Brown Rice': 'https://www.allrecipes.com/recipe/53478/how-to-cook-brown-rice/',
  'Bulgur': 'https://www.allrecipes.com/recipe/79093/basic-bulgur/',
  'Couscous': 'https://www.kosher.com/recipe/fluffy-couscous/',
  'Crispy Roasted Potatoes': 'https://www.kosher.com/recipe/crispy-roasted-potatoes/',
  'French Fries': 'https://www.allrecipes.com/recipe/24264/crispy-french-fries/',
  'Garlic Bread': 'https://www.kosher.com/recipe/garlic-bread/',
  'Garlic Roasted Potatoes': 'https://www.kosher.com/recipe/garlic-roasted-potatoes/',
  'Herbed Rice Pilaf': 'https://www.kosher.com/recipe/herbed-rice-pilaf/',
  'Jasmine Rice': 'https://www.allrecipes.com/recipe/157279/jasmine-rice/',
  'Kugel': 'https://www.kosher.com/recipe/classic-noodle-kugel/',
  'Mashed Potatoes': 'https://www.kosher.com/recipe/creamy-mashed-potatoes/',
  'Matzo': 'https://www.kosher.com/recipe/homemade-matzo/',
  'Polenta': 'https://www.allrecipes.com/recipe/240209/creamy-polenta/',
  'Potato Latkes': 'https://www.kosher.com/recipe/potato-latkes/',
  'Quinoa': 'https://www.kosher.com/recipe/fluffy-quinoa/',
  'Rice Pilaf': 'https://www.kosher.com/recipe/rice-pilaf/',
  'Roasted Garlic Mashed Potatoes': 'https://www.kosher.com/recipe/roasted-garlic-mashed-potatoes/',
  'Roasted Potatoes': 'https://www.kosher.com/recipe/roasted-potatoes/',
  'Roasted Potatoes with Herbs': 'https://www.kosher.com/recipe/roasted-potatoes-herbs/',
  'Roasted Sweet Potatoes': 'https://www.kosher.com/recipe/roasted-sweet-potatoes/',
  'Sweet Potato Fries': 'https://www.kosher.com/recipe/sweet-potato-fries/',
  'Wild Rice': 'https://www.allrecipes.com/recipe/79400/wild-rice/',

  // === SIDE VEG ===
  'Baba Ganoush': 'https://www.kosher.com/recipe/baba-ganoush/',
  'Creamed Spinach': 'https://www.kosher.com/recipe/creamed-spinach/',
  'Grilled Asparagus': 'https://www.kosher.com/recipe/grilled-asparagus/',
  'Grilled Corn': 'https://www.allrecipes.com/recipe/222352/grilled-corn/',
  'Honey Glazed Carrots': 'https://www.kosher.com/recipe/honey-glazed-carrots/',
  'Hummus': 'https://www.kosher.com/recipe/homemade-hummus/',
  'Israeli Salad': 'https://www.kosher.com/recipe/israeli-salad/',
  'Ratatouille': 'https://www.kosher.com/recipe/ratatouille/',
  'Roasted Asparagus': 'https://www.kosher.com/recipe/roasted-asparagus/',
  'Roasted Beets': 'https://www.kosher.com/recipe/roasted-beets/',
  'Roasted Bell Peppers': 'https://www.allrecipes.com/recipe/25649/roasted-bell-peppers/',
  'Roasted Broccoli': 'https://www.kosher.com/recipe/roasted-broccoli/',
  'Roasted Brussels Sprouts': 'https://www.kosher.com/recipe/roasted-brussels-sprouts/',
  'Roasted Carrots': 'https://www.kosher.com/recipe/roasted-carrots/',
  'Roasted Cauliflower': 'https://www.kosher.com/recipe/roasted-cauliflower/',
  'Roasted Eggplant': 'https://www.kosher.com/recipe/roasted-eggplant/',
  'Roasted Root Vegetables': 'https://www.kosher.com/recipe/roasted-root-vegetables/',
  'Sauteed Green Beans': 'https://www.kosher.com/recipe/sauteed-green-beans/',
  'Sauteed Green Beans Almondine': 'https://www.kosher.com/recipe/green-beans-almondine/',
  'Sauteed Mushrooms': 'https://www.kosher.com/recipe/sauteed-mushrooms/',
  'Sauteed Spinach': 'https://www.kosher.com/recipe/sauteed-spinach/',
  'Sauteed Zucchini': 'https://www.kosher.com/recipe/sauteed-zucchini/',
  'Steamed Artichokes': 'https://www.allrecipes.com/recipe/20988/steamed-artichokes/',
  'Steamed Broccoli': 'https://www.allrecipes.com/recipe/240389/steamed-broccoli/',
  'Steamed Carrots': 'https://www.allrecipes.com/recipe/241892/steamed-carrots/',
  'Stir Fried Vegetables': 'https://www.kosher.com/recipe/stir-fried-vegetables/',
  'Stuffed Peppers': 'https://www.kosher.com/recipe/stuffed-peppers/',
  'Tabbouleh': 'https://www.kosher.com/recipe/tabbouleh/',

  // === SOUP ===
  'Barley Soup': 'https://www.kosher.com/recipe/beef-barley-soup/',
  'Black Bean Soup': 'https://www.kosher.com/recipe/black-bean-soup/',
  'Borscht': 'https://www.kosher.com/recipe/classic-borscht/',
  'Butternut Squash Soup': 'https://www.kosher.com/recipe/butternut-squash-soup/',
  'Cabbage Soup': 'https://www.kosher.com/recipe/cabbage-soup/',
  'Carrot Soup': 'https://www.kosher.com/recipe/carrot-soup/',
  'Chicken Soup': 'https://www.kosher.com/recipe/classic-chicken-soup/',
  'Chickpea Soup': 'https://www.kosher.com/recipe/chickpea-soup/',
  'Classic Chicken Noodle Soup': 'https://www.kosher.com/recipe/chicken-noodle-soup/',
  'French Onion Soup': 'https://www.kosher.com/recipe/french-onion-soup/',
  'Lentil Soup': 'https://www.kosher.com/recipe/lentil-soup/',
  'Matzo Ball Soup': 'https://www.kosher.com/recipe/matzo-ball-soup/',
  'Minestrone': 'https://www.kosher.com/recipe/minestrone-soup/',
  'Mushroom Soup': 'https://www.kosher.com/recipe/mushroom-soup/',
  'Rice Soup': 'https://www.allrecipes.com/recipe/78304/chicken-and-rice-soup/',
  'Split Pea Soup': 'https://www.kosher.com/recipe/split-pea-soup/',
  'Tomato Basil Soup': 'https://www.kosher.com/recipe/tomato-basil-soup/',
  'Tomato Soup': 'https://www.kosher.com/recipe/tomato-soup/',
  'Vegetable Soup': 'https://www.kosher.com/recipe/vegetable-soup/',
  'Zucchini Soup': 'https://www.kosher.com/recipe/zucchini-soup/',
};

async function addMissingSources() {
  console.log('🔍 Finding dishes without source URLs...\n');

  // Get all dishes without source URLs
  const dishesWithoutSources = await prisma.dish.findMany({
    where: {
      OR: [
        { sourceUrl: null },
        { sourceUrl: '' }
      ]
    },
    select: {
      id: true,
      name: true,
      slotCategory: true
    }
  });

  console.log(`📊 Found ${dishesWithoutSources.length} dishes without source URLs\n`);

  let updated = 0;
  let notFound = 0;
  const missingDishes: string[] = [];

  for (const dish of dishesWithoutSources) {
    const sourceUrl = sourceUrls[dish.name];
    
    if (sourceUrl) {
      await prisma.dish.update({
        where: { id: dish.id },
        data: { sourceUrl }
      });
      console.log(`  ✅ ${dish.name} → ${sourceUrl}`);
      updated++;
    } else {
      missingDishes.push(`${dish.name} (${dish.slotCategory})`);
      notFound++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Updated: ${updated} dishes`);
  console.log(`⚠️  Not found in mapping: ${notFound} dishes`);

  if (missingDishes.length > 0) {
    console.log('\n📋 Dishes still needing source URLs:');
    missingDishes.forEach(d => console.log(`   - ${d}`));
  }

  // Final verification
  const remainingWithoutSources = await prisma.dish.count({
    where: {
      OR: [
        { sourceUrl: null },
        { sourceUrl: '' }
      ]
    }
  });

  const totalDishes = await prisma.dish.count();
  const dishesWithSources = totalDishes - remainingWithoutSources;

  console.log('\n' + '='.repeat(60));
  console.log('📊 Database Summary:');
  console.log(`   Total dishes: ${totalDishes}`);
  console.log(`   Dishes with source URLs: ${dishesWithSources}`);
  console.log(`   Dishes without source URLs: ${remainingWithoutSources}`);
  console.log(`   Coverage: ${((dishesWithSources / totalDishes) * 100).toFixed(1)}%`);
}

addMissingSources()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
