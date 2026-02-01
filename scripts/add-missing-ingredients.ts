import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ingredient mappings based on dish names
// This includes typical ingredients for each dish
const dishIngredients: Record<string, string[]> = {
  // === MAIN BEEF ===
  'Beer Barbecue Meatballs Slow Cooker': ['ground beef', 'bread crumbs', 'egg', 'onion', 'garlic', 'beer', 'barbecue sauce', 'brown sugar', 'worcestershire sauce', 'salt', 'pepper'],
  'Easy Shortcut Mongolian Beef And Noodles': ['beef flank steak', 'vegetable oil', 'garlic', 'ginger', 'soy sauce', 'brown sugar', 'water', 'green onion', 'rice noodles', 'sesame seeds'],
  'Ground Beef And Broccoli': ['ground beef', 'broccoli', 'garlic', 'ginger', 'soy sauce', 'sesame oil', 'brown sugar', 'cornstarch', 'vegetable oil', 'rice'],
  'Healthier Pepper Steak': ['beef sirloin', 'bell pepper', 'onion', 'garlic', 'soy sauce', 'beef broth', 'cornstarch', 'black pepper', 'vegetable oil', 'rice'],
  'Lazy Mans Cholent': ['beef brisket', 'potatoes', 'barley', 'beans', 'onion', 'garlic', 'paprika', 'salt', 'pepper', 'water'],
  'One Pot Creamy Pasta And Meat Sauce Dairy Free': ['ground beef', 'pasta', 'onion', 'garlic', 'tomato sauce', 'coconut cream', 'italian seasoning', 'salt', 'pepper', 'olive oil', 'parsley'],
  'Pot Roast': ['beef chuck roast', 'potatoes', 'carrots', 'onion', 'celery', 'beef broth', 'tomato paste', 'garlic', 'thyme', 'rosemary', 'salt', 'pepper'],
  'Steamed And Fried Lamb Dumplings': ['ground lamb', 'flour', 'water', 'ginger', 'garlic', 'green onion', 'soy sauce', 'sesame oil', 'salt', 'vegetable oil'],

  // === MAIN CHICKEN ===
  'Aromatic Chicken In Wine Sauce': ['chicken thighs', 'white wine', 'garlic', 'onion', 'chicken broth', 'thyme', 'rosemary', 'butter', 'olive oil', 'salt', 'pepper', 'parsley'],
  'Babka Knots With Coffee Glaze': ['flour', 'yeast', 'sugar', 'eggs', 'butter', 'milk', 'chocolate', 'instant coffee', 'powdered sugar', 'vanilla'],
  'Baby Tomatoes On The Vine': ['cherry tomatoes', 'olive oil', 'garlic', 'salt', 'pepper', 'fresh basil', 'balsamic vinegar'],
  'Blooming Onion': ['large onion', 'flour', 'paprika', 'garlic powder', 'cayenne pepper', 'egg', 'milk', 'vegetable oil', 'salt'],
  'Brown Sugar Masala Chai Latte': ['black tea', 'milk', 'brown sugar', 'cinnamon', 'cardamom', 'ginger', 'cloves', 'black pepper', 'vanilla'],
  'Chamud': ['cabbage', 'beets', 'water', 'salt', 'garlic', 'chili pepper'],
  'Chicken And Ramen Noodles': ['chicken breast', 'ramen noodles', 'chicken broth', 'soy sauce', 'sesame oil', 'garlic', 'ginger', 'green onion', 'soft boiled egg', 'nori'],
  'Chicken Charred Pepper Roll': ['chicken breast', 'bell peppers', 'onion', 'garlic', 'olive oil', 'paprika', 'cumin', 'salt', 'pepper', 'fresh herbs'],
  'Crispy Vegetarian Tacos': ['corn tortillas', 'black beans', 'corn', 'bell pepper', 'onion', 'cumin', 'chili powder', 'lettuce', 'tomato', 'sour cream', 'cheese', 'cilantro'],
  'Dark Hot Cocoa': ['cocoa powder', 'dark chocolate', 'milk', 'sugar', 'vanilla', 'salt', 'whipped cream'],
  'Easy Herby Chicken And Rice': ['chicken thighs', 'rice', 'chicken broth', 'garlic', 'onion', 'thyme', 'rosemary', 'parsley', 'olive oil', 'salt', 'pepper'],
  'Easy Shakshuka': ['eggs', 'tomatoes', 'onion', 'bell pepper', 'garlic', 'cumin', 'paprika', 'cayenne', 'olive oil', 'feta cheese', 'parsley'],
  'Family Favorite Chicken Nuggets With Sweet And Sour Dipping Sauce': ['chicken breast', 'bread crumbs', 'flour', 'egg', 'garlic powder', 'paprika', 'salt', 'ketchup', 'honey', 'soy sauce', 'vinegar'],
  'Greek Salmon Dinner': ['salmon fillet', 'lemon', 'olive oil', 'garlic', 'oregano', 'cherry tomatoes', 'cucumber', 'red onion', 'kalamata olives', 'feta cheese', 'dill'],
  'Hazelnut Mocha': ['espresso', 'chocolate syrup', 'hazelnut syrup', 'milk', 'whipped cream', 'hazelnuts'],
  'Lecso Chicken On The Bone Slow Cooker': ['chicken pieces', 'bell peppers', 'tomatoes', 'onion', 'garlic', 'paprika', 'salt', 'pepper', 'vegetable oil'],
  'Lemon Blueberry Buns': ['flour', 'yeast', 'sugar', 'butter', 'milk', 'egg', 'lemon zest', 'blueberries', 'powdered sugar', 'lemon juice'],
  'Mocha Citrus Dream Bars': ['flour', 'butter', 'sugar', 'cocoa powder', 'espresso powder', 'orange zest', 'eggs', 'chocolate chips', 'powdered sugar'],
  'One Pot Tofu Lo Mein': ['tofu', 'lo mein noodles', 'soy sauce', 'sesame oil', 'garlic', 'ginger', 'cabbage', 'carrots', 'bell pepper', 'green onion'],
  'Quick And Easy Mushroom Quiche': ['pie crust', 'mushrooms', 'eggs', 'cream', 'cheese', 'onion', 'garlic', 'thyme', 'salt', 'pepper'],
  'Roasted Herbed Balsamic Chicken Thighs': ['chicken thighs', 'balsamic vinegar', 'olive oil', 'garlic', 'rosemary', 'thyme', 'honey', 'salt', 'pepper'],
  'Spicy Sweet Party Nuts': ['mixed nuts', 'butter', 'brown sugar', 'cayenne pepper', 'cumin', 'salt', 'rosemary'],
  'Sticky Chicken Stir Fry With Sweet Potato': ['chicken breast', 'sweet potato', 'soy sauce', 'honey', 'garlic', 'ginger', 'sesame oil', 'vegetable oil', 'green onion', 'sesame seeds'],
  'Super Easy Copycat Fruit Riot': ['mixed frozen fruit', 'orange juice', 'vanilla ice cream', 'honey', 'yogurt'],
  'Turmeric Latte': ['milk', 'turmeric', 'ginger', 'cinnamon', 'black pepper', 'honey', 'coconut oil'],
  'Vegetarian Sausage Hash Browns And Eggs On A Sheet Pan': ['vegetarian sausage', 'frozen hash browns', 'eggs', 'bell pepper', 'onion', 'olive oil', 'paprika', 'salt', 'pepper', 'parsley'],
  'Warm Cinnamon Milk': ['milk', 'cinnamon', 'honey', 'vanilla', 'nutmeg'],
  'Whole Chicken And Stuffing Slow Cooker': ['whole chicken', 'bread stuffing mix', 'celery', 'onion', 'butter', 'chicken broth', 'sage', 'thyme', 'salt', 'pepper'],

  // === MUFFINS/DESSERTS ===
  'Amaretto Hot Chocolate': ['milk', 'cocoa powder', 'sugar', 'amaretto', 'whipped cream', 'chocolate shavings', 'vanilla'],
  'Best Honey Cake Mix Hack': ['yellow cake mix', 'honey', 'eggs', 'vegetable oil', 'cinnamon', 'instant coffee', 'orange juice'],
  'Blueberry Lemon Crumbles': ['blueberries', 'flour', 'butter', 'sugar', 'lemon zest', 'lemon juice', 'oats', 'brown sugar', 'vanilla'],
  'Cappuccino Cupcakes': ['flour', 'sugar', 'eggs', 'butter', 'espresso', 'milk', 'baking powder', 'vanilla', 'cream cheese', 'powdered sugar'],
  'Caramel Apple Crinkle Pie': ['pie crust', 'apples', 'sugar', 'flour', 'cinnamon', 'butter', 'caramel sauce', 'oats', 'brown sugar'],
  'Cheese Krispie Kugel 2 Ways': ['egg noodles', 'cream cheese', 'sour cream', 'cottage cheese', 'eggs', 'sugar', 'vanilla', 'butter', 'corn flakes'],
  'Chewy Oatmeal Breakfast Cookies': ['oats', 'flour', 'butter', 'brown sugar', 'honey', 'egg', 'cinnamon', 'vanilla', 'raisins', 'walnuts'],
  'Chocolate Nougat Pots De Creme': ['dark chocolate', 'heavy cream', 'egg yolks', 'sugar', 'vanilla', 'nougat', 'salt'],
  'Crowned Chocolate Cake': ['flour', 'sugar', 'cocoa powder', 'eggs', 'butter', 'milk', 'baking powder', 'vanilla', 'chocolate ganache'],
  'Delicious Chocolate Breakfast Cookies': ['oats', 'flour', 'cocoa powder', 'butter', 'brown sugar', 'honey', 'egg', 'vanilla', 'chocolate chips', 'banana'],
  'Easy Chicken Pot Pie': ['chicken breast', 'pie crust', 'frozen mixed vegetables', 'cream of chicken soup', 'milk', 'butter', 'salt', 'pepper'],
  'Fiery Chocolate Chai Cocktail': ['chocolate liqueur', 'chai tea', 'vodka', 'cream', 'cayenne pepper', 'cinnamon'],
  'Fruity Cake With Crumbly Topping Recipe': ['flour', 'sugar', 'butter', 'eggs', 'milk', 'mixed fruit', 'baking powder', 'brown sugar', 'cinnamon'],
  'Irresistible Chocolate Pecan Bars': ['flour', 'butter', 'brown sugar', 'eggs', 'chocolate chips', 'pecans', 'corn syrup', 'vanilla', 'salt'],
  'Onion Leek Tart': ['pie crust', 'onions', 'leeks', 'butter', 'eggs', 'cream', 'gruyere cheese', 'thyme', 'salt', 'pepper', 'nutmeg'],
  'Pistachio Mango Tart': ['pie crust', 'pistachios', 'mango', 'sugar', 'butter', 'cream cheese', 'vanilla', 'powdered sugar'],
  'Sticky Toffee Pudding Loaf With Caramel Sauce': ['dates', 'flour', 'butter', 'brown sugar', 'eggs', 'baking soda', 'vanilla', 'heavy cream', 'salt'],
  'Tahini Hot Chocolate': ['milk', 'cocoa powder', 'tahini', 'honey', 'vanilla', 'salt', 'cinnamon'],
  'The Perfect Chocolate Chip Cookie Recipe': ['flour', 'butter', 'brown sugar', 'sugar', 'eggs', 'vanilla', 'baking soda', 'salt', 'chocolate chips'],

  // === SIDE STARCH ===
  'Caramelized Tahini Butter Sweet Potatoes': ['sweet potatoes', 'tahini', 'butter', 'honey', 'cinnamon', 'salt', 'sesame seeds'],
  'Creamy Tomato And Spinach Orzotto': ['orzo', 'tomatoes', 'spinach', 'vegetable broth', 'cream', 'parmesan cheese', 'garlic', 'onion', 'olive oil', 'basil'],
  'Crispy Red Potato Halves': ['red potatoes', 'olive oil', 'garlic powder', 'paprika', 'rosemary', 'salt', 'pepper', 'parsley'],
  'Fried Rice': ['rice', 'eggs', 'carrots', 'peas', 'green onion', 'soy sauce', 'sesame oil', 'garlic', 'vegetable oil'],
  'Garlic Dill Potatoes': ['potatoes', 'butter', 'garlic', 'fresh dill', 'salt', 'pepper', 'olive oil'],
  'Gluten Free Fresh Pasta With Pesto And Parmesan': ['gluten-free flour', 'eggs', 'basil', 'pine nuts', 'parmesan cheese', 'garlic', 'olive oil', 'salt'],
  'Gourmet Orzo Salad': ['orzo', 'cherry tomatoes', 'cucumber', 'red onion', 'feta cheese', 'kalamata olives', 'olive oil', 'lemon juice', 'oregano', 'parsley'],
  'Hearts Of Palm Rice Fritters': ['hearts of palm', 'rice', 'eggs', 'flour', 'green onion', 'garlic', 'cumin', 'salt', 'vegetable oil'],
  'Restaurant Pasta Made Easy': ['pasta', 'garlic', 'olive oil', 'parmesan cheese', 'pasta water', 'parsley', 'red pepper flakes', 'salt', 'pepper'],
  'Rice Pilaf With Melted Leeks': ['rice', 'leeks', 'butter', 'chicken broth', 'thyme', 'bay leaf', 'salt', 'pepper'],
  'Spicy Sweet Potato Fries': ['sweet potatoes', 'olive oil', 'paprika', 'cayenne pepper', 'garlic powder', 'brown sugar', 'salt'],

  // === SIDE VEG ===
  'Cabbage Pastrami Crunch Salad Recipe': ['cabbage', 'pastrami', 'carrot', 'mayonnaise', 'mustard', 'apple cider vinegar', 'sugar', 'salt', 'pepper'],
  'California Cobb Salad With Honey Mustard Dressing': ['romaine lettuce', 'chicken breast', 'bacon', 'avocado', 'tomato', 'hard-boiled eggs', 'blue cheese', 'honey', 'mustard', 'olive oil', 'vinegar'],
  'Cauliflower And Leek Souffle': ['cauliflower', 'leeks', 'eggs', 'butter', 'flour', 'milk', 'gruyere cheese', 'nutmeg', 'salt', 'pepper'],
  'Greek Eggplant Gnocchi': ['eggplant', 'potatoes', 'flour', 'egg', 'feta cheese', 'tomato sauce', 'garlic', 'oregano', 'olive oil', 'parsley'],
  'Rories Easy Ratatouille': ['eggplant', 'zucchini', 'yellow squash', 'bell pepper', 'tomatoes', 'onion', 'garlic', 'olive oil', 'herbs de provence', 'basil'],

  // === SOUPS ===
  'Celery Carrot Barley Soup': ['celery', 'carrots', 'barley', 'onion', 'garlic', 'vegetable broth', 'thyme', 'bay leaf', 'salt', 'pepper', 'parsley'],
  'Chickpea Stew': ['chickpeas', 'tomatoes', 'onion', 'garlic', 'cumin', 'paprika', 'turmeric', 'vegetable broth', 'olive oil', 'lemon juice', 'parsley'],
  'Cozy Vegetable Soup': ['carrots', 'celery', 'onion', 'potatoes', 'green beans', 'tomatoes', 'vegetable broth', 'garlic', 'thyme', 'bay leaf', 'parsley'],
  'Creamy Chicken Vegetable Barley Soup': ['chicken breast', 'barley', 'carrots', 'celery', 'onion', 'chicken broth', 'cream', 'garlic', 'thyme', 'salt', 'pepper'],
  'Crockpot Onion And Flanken Soup': ['flanken', 'onions', 'beef broth', 'garlic', 'thyme', 'bay leaf', 'salt', 'pepper'],
  'Dairy Carrot Soup': ['carrots', 'onion', 'garlic', 'vegetable broth', 'heavy cream', 'butter', 'ginger', 'nutmeg', 'salt', 'pepper'],
  'Fat Free Chicken Lemon Soup': ['chicken breast', 'chicken broth', 'lemon juice', 'lemon zest', 'rice', 'eggs', 'onion', 'celery', 'dill', 'salt'],
  'Grandmothers Hamburger Soup': ['ground beef', 'potatoes', 'carrots', 'celery', 'onion', 'tomatoes', 'beef broth', 'green beans', 'garlic', 'bay leaf', 'salt', 'pepper'],
  'Hearty Golden Chicken Soup': ['chicken pieces', 'carrots', 'celery', 'onion', 'parsnip', 'dill', 'parsley', 'garlic', 'turmeric', 'salt', 'pepper', 'water'],
  'Hearty Roasted Vegetable Soup': ['butternut squash', 'carrots', 'parsnips', 'onion', 'garlic', 'vegetable broth', 'olive oil', 'thyme', 'rosemary', 'salt', 'pepper'],
  'Pareve Bean And Vegetable Stew': ['white beans', 'carrots', 'celery', 'onion', 'tomatoes', 'vegetable broth', 'garlic', 'rosemary', 'thyme', 'kale', 'olive oil'],
  'The Best Ever Beef Split Pea Soup': ['beef bones', 'split peas', 'carrots', 'celery', 'onion', 'garlic', 'bay leaf', 'thyme', 'salt', 'pepper', 'water'],
  'Veggie Lentil Soup': ['lentils', 'carrots', 'celery', 'onion', 'tomatoes', 'vegetable broth', 'garlic', 'cumin', 'turmeric', 'spinach', 'lemon juice'],
  'White Velvet Garden Soup': ['cauliflower', 'potatoes', 'leeks', 'vegetable broth', 'cream', 'butter', 'garlic', 'thyme', 'salt', 'white pepper'],
};

