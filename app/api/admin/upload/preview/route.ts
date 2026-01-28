import { NextRequest, NextResponse } from 'next/server';
import { previewCSVImport } from '@/lib/csv/import';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvContent } = body as { csvContent: string };

    if (!csvContent) {
      return NextResponse.json(
        { error: 'CSV content is required' },
        { status: 400 }
      );
    }

    const preview = await previewCSVImport(csvContent);
    return NextResponse.json(preview);
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: 'Failed to preview CSV' },
      { status: 500 }
    );
  }
}
