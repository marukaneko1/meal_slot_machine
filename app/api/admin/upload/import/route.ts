import { NextRequest, NextResponse } from 'next/server';
import { importDishesFromCSV } from '@/lib/csv/import';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvContent, updateExisting, importValidOnly } = body as {
      csvContent: string;
      updateExisting: boolean;
      importValidOnly: boolean;
    };

    if (!csvContent) {
      return NextResponse.json(
        { error: 'CSV content is required' },
        { status: 400 }
      );
    }

    const result = await importDishesFromCSV(csvContent, {
      updateExisting: updateExisting ?? false,
      importValidOnly: importValidOnly ?? true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV' },
      { status: 500 }
    );
  }
}
