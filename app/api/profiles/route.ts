import { NextRequest, NextResponse } from 'next/server';
import { getProfiles, createProfile, ensureDefaultProfile } from '@/lib/db/profiles';
import type { SlotCategory } from '@/lib/types';

export async function GET() {
  try {
    // Ensure default profile exists
    await ensureDefaultProfile();
    
    const profiles = await getProfiles();
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, categories, description } = body as {
      name: string;
      categories: SlotCategory[];
      description?: string;
    };

    if (!name || !categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'Name and categories are required' },
        { status: 400 }
      );
    }

    const profile = await createProfile(name, categories, description);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}
