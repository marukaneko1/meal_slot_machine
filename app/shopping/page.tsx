'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Check, X, Trash2, Plus, Minus, AlertCircle, RotateCcw } from 'lucide-react';
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
  
  // Undo state
  const [undoState, setUndoState] = useState<{
    show: boolean;
    deletedItem: ShoppingListItem | null;
  }>({ show: false, deletedItem: null });

  // Load items and listen for updates
  useEffect(() => {
    const loadItems = () => {
      setItems(getShoppingList());
    };

    loadItems();

    // Listen for updates from other tabs/components
    window.addEventListener('shopping-list-updated', loadItems);
    return () => window.removeEventListener('shopping-list-updated', loadItems);
  }, []);

  // Load available ingredients for dropdown
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

  // Auto-hide undo notification after 15 seconds
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
    
    // Check if already exists
    const exists = currentList.some(
      (item) => item.name.toLowerCase() === normalizedName
    );

    if (exists) {
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

    // Remove item
    removeShoppingListItem(id);
    setItems(getShoppingList());

    // Show undo notification
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

  const handleClearChecked = () => {
    clearCheckedItems();
    setItems(getShoppingList());
  };

  const handleClearAll = () => {
    clearShoppingList();
    setItems([]);
  };

  const checkedCount = items.filter((item) => item.checked).length;
  const uncheckedCount = items.filter((item) => !item.checked).length;

  // Group items by checked status
  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  return (
    <div className="min-h-screen bg-black text-white pt-6 pb-24 px-4 md:pt-8 md:pb-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Undo Notification */}
        {undoState.show && undoState.deletedItem && (
          <div className="mb-4 p-4 bg-slate-800 border border-slot-gold/50 rounded-lg flex items-center justify-between animate-in slide-in-from-top">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-slot-gold" />
              <span className="text-white">
                Removed <span className="font-semibold">{undoState.deletedItem.name}</span>
              </span>
            </div>
            <Button
              variant="primary"
              onClick={handleUndo}
              className="text-sm px-4 py-1.5"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Undo
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slot-gold to-yellow-600 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-slot-bg" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slot-gold">
                Shopping List
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} to get
                {checkedCount > 0 && ` • ${checkedCount} completed`}
              </p>
            </div>
          </div>

          {/* Add Button */}
          <div className="mb-4">
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              className="px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Action Buttons */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {checkedCount > 0 && (
                <Button
                  variant="secondary"
                  onClick={handleClearChecked}
                  className="text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Checked ({checkedCount})
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={handleClearAll}
                className="text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-16 px-4">
            <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">
              Your shopping list is empty
            </h2>
            <p className="text-gray-500 text-sm">
              Add items manually or add ingredients from recipes
            </p>
          </div>
        )}

        {/* Shopping List Items */}
        {items.length > 0 && (
          <div className="space-y-4">
            {/* Unchecked Items */}
            {uncheckedItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slot-gold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  To Get ({uncheckedItems.length})
                </h2>
                <div className="space-y-2">
                  {uncheckedItems.map((item) => (
                    <ShoppingListItem
                      key={item.id}
                      item={item}
                      isEditing={editingId === item.id}
                      editQuantity={editQuantity}
                      editNotes={editNotes}
                      onToggle={() => handleToggle(item.id)}
                      onRemove={() => handleRemove(item.id)}
                      onStartEdit={() => handleStartEdit(item)}
                      onSaveEdit={() => handleSaveEdit(item.id)}
                      onCancelEdit={() => {
                        setEditingId(null);
                        setEditQuantity('');
                        setEditNotes('');
                      }}
                      onQuantityChange={setEditQuantity}
                      onNotesChange={setEditNotes}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Checked Items */}
            {checkedItems.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-500 mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Completed ({checkedItems.length})
                </h2>
                <div className="space-y-2 opacity-60">
                  {checkedItems.map((item) => (
                    <ShoppingListItem
                      key={item.id}
                      item={item}
                      isEditing={editingId === item.id}
                      editQuantity={editQuantity}
                      editNotes={editNotes}
                      onToggle={() => handleToggle(item.id)}
                      onRemove={() => handleRemove(item.id)}
                      onStartEdit={() => handleStartEdit(item)}
                      onSaveEdit={() => handleSaveEdit(item.id)}
                      onCancelEdit={() => {
                        setEditingId(null);
                        setEditQuantity('');
                        setEditNotes('');
                      }}
                      onQuantityChange={setEditQuantity}
                      onNotesChange={setEditNotes}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Item Modal */}
        {showAddModal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
              onClick={() => setShowAddModal(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div
                className={cn(
                  'relative w-full max-w-md',
                  'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900',
                  'rounded-2xl border-2 border-slot-gold/50 shadow-2xl',
                  'overflow-hidden pointer-events-auto',
                  'animate-bounce-in'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewItemName('');
                    setNewItemQuantity('');
                  }}
                  className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-6 pr-10">
                    Add Item to Shopping List
                  </h2>

                  <div className="space-y-4">
                    {/* Toggle between manual input and dropdown */}
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={useDropdown}
                        onChange={setUseDropdown}
                        label={useDropdown ? 'From Database' : 'Manual Entry'}
                      />
                    </div>

                    {useDropdown ? (
                      <div className="space-y-4">
                        <Select
                          label="Select Ingredient"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          options={[
                            { value: '', label: 'Select an ingredient...' },
                            ...availableIngredients.map((ing) => ({
                              value: ing,
                              label: ing.charAt(0).toUpperCase() + ing.slice(1),
                            })),
                          ]}
                        />
                        <Input
                          label="Quantity (optional)"
                          type="text"
                          placeholder="e.g., 2 lbs, 1 cup, 500g"
                          value={newItemQuantity}
                          onChange={(e) => setNewItemQuantity(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newItemName) {
                              handleAddItem();
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Input
                          label="Item Name"
                          type="text"
                          placeholder="Enter item name..."
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddItem();
                            }
                          }}
                        />
                        <Input
                          label="Quantity (optional)"
                          type="text"
                          placeholder="e.g., 2 lbs, 1 cup, 500g"
                          value={newItemQuantity}
                          onChange={(e) => setNewItemQuantity(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newItemName.trim()) {
                              handleAddItem();
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowAddModal(false);
                          setNewItemName('');
                          setNewItemQuantity('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleAddItem}
                        disabled={!newItemName || (useDropdown && !newItemName)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to List
                      </Button>
                    </div>
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

interface ShoppingListItemProps {
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

function ShoppingListItem({
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
}: ShoppingListItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border transition-all',
        item.checked
          ? 'bg-slate-900/50 border-slate-700/50'
          : 'bg-slate-900 border-slot-gold/30 hover:border-slot-gold/50'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          'mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
          item.checked
            ? 'bg-slot-gold border-slot-gold'
            : 'border-slot-gold/50 hover:border-slot-gold'
        )}
      >
        {item.checked && <Check className="w-3 h-3 text-slot-bg" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-2">
            <div className="font-medium text-white">{item.name}</div>
            <Input
              type="text"
              placeholder="Quantity (e.g., 2 lbs, 1 cup)"
              value={editQuantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              className="text-sm"
            />
            <Input
              type="text"
              placeholder="Notes (optional)"
              value={editNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={onSaveEdit}
                className="text-xs px-3 py-1"
              >
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={onCancelEdit}
                className="text-xs px-3 py-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div
                  className={cn(
                    'font-medium',
                    item.checked ? 'text-gray-500 line-through' : 'text-white'
                  )}
                >
                  {item.name}
                </div>
                {item.addedFrom && (
                  <div className="text-xs text-gray-500 mt-1">
                    From: {item.addedFrom}
                  </div>
                )}
                {item.quantity && (
                  <div className="text-sm text-slot-gold mt-1">
                    Qty: {item.quantity}
                  </div>
                )}
                {item.notes && (
                  <div className="text-sm text-gray-400 mt-1">{item.notes}</div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onStartEdit}
                  className="p-1.5 rounded hover:bg-slate-800 text-gray-400 hover:text-slot-gold transition-colors"
                  title="Edit"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
                <button
                  onClick={onRemove}
                  className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
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
