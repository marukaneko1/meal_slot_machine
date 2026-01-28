import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generatePlan, savePlan, getPlans } from '@/lib/plan/generator';
import type { FilterOptions, PlanMode } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const plans = await getPlans(limit, offset);
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If dishes are provided directly (from spin page save)
    if (body.dishes) {
      const { dishes, profileId, mode = 'daily' } = body as {
        dishes: { category: string; dishId: string; dayIndex: number }[];
        profileId?: string;
        mode?: string;
      };

      const plan = await prisma.$transaction(async (tx) => {
        const newPlan = await tx.plan.create({
          data: {
            profileId,
            mode,
            startDate: new Date(),
          },
        });

        await tx.planItem.createMany({
          data: dishes.map((d) => ({
            planId: newPlan.id,
            slotCategory: d.category,
            dishId: d.dishId,
            dayIndex: d.dayIndex,
          })),
        });

        return newPlan;
      });

      return NextResponse.json({ success: true, planId: plan.id });
    }

    // Generate a new plan
    const {
      filters = {},
      profileId,
      mode = 'daily',
      seed,
      noRepeatsAcrossWeek = true,
      startDate,
    } = body as {
      filters?: FilterOptions;
      profileId?: string;
      mode?: PlanMode;
      seed?: string;
      noRepeatsAcrossWeek?: boolean;
      startDate?: string;
    };

    const result = await generatePlan(
      filters,
      mode,
      profileId,
      {},
      seed,
      noRepeatsAcrossWeek
    );

    if (!result.success || !result.plan) {
      return NextResponse.json({
        success: false,
        errors: result.errors,
        warnings: result.warnings,
      });
    }

    // Save the plan
    const saveResult = await savePlan(
      result.plan,
      startDate ? new Date(startDate) : new Date()
    );

    if (!saveResult.success) {
      return NextResponse.json({
        success: false,
        errors: [{ message: saveResult.error }],
      });
    }

    return NextResponse.json({
      success: true,
      planId: saveResult.planId,
      plan: result.plan,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
