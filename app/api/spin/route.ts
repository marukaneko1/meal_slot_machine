import { NextRequest, NextResponse } from 'next/server';
import { generatePlan } from '@/lib/plan/generator';
import type { FilterOptions, LockedDishes, PlanMode } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      filters = {},
      locks = {},
      profileId,
      mode = 'daily',
      seed,
      noRepeatsAcrossWeek = false,
    } = body as {
      filters?: FilterOptions;
      locks?: LockedDishes;
      profileId?: string;
      mode?: PlanMode;
      seed?: string;
      noRepeatsAcrossWeek?: boolean;
    };

    const result = await generatePlan(
      filters,
      mode,
      profileId,
      locks,
      seed,
      noRepeatsAcrossWeek
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        errors: result.errors?.map((e) => ({
          category: e.category,
          message: e.message,
          details: e.details,
        })),
        warnings: result.warnings,
      });
    }

    // For daily mode, return first day's dishes
    if (mode === 'daily' && result.plan?.days.length) {
      return NextResponse.json({
        success: true,
        dishes: result.plan.days[0].dishes,
        seed: result.plan.seed,
        warnings: result.warnings,
      });
    }

    // For weekly mode, return full plan
    return NextResponse.json({
      success: true,
      plan: result.plan,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Spin error:', error);
    return NextResponse.json(
      {
        success: false,
        errors: [{ message: 'Internal server error' }],
      },
      { status: 500 }
    );
  }
}
