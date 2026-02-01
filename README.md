# 🎰 Meal Slot

A production-ready web application for generating meal plans using a slot-machine-inspired interface. Built with Next.js, Prisma, and TailwindCSS.

![Meal Slot](https://via.placeholder.com/800x400?text=Meal+Slot+Screenshot)

## ✨ Features

- **🎰 Slot Machine Spin** - Fun animated interface to randomly select dishes for each meal category
- **📅 Daily & Weekly Plans** - Generate single-day or full 7-day meal plans
- **🔒 Lock & Re-spin** - Keep dishes you like while re-spinning the rest
- **🥗 Smart Filtering** - Filter by kosher, allergens, ingredients, difficulty, cuisine, and more
- **📤 CSV Import** - Upload and manage your dish database via CSV files
- **👤 Customer Profiles** - Create templates like "2 mains, 2 sides, 1 soup, 1 muffin"
- **🔄 Reproducible Plans** - Seeded random generation for reproducible results
- **📊 Dish Library** - Browse, search, and filter your complete dish collection
- **🖨️ Export & Print** - Export plans to CSV or print-friendly format

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd dish_slot_machine
   npm install
   ```

2. **Set up environment:**
   ```bash
   # Copy the template and edit as needed
   cp env.template .env
   ```

3. **Initialize the database:**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database (creates SQLite file)
   npm run db:push

   # Optional: Seed with sample data
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚢 Deployment (Vercel)

**⚠️ Important:** SQLite does NOT work on Vercel. You must use PostgreSQL.

See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for detailed setup instructions.

**Quick steps:**
1. Create a Vercel Postgres database (or use Supabase/Neon)
2. Update `prisma/schema.prisma` to use `provider = "postgresql"`
3. Set `DATABASE_URL` environment variable in Vercel
4. Run migrations: `npx prisma migrate deploy`
5. Deploy!

## 📁 Project Structure

```
dish_slot_machine/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public routes
│   ├── admin/             # Admin routes (upload, profiles)
│   ├── api/               # API routes
│   ├── library/           # Dish library page
│   ├── plans/             # Plans generation & viewing
│   └── spin/              # Slot machine page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── dish-card.tsx     # Dish display card
│   ├── filter-bar.tsx    # Filter controls
│   ├── navigation.tsx    # Main navigation
│   └── slot-machine.tsx  # Slot machine component
├── lib/                   # Shared libraries
│   ├── auth/             # Admin authentication
│   ├── csv/              # CSV parsing & import
│   ├── db/               # Database queries
│   ├── plan/             # Plan generation logic
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── prisma/               # Prisma schema & migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
└── samples/              # Sample data
    └── sample_dishes.csv # Sample dish CSV
```

## 📊 CSV Import Format

### Required Columns
- `name` - Dish name (string)
- `slot_category` - One of: `main_chicken`, `main_beef`, `side_veg`, `side_starch`, `soup`, `muffin`

### Optional Columns
| Column | Type | Description |
|--------|------|-------------|
| `ingredients` | comma-separated | List of ingredients |
| `kosher` | true/false/yes/no/1/0 | Is the dish kosher? |
| `kosher_style` | meat/dairy/pareve/unknown | Kosher classification |
| `difficulty` | easy/medium/hard/unknown | Difficulty level |
| `main_protein` | string | Primary protein (chicken, beef, fish, tofu, none) |
| `prep_time_minutes` | number | Preparation time |
| `cook_time_minutes` | number | Cooking time |
| `servings` | number | Number of servings |
| `cuisine` | string | Cuisine type (Italian, Asian, etc.) |
| `tags` | comma-separated | Tags (kid-friendly, quick, etc.) |
| `contains_allergens` | comma-separated | Allergens (dairy, eggs, nuts, gluten) |
| `notes` | string | Additional notes |
| `source_url` | string | Recipe URL |

### Example CSV
```csv
name,slot_category,ingredients,kosher,kosher_style,difficulty,main_protein,prep_time_minutes,cook_time_minutes,servings,cuisine,tags,contains_allergens,notes
Lemon Herb Chicken,main_chicken,"chicken, lemon, garlic, rosemary",true,meat,easy,chicken,15,45,4,Mediterranean,weeknight dinner,,Classic roasted chicken
```

### Header Variations
The importer accepts various header formats:
- `slot_category` or `slotCategory`
- `prep_time_minutes` or `prepTimeMinutes`
- `kosher_style` or `kosherStyle`
- `source_url` or `sourceUrl`

## 🧠 How It Works

### Ingredient Normalization
Ingredients are normalized and stored in a separate table:
1. Split by commas
2. Trim whitespace
3. Convert to lowercase
4. Collapse multiple spaces
5. Store in `Ingredient` table with join table `DishIngredient`

This enables reliable include/exclude filtering on ingredients.

### Seeded Random Generation
Plans can be reproduced using seed strings:

```typescript
// The seed is converted to a number using a hash function
const seed = "my-seed-123";
const rng = createSeededRNG(seed);

// Same seed = same results every time
const dish1 = pickRandom(candidates, rng);
```

The algorithm uses Mulberry32, a simple seeded PRNG that produces consistent results across runs.

### Plan Generation Logic
1. Get candidate dishes for each category
2. Apply all filters (kosher, allergens, ingredients, etc.)
3. For weekly mode, optionally track used dishes to avoid repeats
4. Shuffle candidates with seeded RNG
5. Pick first candidate for each slot
6. Handle conflicts gracefully with warnings

## 🗃️ Database

### Switching to PostgreSQL

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mealslot?schema=public"
   ```

3. Run migrations:
   ```bash
   npm run db:migrate
   ```

### Database Studio
View and edit data directly:
```bash
npm run db:studio
```

## 🔐 Admin Authentication

The admin routes (`/admin/*`) can be protected with a simple password:

1. Set `ADMIN_PASSWORD` in `.env`
2. The app uses session cookies for authentication
3. Sessions expire after 24 hours

## 🧪 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dishes` | List dishes with filters |
| GET | `/api/profiles` | List customer profiles |
| POST | `/api/profiles` | Create new profile |
| POST | `/api/spin` | Generate plan |
| GET | `/api/plans` | List saved plans |
| POST | `/api/plans` | Save a plan |
| GET | `/api/plans/[id]` | Get plan details |
| POST | `/api/admin/upload/preview` | Preview CSV |
| POST | `/api/admin/upload/import` | Import CSV |

## 🎨 Customization

### Slot Categories
Add new categories by:
1. Update `SLOT_CATEGORIES` in `lib/types/index.ts`
2. Add labels in `SLOT_CATEGORY_LABELS`
3. Add colors in `SLOT_CATEGORY_COLORS`
4. Add badge styles in `globals.css`

### Themes
The app uses CSS variables for theming. Edit `tailwind.config.ts` and `globals.css` to customize:
- `--slot-gold`, `--slot-purple`, etc.
- Font families
- Animation timings

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

Built with ❤️ using Next.js, Prisma, and TailwindCSS