async function getOrCreateIngredient(name: string): Promise<string> {
  const normalizedName = name.toLowerCase().trim();
  
  let ingredient = await prisma.ingredient.findUnique({
    where: { name: normalizedName }
  });

  if (!ingredient) {
    ingredient = await prisma.ingredient.create({
      data: { name: normalizedName }
    });
  }

  return ingredient.id;
}

async function addMissingIngredients() {
  console.log('🔍 Finding dishes without ingredients...\n');

  // Get all dishes without ingredients
  const dishes = await prisma.dish.findMany({
    include: {
      ingredients: true
    }
  });

  const dishesWithoutIngredients = dishes.filter(d => d.ingredients.length === 0);

  console.log(`📊 Found ${dishesWithoutIngredients.length} dishes without ingredients\n`);

  let updated = 0;
  let notFound = 0;
  const missingDishes: string[] = [];

  for (const dish of dishesWithoutIngredients) {
    const ingredients = dishIngredients[dish.name];
    
    if (ingredients && ingredients.length > 0) {
      console.log(`  📝 Adding ingredients to: ${dish.name}`);
      
      for (const ingredientName of ingredients) {
        const ingredientId = await getOrCreateIngredient(ingredientName);
        
        // Check if relation already exists
        const existing = await prisma.dishIngredient.findFirst({
          where: {
            dishId: dish.id,
            ingredientId: ingredientId
          }
        });

        if (!existing) {
          await prisma.dishIngredient.create({
            data: {
              dishId: dish.id,
              ingredientId: ingredientId
            }
          });
        }
      }
      
      console.log(`     ✅ Added ${ingredients.length} ingredients`);
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
    console.log('\n📋 Dishes still needing ingredients (will add generic):');
    missingDishes.forEach(d => console.log(`   - ${d}`));
    
    // Add generic ingredients for unmapped dishes based on category
    console.log('\n🔧 Adding generic ingredients for unmapped dishes...');
    
    for (const dish of dishesWithoutIngredients) {
      if (!dishIngredients[dish.name]) {
        const genericIngredients = getGenericIngredients(dish.slotCategory, dish.name);
        
        for (const ingredientName of genericIngredients) {
          const ingredientId = await getOrCreateIngredient(ingredientName);
          
          const existing = await prisma.dishIngredient.findFirst({
            where: {
              dishId: dish.id,
              ingredientId: ingredientId
            }
          });

          if (!existing) {
            await prisma.dishIngredient.create({
              data: {
                dishId: dish.id,
                ingredientId: ingredientId
              }
            });
          }
        }
        
        console.log(`  ✅ ${dish.name}: Added ${genericIngredients.length} generic ingredients`);
      }
    }
  }

  // Final verification
  const stillMissingIngredients = await prisma.dish.findMany({
    include: { ingredients: true }
  });
  
  const remaining = stillMissingIngredients.filter(d => d.ingredients.length === 0);
  const totalDishes = await prisma.dish.count();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Database Summary:');
  console.log(`   Total dishes: ${totalDishes}`);
  console.log(`   Dishes with ingredients: ${totalDishes - remaining.length}`);
  console.log(`   Dishes without ingredients: ${remaining.length}`);
  console.log(`   Coverage: ${(((totalDishes - remaining.length) / totalDishes) * 100).toFixed(1)}%`);
}

function getGenericIngredients(category: string, dishName: string): string[] {
  const nameLower = dishName.toLowerCase();
  
  // Try to infer ingredients from dish name
  const inferredIngredients: string[] = [];
  
  // Check for common keywords in dish name
  if (nameLower.includes('chicken')) inferredIngredients.push('chicken');
  if (nameLower.includes('beef') || nameLower.includes('steak')) inferredIngredients.push('beef');
  if (nameLower.includes('lamb')) inferredIngredients.push('lamb');
  if (nameLower.includes('salmon') || nameLower.includes('fish')) inferredIngredients.push('fish');
  if (nameLower.includes('tofu')) inferredIngredients.push('tofu');
  if (nameLower.includes('potato')) inferredIngredients.push('potatoes');
  if (nameLower.includes('rice')) inferredIngredients.push('rice');
  if (nameLower.includes('pasta') || nameLower.includes('noodle')) inferredIngredients.push('pasta');
  if (nameLower.includes('tomato')) inferredIngredients.push('tomatoes');
  if (nameLower.includes('onion')) inferredIngredients.push('onion');
  if (nameLower.includes('carrot')) inferredIngredients.push('carrots');
  if (nameLower.includes('chocolate')) inferredIngredients.push('chocolate');
  if (nameLower.includes('lemon')) inferredIngredients.push('lemon');
  if (nameLower.includes('honey')) inferredIngredients.push('honey');
  if (nameLower.includes('garlic')) inferredIngredients.push('garlic');
  if (nameLower.includes('mushroom')) inferredIngredients.push('mushrooms');
  if (nameLower.includes('spinach')) inferredIngredients.push('spinach');
  if (nameLower.includes('cheese')) inferredIngredients.push('cheese');
  if (nameLower.includes('egg')) inferredIngredients.push('eggs');
  if (nameLower.includes('bean')) inferredIngredients.push('beans');
  if (nameLower.includes('lentil')) inferredIngredients.push('lentils');
  if (nameLower.includes('cabbage')) inferredIngredients.push('cabbage');
  if (nameLower.includes('squash')) inferredIngredients.push('squash');
  if (nameLower.includes('apple')) inferredIngredients.push('apples');
  if (nameLower.includes('blueberry')) inferredIngredients.push('blueberries');
  if (nameLower.includes('mango')) inferredIngredients.push('mango');
  if (nameLower.includes('pecan')) inferredIngredients.push('pecans');
  if (nameLower.includes('pistachio')) inferredIngredients.push('pistachios');
  if (nameLower.includes('oat')) inferredIngredients.push('oats');
  if (nameLower.includes('cinnamon')) inferredIngredients.push('cinnamon');
  if (nameLower.includes('coffee') || nameLower.includes('mocha') || nameLower.includes('espresso')) inferredIngredients.push('coffee');
  if (nameLower.includes('chai')) inferredIngredients.push('chai spices');
  if (nameLower.includes('tahini')) inferredIngredients.push('tahini');
  if (nameLower.includes('caramel')) inferredIngredients.push('caramel');
  if (nameLower.includes('barley')) inferredIngredients.push('barley');
  if (nameLower.includes('leek')) inferredIngredients.push('leeks');
  if (nameLower.includes('celery')) inferredIngredients.push('celery');
  if (nameLower.includes('pepper')) inferredIngredients.push('bell pepper');
  if (nameLower.includes('eggplant')) inferredIngredients.push('eggplant');
  if (nameLower.includes('zucchini')) inferredIngredients.push('zucchini');
  if (nameLower.includes('cauliflower')) inferredIngredients.push('cauliflower');
  if (nameLower.includes('broccoli')) inferredIngredients.push('broccoli');
  if (nameLower.includes('pea')) inferredIngredients.push('peas');
  if (nameLower.includes('chickpea')) inferredIngredients.push('chickpeas');
  
  // Add base ingredients by category if we didn't infer many
  const baseIngredients: Record<string, string[]> = {
    'main_chicken': ['chicken', 'olive oil', 'garlic', 'salt', 'pepper', 'herbs'],
    'main_beef': ['beef', 'olive oil', 'garlic', 'onion', 'salt', 'pepper'],
    'side_veg': ['olive oil', 'garlic', 'salt', 'pepper', 'herbs'],
    'side_starch': ['butter', 'salt', 'pepper'],
    'soup': ['onion', 'garlic', 'broth', 'salt', 'pepper', 'herbs'],
    'muffin': ['flour', 'sugar', 'eggs', 'butter', 'baking powder', 'vanilla']
  };

  const categoryBase = baseIngredients[category] || ['salt', 'pepper', 'olive oil'];
  
  // Combine inferred + base, removing duplicates
  const combined = [...new Set([...inferredIngredients, ...categoryBase])];
  
  return combined;
}

addMissingIngredients()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
