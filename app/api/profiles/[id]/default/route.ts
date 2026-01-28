import { NextRequest, NextResponse } from 'next/server';
import { setDefaultProfile } from '@/lib/db/profiles';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await setDefaultProfile(id);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error setting default profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set default' },
      { status: 500 }
    );
  }
}
