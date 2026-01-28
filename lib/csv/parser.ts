import Papa from 'papaparse';
import { z } from 'zod';
import {
  SLOT_CATEGORIES,
  KOSHER_STYLES,
  DIFFICULTY_LEVELS,
  type SlotCategory,
  type KosherStyle,
  type DifficultyLevel,
  type CSVDishRow,
  type CSVValidationResult,
  type NormalizedDishData,
} from '@/lib/types';

// Header mapping - maps various column name formats to standard names
const HEADER_MAP: Record<string, string> = {
  // Standard names
  name: 'name',
  slot_category: 'slot_category',
  ingredients: 'ingredients',
  kosher: 'kosher',
  kosher_style: 'kosher_style',
  difficulty: 'difficulty',
  main_protein: 'main_protein',
  prep_time_minutes: 'prep_time_minutes',
  cook_time_minutes: 'cook_time_minutes',
  servings: 'servings',
  cuisine: 'cuisine',
  tags: 'tags',
  contains_allergens: 'contains_allergens',
  notes: 'notes',
  source_url: 'source_url',
  // Camel case variants
  slotcategory: 'slot_category',
  kosherstyle: 'kosher_style',
  mainprotein: 'main_protein',
  preptimeminutes: 'prep_time_minutes',
  cooktimeminutes: 'cook_time_minutes',
  sourceurl: 'source_url',
  containsallergens: 'contains_allergens',
  // Mixed variants
  'slot category': 'slot_category',
  'kosher style': 'kosher_style',
  'main protein': 'main_protein',
  'prep time minutes': 'prep_time_minutes',
  'cook time minutes': 'cook_time_minutes',
  'prep time': 'prep_time_minutes',
  'cook time': 'cook_time_minutes',
  'source url': 'source_url',
  'contains allergens': 'contains_allergens',
  allergens: 'contains_allergens',
};

/**
 * Normalizes a header name to the standard format
 */
function normalizeHeader(header: string): string {
  const normalized = header.toLowerCase().trim().replace(/[_\s]+/g, '');
  return HEADER_MAP[normalized] || HEADER_MAP[header.toLowerCase().trim()] || header.toLowerCase().trim();
}

/**
 * Parses a boolean value from various string formats
 */
function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.toLowerCase().trim();
  return v === 'true' || v === 'yes' || v === '1';
}

/**
 * Normalizes a list string to an array of lowercase trimmed values
 */
function normalizeList(value: string | undefined): string[] {
  if (!value || value.trim() === '') return [];
  return value
    .split(',')
    .map((item) => item.toLowerCase().trim().replace(/\s+/g, ' '))
    .filter((item) => item.length > 0);
}

/**
 * Parses an integer value
 */
function parseIntOrNull(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = parseInt(value.trim(), 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Validates slot category
 */
function validateSlotCategory(value: string | undefined): SlotCategory | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim().replace(/\s+/g, '_');
  if (SLOT_CATEGORIES.includes(normalized as SlotCategory)) {
    return normalized as SlotCategory;
  }
  return null;
}

/**
 * Validates kosher style
 */
function validateKosherStyle(value: string | undefined): KosherStyle {
  if (!value) return 'unknown';
  const normalized = value.toLowerCase().trim();
  if (KOSHER_STYLES.includes(normalized as KosherStyle)) {
    return normalized as KosherStyle;
  }
  return 'unknown';
}

/**
 * Validates difficulty
 */
function validateDifficulty(value: string | undefined): DifficultyLevel {
  if (!value) return 'unknown';
  const normalized = value.toLowerCase().trim();
  if (DIFFICULTY_LEVELS.includes(normalized as DifficultyLevel)) {
    return normalized as DifficultyLevel;
  }
  return 'unknown';
}

/**
 * Parses CSV content and returns raw rows with normalized headers
 */
export function parseCSV(csvContent: string): { headers: string[]; rows: Record<string, string>[] } {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  return {
    headers: result.meta.fields || [],
    rows: result.data,
  };
}

/**
 * Validates and normalizes a single CSV row
 */
export function validateAndNormalizeRow(
  row: Record<string, string>,
  rowIndex: number
): CSVValidationResult {
  const errors: string[] = [];

  // Required field: name
  const name = row.name?.trim();
  if (!name) {
    errors.push('Name is required');
  }

  // Required field: slot_category
  const slotCategory = validateSlotCategory(row.slot_category);
  if (!slotCategory) {
    errors.push(
      `Invalid slot_category: "${row.slot_category}". Must be one of: ${SLOT_CATEGORIES.join(', ')}`
    );
  }

  // Parse optional fields
  const kosher = parseBoolean(row.kosher);
  const kosherStyle = validateKosherStyle(row.kosher_style);
  const difficulty = validateDifficulty(row.difficulty);
  const mainProtein = row.main_protein?.trim().toLowerCase() || null;
  const cuisine = row.cuisine?.trim() || null;
  const prepTimeMinutes = parseIntOrNull(row.prep_time_minutes);
  const cookTimeMinutes = parseIntOrNull(row.cook_time_minutes);
  const servings = parseIntOrNull(row.servings);
  const notes = row.notes?.trim() || null;
  const sourceUrl = row.source_url?.trim() || null;

  // Parse list fields
  const ingredients = normalizeList(row.ingredients);
  const tags = normalizeList(row.tags);
  const allergens = normalizeList(row.contains_allergens);

  // Validate time values
  if (prepTimeMinutes !== null && prepTimeMinutes < 0) {
    errors.push('prep_time_minutes must be a positive number');
  }
  if (cookTimeMinutes !== null && cookTimeMinutes < 0) {
    errors.push('cook_time_minutes must be a positive number');
  }
  if (servings !== null && servings < 1) {
    errors.push('servings must be at least 1');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      row: rowIndex + 1, // 1-indexed for user display
      errors,
    };
  }

  return {
    valid: true,
    row: rowIndex + 1,
    errors: [],
    data: {
      name: name!,
      slotCategory: slotCategory!,
      kosher,
      kosherStyle,
      difficulty,
      mainProtein,
      cuisine,
      prepTimeMinutes,
      cookTimeMinutes,
      servings,
      notes,
      sourceUrl,
      ingredients,
      tags,
      allergens,
    },
  };
}

/**
 * Validates all rows in a CSV
 */
export function validateCSV(rows: Record<string, string>[]): CSVValidationResult[] {
  return rows.map((row, index) => validateAndNormalizeRow(row, index));
}

/**
 * Gets the required columns for CSV import
 */
export function getRequiredColumns(): string[] {
  return ['name', 'slot_category'];
}

/**
 * Gets all supported columns for CSV import
 */
export function getSupportedColumns(): string[] {
  return [
    'name',
    'slot_category',
    'ingredients',
    'kosher',
    'kosher_style',
    'difficulty',
    'main_protein',
    'prep_time_minutes',
    'cook_time_minutes',
    'servings',
    'cuisine',
    'tags',
    'contains_allergens',
    'notes',
    'source_url',
  ];
}

/**
 * Schema for validating normalized dish data
 */
export const normalizedDishSchema = z.object({
  name: z.string().min(1),
  slotCategory: z.enum(SLOT_CATEGORIES),
  kosher: z.boolean(),
  kosherStyle: z.enum(KOSHER_STYLES),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  mainProtein: z.string().nullable(),
  cuisine: z.string().nullable(),
  prepTimeMinutes: z.number().nullable(),
  cookTimeMinutes: z.number().nullable(),
  servings: z.number().nullable(),
  notes: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  ingredients: z.array(z.string()),
  tags: z.array(z.string()),
  allergens: z.array(z.string()),
});
