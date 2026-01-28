// Slot Categories
export const SLOT_CATEGORIES = [
  'main_chicken',
  'main_beef',
  'side_veg',
  'side_starch',
  'soup',
  'muffin',
] as const;

export type SlotCategory = (typeof SLOT_CATEGORIES)[number];

// Kosher Styles
export const KOSHER_STYLES = ['meat', 'dairy', 'pareve', 'unknown'] as const;
export type KosherStyle = (typeof KOSHER_STYLES)[number];

// Difficulty Levels
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'unknown'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

// Plan Modes
export const PLAN_MODES = ['daily', 'weekly'] as const;
export type PlanMode = (typeof PLAN_MODES)[number];

// Standard Allergens
export const STANDARD_ALLERGENS = ['dairy', 'eggs', 'nuts', 'gluten'] as const;
export type StandardAllergen = (typeof STANDARD_ALLERGENS)[number];

// Slot Category Labels
export const SLOT_CATEGORY_LABELS: Record<SlotCategory, string> = {
  main_chicken: 'Main (Chicken)',
  main_beef: 'Main (Beef)',
  side_veg: 'Side (Vegetable)',
  side_starch: 'Side (Starch)',
  soup: 'Soup',
  muffin: 'Muffin',
};

// Slot Category Colors
export const SLOT_CATEGORY_COLORS: Record<SlotCategory, string> = {
  main_chicken: 'bg-slot-gold',
  main_beef: 'bg-slot-red',
  side_veg: 'bg-slot-green',
  side_starch: 'bg-slot-orange',
  soup: 'bg-slot-blue',
  muffin: 'bg-slot-purple',
};

// Dish with all relations
export interface DishWithRelations {
  id: string;
  name: string;
  slotCategory: string;
  kosher: boolean;
  kosherStyle: string;
  difficulty: string;
  mainProtein: string | null;
  cuisine: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  notes: string | null;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  ingredients: { ingredient: { id: string; name: string } }[];
  tags: { tag: { id: string; name: string } }[];
  allergens: { allergen: { id: string; name: string } }[];
}

// Filter Options
export interface FilterOptions {
  kosherOnly?: boolean;
  kosherStyles?: KosherStyle[];
  difficulties?: DifficultyLevel[];
  mainProteins?: string[];
  includeIngredients?: string[];
  excludeIngredients?: string[];
  excludeAllergens?: string[];
  cuisines?: string[];
  maxTotalTimeMinutes?: number;
}

// Profile Rules
export interface ProfileRules {
  categories: SlotCategory[];
  name?: string;
  description?: string;
}

// Locked Dishes (for slot machine)
export type LockedDishes = Partial<Record<SlotCategory, string>>;

// Plan Generation Result
export interface PlanGenerationResult {
  success: boolean;
  plan?: GeneratedPlan;
  errors?: PlanError[];
  warnings?: string[];
}

export interface GeneratedPlan {
  days: GeneratedDay[];
  seed: string;
  mode: PlanMode;
  profileId?: string;
}

export interface GeneratedDay {
  dayIndex: number;
  dishes: Record<SlotCategory, DishWithRelations>;
}

// Plan Errors
export type PlanErrorCode =
  | 'NO_DISHES_IN_DB'
  | 'NO_CANDIDATES_FOR_CATEGORY'
  | 'LOCK_CONFLICT'
  | 'CONSTRAINTS_TOO_STRICT';

export interface PlanError {
  code: PlanErrorCode;
  message: string;
  category?: SlotCategory;
  details?: {
    totalDishes?: number;
    candidatesPerCategory?: Record<string, number>;
    appliedFilters?: FilterOptions;
    failedConstraint?: string;
  };
}

// CSV Row (for import)
export interface CSVDishRow {
  name: string;
  slot_category: string;
  ingredients?: string;
  kosher?: string;
  kosher_style?: string;
  difficulty?: string;
  main_protein?: string;
  prep_time_minutes?: string;
  cook_time_minutes?: string;
  servings?: string;
  cuisine?: string;
  tags?: string;
  contains_allergens?: string;
  notes?: string;
  source_url?: string;
  // Alternative column names
  slotCategory?: string;
  prepTimeMinutes?: string;
  cookTimeMinutes?: string;
  sourceUrl?: string;
  kosherStyle?: string;
  mainProtein?: string;
}

// CSV Validation Result
export interface CSVValidationResult {
  valid: boolean;
  row: number;
  errors: string[];
  data?: NormalizedDishData;
}

// Normalized Dish Data
export interface NormalizedDishData {
  name: string;
  slotCategory: SlotCategory;
  kosher: boolean;
  kosherStyle: KosherStyle;
  difficulty: DifficultyLevel;
  mainProtein: string | null;
  cuisine: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  notes: string | null;
  sourceUrl: string | null;
  ingredients: string[];
  tags: string[];
  allergens: string[];
}

// Import Result
export interface ImportResult {
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: { row: number; errors: string[] }[];
}

// Default Profile Rules
export const DEFAULT_PROFILE_RULES: ProfileRules = {
  categories: ['main_chicken', 'main_beef', 'side_veg', 'side_starch', 'soup', 'muffin'],
  name: 'Standard Weekly',
  description: '2 mains (1 chicken + 1 beef), 2 sides (1 vegetable + 1 starch), 1 soup, 1 muffin',
};

/**
 * Parses profile rules from JSON string
 */
export function parseProfileRules(rulesJson: string): ProfileRules {
  try {
    return JSON.parse(rulesJson);
  } catch {
    return DEFAULT_PROFILE_RULES;
  }
}
