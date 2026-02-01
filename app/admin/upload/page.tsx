'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { CSVValidationResult, ImportResult } from '@/lib/types';
import { SLOT_CATEGORY_LABELS, SLOT_CATEGORIES, KOSHER_STYLES, DIFFICULTY_LEVELS, STANDARD_ALLERGENS, type SlotCategory } from '@/lib/types';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowRight,
  Plus,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Validates if a URL is an absolute URL (starts with http:// or https://)
 */
function isValidAbsoluteUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

interface PreviewData {
  headers: string[];
  validationResults: CSVValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

type Step = 'upload' | 'preview' | 'importing' | 'complete';
type Tab = 'csv' | 'manual';

export default function AdminUploadPage() {
  const [tab, setTab] = useState<Tab>('csv');
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    name: '',
    slotCategory: 'main_chicken' as SlotCategory,
    ingredients: '',
    kosher: false,
    kosherStyle: 'unknown' as typeof KOSHER_STYLES[number],
    difficulty: 'unknown' as typeof DIFFICULTY_LEVELS[number],
    mainProtein: '',
    prepTimeMinutes: '',
    cookTimeMinutes: '',
    servings: '',
    cuisine: '',
    tags: '',
    allergens: [] as string[],
    notes: '',
    sourceUrl: '',
  });
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    try {
      const content = await selectedFile.text();
      setCsvContent(content);
      setIsLoading(true);

      const response = await fetch('/api/admin/upload/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to preview CSV');
      }

      const data = await response.json();
      setPreviewData(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.name.endsWith('.csv')) {
        handleFileSelect(droppedFile);
      } else {
        setError('Please drop a CSV file');
      }
    },
    [handleFileSelect]
  );

  const handleImport = async () => {
    if (!csvContent) return;

    setStep('importing');
    setError(null);

    try {
      const response = await fetch('/api/admin/upload/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent,
          updateExisting,
          importValidOnly: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setImportResult(result);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setCsvContent('');
    setPreviewData(null);
    setImportResult(null);
    setError(null);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingManual(true);
    setError(null);
    setManualSuccess(false);

    try {
      // Parse ingredients and tags from comma-separated strings
      const ingredients = manualForm.ingredients
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);
      const tags = manualForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // Validate sourceUrl if provided
      let sourceUrl = manualForm.sourceUrl?.trim() || null;
      if (sourceUrl && !isValidAbsoluteUrl(sourceUrl)) {
        setError('Source URL must be a full URL starting with http:// or https://');
        setIsSavingManual(false);
        return;
      }

      const response = await fetch('/api/admin/dishes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualForm.name,
          slotCategory: manualForm.slotCategory,
          ingredients,
          kosher: manualForm.kosher,
          kosherStyle: manualForm.kosherStyle,
          difficulty: manualForm.difficulty,
          mainProtein: manualForm.mainProtein || null,
          prepTimeMinutes: manualForm.prepTimeMinutes || null,
          cookTimeMinutes: manualForm.cookTimeMinutes || null,
          servings: manualForm.servings || null,
          cuisine: manualForm.cuisine || null,
          tags,
          allergens: manualForm.allergens,
          notes: manualForm.notes || null,
          sourceUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create dish');
      }

      setManualSuccess(true);
      // Reset form
      setManualForm({
        name: '',
        slotCategory: 'main_chicken',
        ingredients: '',
        kosher: false,
        kosherStyle: 'unknown',
        difficulty: 'unknown',
        mainProtein: '',
        prepTimeMinutes: '',
        cookTimeMinutes: '',
        servings: '',
        cuisine: '',
        tags: '',
        allergens: [],
        notes: '',
        sourceUrl: '',
      });

      setTimeout(() => setManualSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dish');
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <div className="min-h-screen pt-6 pb-24 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Upload className="w-8 h-8 text-slot-purple" />
            Add Dishes
          </h1>
          <p className="text-gray-400 mt-2">
            Upload CSV files or manually add dishes to your library
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setTab('csv')}
            className={cn(
              'px-6 py-3 font-medium transition-colors border-b-2',
              tab === 'csv'
                ? 'border-slot-gold text-slot-gold'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            )}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            CSV Import
          </button>
          <button
            onClick={() => setTab('manual')}
            className={cn(
              'px-6 py-3 font-medium transition-colors border-b-2',
              tab === 'manual'
                ? 'border-slot-gold text-slot-gold'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            )}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Manual Entry
          </button>
        </div>

        {/* Progress Steps - Only show for CSV import */}
        {tab === 'csv' && (
          <div className="flex items-center justify-center gap-4 mb-8">
            {(['upload', 'preview', 'complete'] as const).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm',
                  step === s || (step === 'importing' && s === 'preview')
                    ? 'bg-slot-purple text-white'
                    : step === 'complete' || (step === 'preview' && s === 'upload')
                    ? 'bg-green-500 text-white'
                    : 'bg-slot-accent text-gray-500'
                )}
              >
                {step === 'complete' || (step !== 'upload' && s === 'upload') ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  'ml-2 text-sm font-medium',
                  step === s ? 'text-white' : 'text-gray-500'
                )}
              >
                {s === 'upload' ? 'Upload' : s === 'preview' ? 'Preview' : 'Complete'}
              </span>
              {i < 2 && (
                <ArrowRight className="w-4 h-4 mx-4 text-gray-600" />
              )}
            </div>
          ))}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Manual Entry Form */}
        {tab === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle>Add Dish Manually</CardTitle>
            </CardHeader>
            <CardContent>
              {manualSuccess && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-400">Dish created successfully! &quot;manually added&quot; tag was automatically added.</p>
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <Input
                      label="Dish Name *"
                      value={manualForm.name}
                      onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                      required
                      placeholder="e.g., Chicken Schnitzel"
                    />
                  </div>

                  {/* Slot Category */}
                  <Select
                    label="Slot Category *"
                    value={manualForm.slotCategory}
                    onChange={(e) => setManualForm({ ...manualForm, slotCategory: e.target.value as SlotCategory })}
                    options={SLOT_CATEGORIES.map((cat) => ({
                      value: cat,
                      label: SLOT_CATEGORY_LABELS[cat],
                    }))}
                    required
                  />

                  {/* Kosher */}
                  <div>
                    <label className="block text-sm font-medium text-slot-gold mb-1.5">
                      Kosher
                    </label>
                    <Toggle
                      checked={manualForm.kosher}
                      onChange={(checked) => setManualForm({ ...manualForm, kosher: checked })}
                      label={manualForm.kosher ? 'Yes' : 'No'}
                    />
                  </div>

                  {/* Kosher Style */}
                  <Select
                    label="Kosher Style"
                    value={manualForm.kosherStyle}
                    onChange={(e) => setManualForm({ ...manualForm, kosherStyle: e.target.value as typeof KOSHER_STYLES[number] })}
                    options={KOSHER_STYLES.map((style) => ({
                      value: style,
                      label: style.charAt(0).toUpperCase() + style.slice(1),
                    }))}
                  />

                  {/* Difficulty */}
                  <Select
                    label="Difficulty"
                    value={manualForm.difficulty}
                    onChange={(e) => setManualForm({ ...manualForm, difficulty: e.target.value as typeof DIFFICULTY_LEVELS[number] })}
                    options={DIFFICULTY_LEVELS.map((diff) => ({
                      value: diff,
                      label: diff.charAt(0).toUpperCase() + diff.slice(1),
                    }))}
                  />

                  {/* Main Protein */}
                  <Input
                    label="Main Protein"
                    value={manualForm.mainProtein}
                    onChange={(e) => setManualForm({ ...manualForm, mainProtein: e.target.value })}
                    placeholder="e.g., chicken, beef, fish"
                  />

                  {/* Cuisine */}
                  <Input
                    label="Cuisine"
                    value={manualForm.cuisine}
                    onChange={(e) => setManualForm({ ...manualForm, cuisine: e.target.value })}
                    placeholder="e.g., Italian, Asian"
                  />

                  {/* Prep Time */}
                  <Input
                    label="Prep Time (minutes)"
                    type="number"
                    value={manualForm.prepTimeMinutes}
                    onChange={(e) => setManualForm({ ...manualForm, prepTimeMinutes: e.target.value })}
                    placeholder="15"
                  />

                  {/* Cook Time */}
                  <Input
                    label="Cook Time (minutes)"
                    type="number"
                    value={manualForm.cookTimeMinutes}
                    onChange={(e) => setManualForm({ ...manualForm, cookTimeMinutes: e.target.value })}
                    placeholder="30"
                  />

                  {/* Servings */}
                  <Input
                    label="Servings"
                    type="number"
                    value={manualForm.servings}
                    onChange={(e) => setManualForm({ ...manualForm, servings: e.target.value })}
                    placeholder="4"
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <Input
                    label="Ingredients (comma-separated) *"
                    value={manualForm.ingredients}
                    onChange={(e) => setManualForm({ ...manualForm, ingredients: e.target.value })}
                    required
                    placeholder="chicken breast, breadcrumbs, eggs, flour"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple ingredients with commas</p>
                </div>

                {/* Tags */}
                <div>
                  <Input
                    label="Tags (comma-separated)"
                    value={manualForm.tags}
                    onChange={(e) => setManualForm({ ...manualForm, tags: e.target.value })}
                    placeholder="quick, comfort food, crispy"
                  />
                  <p className="text-xs text-gray-500 mt-1">&quot;manually added&quot; tag will be added automatically</p>
                </div>

                {/* Allergens */}
                <div>
                  <label className="block text-sm font-medium text-slot-gold mb-2">
                    Allergens
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STANDARD_ALLERGENS.map((allergen) => (
                      <label key={allergen} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={manualForm.allergens.includes(allergen)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setManualForm({
                                ...manualForm,
                                allergens: [...manualForm.allergens, allergen],
                              });
                            } else {
                              setManualForm({
                                ...manualForm,
                                allergens: manualForm.allergens.filter((a) => a !== allergen),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-slot-gold/50 text-slot-gold focus:ring-slot-gold"
                        />
                        <span className="text-sm text-gray-300 capitalize">{allergen}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slot-gold mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={manualForm.notes}
                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                    className="input-field w-full min-h-[100px] resize-y"
                    placeholder="Additional notes about this dish..."
                  />
                </div>

                {/* Source URL */}
                <div>
                  <Input
                    label="Source URL"
                    type="url"
                    value={manualForm.sourceUrl}
                    onChange={(e) => setManualForm({ ...manualForm, sourceUrl: e.target.value })}
                    placeholder="https://example.com/recipe"
                  />
                  <p className="text-xs text-gray-500 mt-1">Link to the original recipe source</p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-700">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSavingManual || !manualForm.name || !manualForm.slotCategory || !manualForm.ingredients}
                    isLoading={isSavingManual}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingManual ? 'Saving...' : 'Save Dish'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* CSV Upload Steps */}
        {tab === 'csv' && (
          <>
        {/* Upload Step */}
        {step === 'upload' && (
          <Card>
            <CardContent className="pt-6">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-12 text-center transition-colors',
                  'border-slot-accent hover:border-slot-purple'
                )}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-lg font-medium mb-2">
                  Drop your CSV file here
                </p>
                <p className="text-gray-500 mb-4">or</p>
                <label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f);
                    }}
                    className="hidden"
                  />
                  <Button variant="primary" isLoading={isLoading}>
                    <FileText className="w-4 h-4" />
                    Choose File
                  </Button>
                </label>
              </div>

              {/* CSV Format Help */}
              <div className="mt-8 p-4 bg-slot-accent/30 rounded-xl">
                <h3 className="font-semibold mb-3">Expected CSV Format</h3>
                <p className="text-sm text-gray-400 mb-2">Required columns:</p>
                <code className="text-xs text-slot-purple">name, slot_category</code>
                <p className="text-sm text-gray-400 mt-3 mb-2">Optional columns:</p>
                <code className="text-xs text-gray-500">
                  ingredients, kosher, kosher_style, difficulty, main_protein,
                  prep_time_minutes, cook_time_minutes, servings, cuisine, tags,
                  contains_allergens, notes, source_url
                </code>
                <p className="text-sm text-gray-400 mt-3 mb-2">Valid slot_category values:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SLOT_CATEGORY_LABELS).map(([key, label]) => (
                    <span
                      key={key}
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        `badge-${key}`
                      )}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Step */}
        {step === 'preview' && previewData && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Preview Summary</span>
                  <span className="text-sm font-normal text-gray-400">
                    {file?.name}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-slot-accent/30 rounded-xl">
                    <p className="text-3xl font-bold">{previewData.summary.total}</p>
                    <p className="text-sm text-gray-400">Total Rows</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-xl">
                    <p className="text-3xl font-bold text-green-400">
                      {previewData.summary.valid}
                    </p>
                    <p className="text-sm text-gray-400">Valid</p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-xl">
                    <p className="text-3xl font-bold text-red-400">
                      {previewData.summary.invalid}
                    </p>
                    <p className="text-sm text-gray-400">Errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle>Import Options</CardTitle>
              </CardHeader>
              <CardContent>
                <Toggle
                  checked={updateExisting}
                  onChange={setUpdateExisting}
                  label="Update existing dishes (by name + category)"
                />
                <p className="text-sm text-gray-500 mt-2">
                  If enabled, dishes with matching name and category will be updated.
                  Otherwise, duplicates will be skipped.
                </p>
              </CardContent>
            </Card>

            {/* Error Details */}
            {previewData.summary.invalid > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    Validation Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-auto space-y-2">
                    {previewData.validationResults
                      .filter((r) => !r.valid)
                      .map((r) => (
                        <div
                          key={r.row}
                          className="p-3 bg-red-500/10 rounded-lg text-sm"
                        >
                          <span className="font-medium text-red-400">
                            Row {r.row}:
                          </span>{' '}
                          <span className="text-gray-400">
                            {r.errors.join(', ')}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Valid Rows Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Valid Rows Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="table-container max-h-96 overflow-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Kosher</th>
                        <th>Ingredients</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.validationResults
                        .filter((r) => r.valid && r.data)
                        .slice(0, 20)
                        .map((r) => (
                          <tr key={r.row}>
                            <td>{r.row}</td>
                            <td className="font-medium text-white">
                              {r.data!.name}
                            </td>
                            <td>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-xs font-medium',
                                  `badge-${r.data!.slotCategory}`
                                )}
                              >
                                {SLOT_CATEGORY_LABELS[r.data!.slotCategory as SlotCategory]}
                              </span>
                            </td>
                            <td>
                              {r.data!.kosher ? (
                                <span className="text-green-400">✓</span>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                            <td className="text-gray-400 text-xs">
                              {r.data!.ingredients.slice(0, 3).join(', ')}
                              {r.data!.ingredients.length > 3 && '...'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {previewData.summary.valid > 20 && (
                    <p className="p-3 text-center text-sm text-gray-500">
                      Showing first 20 of {previewData.summary.valid} valid rows
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleReset}>
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={previewData.summary.valid === 0}
              >
                Import {previewData.summary.valid} Dishes
              </Button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 border-4 border-slot-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">Importing dishes...</p>
              <p className="text-gray-400 text-sm mt-2">
                This may take a moment for large files
              </p>
            </CardContent>
          </Card>
        )}

        {/* Complete Step */}
        {step === 'complete' && importResult && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold">Import Complete!</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
                <div className="p-4 bg-slot-accent/30 rounded-xl">
                  <p className="text-2xl font-bold">{importResult.totalRows}</p>
                  <p className="text-sm text-gray-400">Total Rows</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-xl">
                  <p className="text-2xl font-bold text-green-400">
                    {importResult.imported}
                  </p>
                  <p className="text-sm text-gray-400">Created</p>
                </div>
                <div className="p-4 bg-blue-500/10 rounded-xl">
                  <p className="text-2xl font-bold text-blue-400">
                    {importResult.updated}
                  </p>
                  <p className="text-sm text-gray-400">Updated</p>
                </div>
                <div className="p-4 bg-yellow-500/10 rounded-xl">
                  <p className="text-2xl font-bold text-yellow-400">
                    {importResult.skipped}
                  </p>
                  <p className="text-sm text-gray-400">Skipped</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    Import Errors
                  </h3>
                  <div className="max-h-40 overflow-auto space-y-2">
                    {importResult.errors.map((err, i) => (
                      <div
                        key={i}
                        className="p-2 bg-red-500/10 rounded text-sm text-gray-400"
                      >
                        Row {err.row}: {err.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                <Button variant="secondary" onClick={handleReset}>
                  Import Another File
                </Button>
                <Button
                  variant="primary"
                  onClick={() => (window.location.href = '/library')}
                >
                  View Library
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>
    </div>
  );
}
