// File: app/api/meals/route.ts

import { getAllDetailedMeals } from '@/lib/meals_api';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const meals = await getAllDetailedMeals()
    return NextResponse.json(meals);
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}