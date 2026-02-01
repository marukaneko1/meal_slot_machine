'use client';

export interface ShoppingListItem {
  id: string;
  name: string;
  checked: boolean;
  quantity?: string;
  notes?: string;
  addedFrom?: string; // dish name that added this ingredient
}

const STORAGE_KEY = 'meal-slot-shopping-list';

/**
 * Get all shopping list items from localStorage
 */
export function getShoppingList(): ShoppingListItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading shopping list:', e);
    return [];
  }
}

/**
 * Save shopping list to localStorage
 */
export function saveShoppingList(items: ShoppingListItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Dispatch custom event for reactivity
    window.dispatchEvent(new CustomEvent('shopping-list-updated'));
  } catch (e) {
    console.error('Error saving shopping list:', e);
  }
}

/**
 * Add ingredients to shopping list
 */
export function addIngredientsToShoppingList(
  ingredients: string[],
  dishName?: string
): void {
  const currentList = getShoppingList();
  const newItems: ShoppingListItem[] = [];

  ingredients.forEach((ingredient) => {
    const normalizedName = ingredient.trim().toLowerCase();
    
    // Check if ingredient already exists (case-insensitive)
    const existing = currentList.find(
      (item) => item.name.toLowerCase() === normalizedName
    );

    if (!existing) {
      newItems.push({
        id: `${Date.now()}-${Math.random()}`,
        name: ingredient.trim(),
        checked: false,
        addedFrom: dishName,
      });
    }
  });

  if (newItems.length > 0) {
    saveShoppingList([...currentList, ...newItems]);
  }
}

/**
 * Toggle checked state of an item
 */
export function toggleShoppingListItem(id: string): void {
  const items = getShoppingList();
  const updated = items.map((item) =>
    item.id === id ? { ...item, checked: !item.checked } : item
  );
  saveShoppingList(updated);
}

/**
 * Remove an item from shopping list
 */
export function removeShoppingListItem(id: string): void {
  const items = getShoppingList();
  const updated = items.filter((item) => item.id !== id);
  saveShoppingList(updated);
}

/**
 * Update an item in shopping list
 */
export function updateShoppingListItem(
  id: string,
  updates: Partial<Omit<ShoppingListItem, 'id'>>
): void {
  const items = getShoppingList();
  const updated = items.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  saveShoppingList(updated);
}

/**
 * Clear all checked items
 */
export function clearCheckedItems(): void {
  const items = getShoppingList();
  const updated = items.filter((item) => !item.checked);
  saveShoppingList(updated);
}

/**
 * Clear entire shopping list
 */
export function clearShoppingList(): void {
  saveShoppingList([]);
}

/**
 * Get count of unchecked items
 */
export function getShoppingListCount(): number {
  const items = getShoppingList();
  return items.filter((item) => !item.checked).length;
}
