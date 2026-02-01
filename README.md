# Meal Slot

A production-ready web application for generating meal plans. Built with Next.js, Prisma, and a custom design system.

## Features

- **Daily & Weekly Plans** — Generate meal plans for one day or a full week
- **Lock & Re-spin** — Keep dishes you like while regenerating the rest
- **Smart Filtering** — Filter by kosher, allergens, ingredients, difficulty, cuisine
- **CSV Import** — Upload and manage your dish database via CSV
- **Customer Profiles** — Create templates like "2 mains, 2 sides, 1 soup, 1 muffin"
- **Shopping List** — Add ingredients to a shopping list from any recipe
- **Dish Library** — Browse, search, and filter your complete dish collection

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

   ```bash
# Install dependencies
   npm install

# Set up environment
   cp env.template .env

# Initialize database
   npm run db:generate
   npm run db:push
npm run db:seed  # Optional: seed with sample data

# Start dev server
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000)

---

## Design System

This project uses a custom design system built on Tailwind CSS with CSS custom properties. All UI components and pages follow these standards.

### Design Principles

1. **Warm, editorial aesthetic** — Modern cookbook meets culinary magazine
2. **Consistent spacing** — Use the defined spacing scale only
3. **Restrained color** — Warm neutrals with amber accent
4. **Subtle motion** — 150-200ms transitions, no bouncy animations
5. **Left-aligned hierarchy** — Editorial layouts, not center-everything

### File Structure

```
styles/
  design-tokens.css    # All design tokens (colors, spacing, typography, etc.)

app/
  globals.css          # Tailwind imports + component classes

components/ui/
  button.tsx           # Button component
  card.tsx             # Card component
  chip.tsx             # Chip/tag component
  input.tsx            # Input component
  select.tsx           # Select component
  toggle.tsx           # Toggle/switch component
```

### Color Tokens

| Token | Usage |
|-------|-------|
| `--color-bg` | Page background |
| `--color-surface` | Card backgrounds |
| `--color-surface-2` | Elevated elements |
| `--color-surface-3` | Hover states |
| `--color-border` | Primary borders |
| `--color-border-subtle` | Subtle borders |
| `--color-text` | Primary text |
| `--color-text-secondary` | Secondary text |
| `--color-text-muted` | Muted text |
| `--color-accent` | Primary accent (amber) |
| `--color-success` | Success states |
| `--color-error` | Error states |
| `--color-warning` | Warning states |

### Spacing Scale

Use only these values for margins, padding, and gaps:

```
--space-1: 0.25rem   (4px)
--space-2: 0.5rem    (8px)
--space-3: 0.75rem   (12px)
--space-4: 1rem      (16px)
--space-5: 1.25rem   (20px)
--space-6: 1.5rem    (24px)
--space-8: 2rem      (32px)
--space-10: 2.5rem   (40px)
--space-12: 3rem     (48px)
--space-16: 4rem     (64px)
```

### Typography

**Font Families:**
- Display: Playfair Display (serif) — headings
- Body: DM Sans (sans-serif) — body text

**Heading Classes:**
- `.heading-1` — Page titles (36px, serif)
- `.heading-2` — Section titles (30px, serif)
- `.heading-3` — Card titles (24px, serif)
- `.heading-4` — Subsection titles (18px, sans)

**Text Classes:**
- `.body-lg` — Large body text
- `.body-base` — Standard body text
- `.body-sm` — Small body text
- `.caption` — Captions and labels
- `.label` — Form labels

### Component Classes

**Buttons:**
```html
<button class="btn-primary">Primary</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-ghost">Ghost</button>
<button class="btn-accent">Accent</button>
<button class="btn-sm">Small</button>
<button class="btn-lg">Large</button>
```

**Inputs:**
```html
<input class="input" />
<label class="input-label">Label</label>
<p class="input-hint">Hint text</p>
<p class="input-error-text">Error message</p>
```

**Cards:**
```html
<div class="card">Static card</div>
<div class="card-interactive">Clickable card</div>
```

**Chips:**
```html
<span class="chip">Default chip</span>
<button class="chip-interactive">Clickable chip</button>
<button class="chip-interactive chip-selected">Selected</button>
<span class="chip-protein">Protein category</span>
<span class="chip-vegetable">Vegetable category</span>
```

**Alerts:**
```html
<div class="alert-success">Success message</div>
<div class="alert-error">Error message</div>
<div class="alert-warning">Warning message</div>
```

**Layout:**
```html
<div class="container-page">Centered max-width container</div>
<div class="empty-state">Empty state wrapper</div>
```

---

## Future UI Rules

**IMPORTANT:** Follow these rules for all future UI work to maintain design consistency.

### DO

1. **Use design tokens** — Always reference CSS variables for colors, spacing, typography
2. **Use component classes** — Use `.btn-*`, `.card`, `.chip`, `.input`, etc.
3. **Follow the spacing scale** — Only use values from the spacing scale
4. **Use typography classes** — Use `.heading-*`, `.body-*`, `.caption`, `.label`
5. **Left-align content** — Default to left-aligned text and layouts
6. **Keep animations subtle** — 150-200ms durations, ease-out timing

### DON'T

1. **Don't use arbitrary colors** — No hex codes or rgb() in component code
2. **Don't use arbitrary spacing** — No `p-7`, `mt-11`, etc. — stick to the scale
3. **Don't center everything** — Avoid center-aligned layouts except for empty states
4. **Don't add glow effects** — No box-shadow glows or text shadows
5. **Don't use emoji in UI** — Keep the interface clean and professional
6. **Don't use bouncy animations** — No spring physics or exaggerated transforms
7. **Don't create one-off styles** — Add new patterns to the design system first

### Adding New Patterns

If you need a new UI pattern:

1. Add the CSS class to `globals.css` under `@layer components`
2. Document it in this README
3. Create a reusable component in `components/ui/`

### Category Colors

For dish categories, use these chip classes:
- `chip-protein` — Chicken, beef, and other proteins
- `chip-vegetable` — Vegetable sides
- `chip-starch` — Starch sides
- `chip-soup` — Soups
- `chip-dessert` — Muffins and desserts

---

## Project Structure

```
app/
  page.tsx              # Home/Spin page
  library/              # Dish library
  plans/                # Plan generation & viewing
  shopping/             # Shopping list
  admin/
    upload/             # CSV upload & manual entry
    profiles/           # Customer profiles

components/
  ui/                   # Base UI components
  slot-machine.tsx      # Main slot machine component
  dish-card.tsx         # Dish display card
  filter-bar.tsx        # Filter controls
  navigation.tsx        # Desktop navigation
  bottom-nav.tsx        # Mobile navigation
  recipe-modal.tsx      # Recipe detail modal

lib/
  db/                   # Database queries
  csv/                  # CSV parsing & import
  plan/                 # Plan generation logic
  types/                # TypeScript types
  utils/                # Utility functions

styles/
  design-tokens.css     # Design system tokens
```

---

## API Endpoints

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
| POST | `/api/admin/dishes/create` | Create single dish |

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

---

## Deployment

See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for Vercel deployment instructions.

**Note:** SQLite doesn't work on Vercel. Use PostgreSQL (Vercel Postgres, Supabase, or Neon).

---

## License

MIT License
