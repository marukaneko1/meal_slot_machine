'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Check, X, Trash2, Plus, AlertCircle, RotateCcw } from 'lucide-react';
import {
  getShoppingList,
  toggleShoppingListItem,
  removeShoppingListItem,
  updateShoppingListItem,
  clearCheckedItems,
  clearShoppingList,
  saveShoppingList,
  type ShoppingListItem,
} from '@/lib/utils/shopping-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils/cn';

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [useDropdown, setUseDropdown] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editNotes, setEditNotes] = useState('');
  
  const [undoState, setUndoState] = useState<{
    show: boolean;
    deletedItem: ShoppingListItem | null;
  }>({ show: false, deletedItem: null });

  useEffect(() => {
    const loadItems = () => setItems(getShoppingList());
    loadItems();
    window.addEventListener('shopping-list-updated', loadItems);
    return () => window.removeEventListener('shopping-list-updated', loadItems);
  }, []);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await fetch('/api/dishes');
        if (response.ok) {
          const data = await response.json();
          setAvailableIngredients(data.ingredients || []);
        }
      } catch (error) {
        console.error('Failed to fetch ingredients:', error);
      }
    };
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (undoState.show) {
      const timer = setTimeout(() => {
        setUndoState({ show: false, deletedItem: null });
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [undoState.show]);

  const handleAddItem = () => {
    const itemName = useDropdown ? newItemName : newItemName.trim();
    if (!itemName) return;

    const currentList = getShoppingList();
    const normalizedName = itemName.toLowerCase();
    
    if (currentList.some((item) => item.name.toLowerCase() === normalizedName)) {
      alert('This item is already in your shopping list!');
      return;
    }

    const newItem: ShoppingListItem = {
      id: `${Date.now()}-${Math.random()}`,
      name: itemName,
      checked: false,
      quantity: newItemQuantity.trim() || undefined,
    };

    const updated = [...currentList, newItem];
    setItems(updated);
    saveShoppingList(updated);
    setNewItemName('');
    setNewItemQuantity('');
    setShowAddModal(false);
  };

  const handleToggle = (id: string) => {
    toggleShoppingListItem(id);
    setItems(getShoppingList());
  };

  const handleRemove = (id: string) => {
    const itemToDelete = items.find((item) => item.id === id);
    if (!itemToDelete) return;
    removeShoppingListItem(id);
    setItems(getShoppingList());
    setUndoState({ show: true, deletedItem: itemToDelete });
  };

  const handleUndo = () => {
    if (!undoState.deletedItem) return;
    const currentList = getShoppingList();
    const updated = [...currentList, undoState.deletedItem];
    setItems(updated);
    saveShoppingList(updated);
    setUndoState({ show: false, deletedItem: null });
  };

  const handleStartEdit = (item: ShoppingListItem) => {
    setEditingId(item.id);
    setEditQuantity(item.quantity || '');
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    updateShoppingListItem(id, {
      quantity: editQuantity.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });
    setItems(getShoppingList());
    setEditingId(null);
    setEditQuantity('');
    setEditNotes('');
  };

  const checkedCount = items.filter((item) => item.checked).length;
  const uncheckedCount = items.filter((item) => !item.checked).length;
  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  return (
    <div className="min-h-screen py-6 md:py-10">
      <div className="container-page max-w-3xl">
        {/* Undo Toast */}
        {undoState.show && undoState.deletedItem && (
          <div className="fixed top-4 md:top-20 left-1/2 -translate-x-1/2 alert-warning z-50 animate-slide-down shadow-lg">
            <AlertCircle className="w-5 h-5" />
            <span>Removed <strong>{undoState.deletedItem.name}</strong></span>
            <Button variant="secondary" size="sm" onClick={handleUndo}>
              <RotateCcw className="w-4 h-4" />
              Undo
            </Button>
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-6 h-6 text-bg" />
            </div>
            <div className="flex-1">
              <h1 className="heading-1">Shopping List</h1>
              <p className="body-sm mt-1">
                {uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} to get
                {checkedCount > 0 && ` • ${checkedCount} completed`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
            {items.length > 0 && (
              <>
                {checkedCount > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => { clearCheckedItems(); setItems(getShoppingList()); }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear checked ({checkedCount})
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => { clearShoppingList(); setItems([]); }}
                >
                  <X className="w-4 h-4" />
                  Clear all
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="empty-state">
            <ShoppingCart className="empty-state-icon" />
            <h3 className="empty-state-title">Your list is empty</h3>
            <p className="empty-state-description">
              Add items manually or add ingredients from recipes
            </p>
          </div>
        )}

        {/* List */}
        {items.length > 0 && (
          <div className="space-y-6">
            {/* Unchecked */}
            {uncheckedItems.length > 0 && (
              <div>
                <h2 className="label flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-accent" />
                  To Get ({uncheckedItems.length})
                </h2>
                <div className="space-y-2">
                  {uncheckedItems.map((item) => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      isEditing={editingId === item.id}
                      editQuantity={editQuantity}
                      editNotes={editNotes}
                      onToggle={() => handleToggle(item.id)}
                      onRemove={() => handleRemove(item.id)}
                      onStartEdit={() => handleStartEdit(item)}
                      onSaveEdit={() => handleSaveEdit(item.id)}
                      onCancelEdit={() => { setEditingId(null); setEditQuantity(''); setEditNotes(''); }}
                      onQuantityChange={setEditQuantity}
                      onNotesChange={setEditNotes}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Checked */}
            {checkedItems.length > 0 && (
              <div className="opacity-60">
                <h2 className="label flex items-center gap-2 mb-3 text-text-muted">
                  <Check className="w-4 h-4" />
                  Completed ({checkedItems.length})
                </h2>
                <div className="space-y-2">
                  {checkedItems.map((item) => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      isEditing={editingId === item.id}
                      editQuantity={editQuantity}
                      editNotes={editNotes}
                      onToggle={() => handleToggle(item.id)}
                      onRemove={() => handleRemove(item.id)}
                      onStartEdit={() => handleStartEdit(item)}
                      onSaveEdit={() => handleSaveEdit(item.id)}
                      onCancelEdit={() => { setEditingId(null); setEditQuantity(''); setEditNotes(''); }}
                      onQuantityChange={setEditQuantity}
                      onNotesChange={setEditNotes}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <>
            <div className="modal-backdrop animate-fade-in" onClick={() => setShowAddModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div
                className="modal-content w-full max-w-md p-6 pointer-events-auto animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { setShowAddModal(false); setNewItemName(''); setNewItemQuantity(''); }}
                  className="absolute top-4 right-4 p-2 rounded-md bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <h2 className="heading-3 mb-6 pr-10">Add Item</h2>

                <div className="space-y-4">
                  <Toggle
                    checked={useDropdown}
                    onChange={setUseDropdown}
                    label={useDropdown ? 'From database' : 'Manual entry'}
                  />

                  {useDropdown ? (
                    <>
                      <Select
                        label="Select Ingredient"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        options={[
                          { value: '', label: 'Select...' },
                          ...availableIngredients.map((ing) => ({
                            value: ing,
                            label: ing.charAt(0).toUpperCase() + ing.slice(1),
                          })),
                        ]}
                      />
                      <Input
                        label="Quantity (optional)"
                        placeholder="e.g., 2 lbs, 1 cup"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && newItemName && handleAddItem()}
                      />
                    </>
                  ) : (
                    <>
                      <Input
                        label="Item Name"
                        placeholder="Enter item name..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                      />
                      <Input
                        label="Quantity (optional)"
                        placeholder="e.g., 2 lbs, 1 cup"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && newItemName.trim() && handleAddItem()}
                      />
                    </>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                    <Button variant="ghost" onClick={() => { setShowAddModal(false); setNewItemName(''); setNewItemQuantity(''); }}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddItem} disabled={!newItemName}>
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ShoppingItemProps {
  item: ShoppingListItem;
  isEditing: boolean;
  editQuantity: string;
  editNotes: string;
  onToggle: () => void;
  onRemove: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onQuantityChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

function ShoppingItem({
  item,
  isEditing,
  editQuantity,
  editNotes,
  onToggle,
  onRemove,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onQuantityChange,
  onNotesChange,
}: ShoppingItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border transition-colors',
        item.checked
          ? 'bg-surface border-border-subtle'
          : 'bg-surface-2 border-border-subtle hover:border-border'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          item.checked
            ? 'bg-accent border-accent'
            : 'border-border hover:border-accent'
        )}
      >
        {item.checked && <Check className="w-3 h-3 text-bg" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-2">
            <p className="label">{item.name}</p>
            <Input
              placeholder="Quantity"
              value={editQuantity}
              onChange={(e) => onQuantityChange(e.target.value)}
            />
            <Input
              placeholder="Notes"
              value={editNotes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={onSaveEdit}>Save</Button>
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className={cn('label', item.checked && 'text-text-muted line-through')}>
                  {item.name}
                </p>
                {item.addedFrom && (
                  <p className="caption mt-0.5">From: {item.addedFrom}</p>
                )}
                {item.quantity && (
                  <p className="body-sm text-accent mt-0.5">Qty: {item.quantity}</p>
                )}
                {item.notes && (
                  <p className="body-sm mt-0.5">{item.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onStartEdit}
                  className="p-1.5 rounded-md hover:bg-surface-3 text-text-muted hover:text-text transition-colors"
                  title="Edit"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
                <button
                  onClick={onRemove}
                  className="p-1.5 rounded-md hover:bg-error-subtle text-text-muted hover:text-error transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
