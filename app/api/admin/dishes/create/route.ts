import { NextRequest, NextResponse } from 'next/server';
import { createDish } from '@/lib/db/dishes-create';
import type { NormalizedDishData } from '@/lib/types';
import { SLOT_CATEGORIES, KOSHER_STYLES, DIFFICULTY_LEVELS } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slotCategory,
      ingredients = [],
      kosher = false,
      kosherStyle = 'unknown',
      difficulty = 'unknown',
      mainProtein,
      prepTimeMinutes,
      cookTimeMinutes,
      servings,
      cuisine,
      tags = [],
      allergens = [],
      notes,
      sourceUrl,
    } = body;

    // Validation
    if (!name || !slotCategory) {
      return NextResponse.json(
        { error: 'Name and slot category are required' },
        { status: 400 }
      );
    }

    // Validate sourceUrl if provided
    if (sourceUrl && sourceUrl.trim()) {
      const trimmed = sourceUrl.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return NextResponse.json(
          { error: 'Source URL must be a full URL starting with http:// or https://' },
          { status: 400 }
        );
      }
    }

    if (!SLOT_CATEGORIES.includes(slotCategory)) {
      return NextResponse.json(
        { error: 'Invalid slot category' },
        { status: 400 }
      );
    }

    if (!KOSHER_STYLES.includes(kosherStyle)) {
      return NextResponse.json(
        { error: 'Invalid kosher style' },
        { status: 400 }
      );
    }

    if (!DIFFICULTY_LEVELS.includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty' },
        { status: 400 }
      );
    }

    // Normalize data
    const normalizedData: NormalizedDishData = {
      name: name.trim(),
      slotCategory,
      kosher: Boolean(kosher),
      kosherStyle,
      difficulty,
      mainProtein: mainProtein?.trim() || null,
      cuisine: cuisine?.trim() || null,
      prepTimeMinutes: prepTimeMinutes ? parseInt(String(prepTimeMinutes)) : null,
      cookTimeMinutes: cookTimeMinutes ? parseInt(String(cookTimeMinutes)) : null,
      servings: servings ? parseInt(String(servings)) : null,
      notes: notes?.trim() || null,
      sourceUrl: sourceUrl?.trim() && (sourceUrl.trim().startsWith('http://') || sourceUrl.trim().startsWith('https://')) 
        ? sourceUrl.trim() 
        : null,
      ingredients: Array.isArray(ingredients)
        ? ingredients.map((i: string) => i.trim().toLowerCase()).filter(Boolean)
        : [],
      tags: Array.isArray(tags)
        ? [...tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean), 'manually added']
        : ['manually added'],
      allergens: Array.isArray(allergens)
        ? allergens.map((a: string) => a.trim().toLowerCase()).filter(Boolean)
        : [],
    };

    // Create the dish
    const result = await createDish(normalizedData, false);

    if (result.action === 'skipped') {
      return NextResponse.json(
        { error: 'A dish with this name and category already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      action: result.action,
      message: `Dish ${result.action === 'created' ? 'created' : 'updated'} successfully`,
    });
  } catch (error) {
    console.error('Error creating dish:', error);
    return NextResponse.json(
      { error: 'Failed to create dish', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
