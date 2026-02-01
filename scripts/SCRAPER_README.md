# Kosher Recipe Scraper

This script scrapes kosher recipes from kosher.com (priority) and additional sources (AllRecipes, Food.com) to populate the meal slot machine database.

## ⚠️ Important Notes

1. **Terms of Service**: Please review kosher.com's Terms of Service before scraping. This script is for educational/personal use only.
2. **Rate Limiting**: The script includes delays between requests to be respectful to the servers.
3. **Robots.txt**: The script checks robots.txt before scraping.

## Usage

### Scrape recipes only:
```bash
npm run scrape:kosher
```

This will:
- Scrape recipes from kosher.com (priority, up to 500 recipes)
- Scrape additional recipes from AllRecipes and Food.com (up to 200 recipes)
- Save all recipes to `samples/scraped_kosher_recipes.csv`

### Import scraped recipes:
```bash
npm run import:scraped
```

### Scrape and import in one command:
```bash
npm run scrape:and:import
```

### Import a specific CSV file:
```bash
tsx scripts/import-kosher-dishes.ts path/to/your/file.csv
```

## Output

The scraper generates a CSV file with the following columns:
- `name` - Recipe name
- `slot_category` - Category (main_chicken, main_beef, side_veg, side_starch, soup, muffin)
- `ingredients` - Comma-separated list of ingredients
- `kosher` - true/false
- `kosher_style` - meat/dairy/pareve
- `difficulty` - easy/medium/hard
- `main_protein` - chicken/beef/fish/tofu/none
- `prep_time_minutes` - Preparation time
- `cook_time_minutes` - Cooking time
- `servings` - Number of servings
- `cuisine` - Cuisine type
- `tags` - Comma-separated tags
- `contains_allergens` - Comma-separated allergens (dairy, eggs, nuts, gluten)
- `notes` - Recipe description/notes
- `source_url` - Original recipe URL

## How It Works

1. **kosher.com Scraping**:
   - Checks robots.txt
   - Searches recipe listing pages
   - Extracts recipe URLs
   - Scrapes individual recipe pages for details

2. **Additional Sources**:
   - AllRecipes (kosher search)
   - Food.com (kosher search)

3. **Data Processing**:
   - Automatically categorizes recipes into slot categories
   - Detects allergens from ingredients
   - Determines kosher style (meat/dairy/pareve)
   - Estimates difficulty based on time and ingredient count
   - Extracts prep/cook times and servings

4. **Import**:
   - Parses CSV file
   - Creates/updates ingredients, tags, and allergens
   - Imports dishes into database
   - Skips duplicates (based on name + slot_category)

## Troubleshooting

- **No recipes found**: The website structure may have changed. Check the selectors in the scraper script.
- **Import errors**: Check that the CSV format matches the expected structure.
- **Rate limiting**: Increase delays in the scraper script if you encounter rate limiting.

## Customization

Edit `scripts/scrape-kosher-recipes.ts` to:
- Change maximum number of recipes to scrape
- Add additional recipe sources
- Modify categorization logic
- Adjust rate limiting delays
