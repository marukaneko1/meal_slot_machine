'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import type { CSVValidationResult, ImportResult } from '@/lib/types';
import { SLOT_CATEGORY_LABELS, type SlotCategory } from '@/lib/types';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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

export default function AdminUploadPage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Upload className="w-8 h-8 text-slot-purple" />
            CSV Import
          </h1>
          <p className="text-gray-400 mt-2">
            Upload a CSV file to import dishes into your library
          </p>
        </div>

        {/* Progress Steps */}
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
      </div>
    </div>
  );
}
