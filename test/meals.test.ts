import { expect, test } from 'vitest';
import MealsAPI, { MealLocation } from '../src';

/**
 * Returns the Date object for the specified day of the current week.
 *
 * @param dayOfWeek - The day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @param referenceDate - (Optional) The reference date to determine the week. Defaults to today.
 * @returns The Date object representing the specified day of the current week.
 *
 * @example
 * // Get the date for Wednesday (3) of the current week
 * const wednesday = getDateOfCurrentWeek(3);
 */
export function getDateOfCurrentWeek(dayOfWeek: number, referenceDate: Date = new Date()): Date {
	const currentDay = referenceDate.getDay();
	const diff = dayOfWeek - currentDay;
	const result = new Date(referenceDate);
	result.setDate(referenceDate.getDate() + diff);
	return result;
}

test("get meals for 'Elbe' monday of this week", async () => {
	const monday = getDateOfCurrentWeek(1);

	const mealsElbe = await MealsAPI.getMeals(monday, monday, MealLocation.Elbe);
	expect(mealsElbe.length).toBeGreaterThan(0);
});

test("get meals for 'Steelrunner' monday of this week", async () => {
	const monday = getDateOfCurrentWeek(1);

	const mealsSteelrunner = await MealsAPI.getMeals(monday, monday, MealLocation.Steelrunner);
	expect(mealsSteelrunner).toBeInstanceOf(Array);
});

test("get meals for 'Bonprix' monday of this week", async () => {
	const monday = getDateOfCurrentWeek(1);

	const mealsBonprix = await MealsAPI.getMeals(monday, monday, MealLocation.Bonprix);
	expect(mealsBonprix.length).toBeGreaterThan(0);
});

test("get meals for 'Boulevard' monday of this week", async () => {
	const monday = getDateOfCurrentWeek(1);

	const mealsBoulevard = await MealsAPI.getMeals(monday, monday, MealLocation.Boulevard);
	expect(mealsBoulevard.length).toBeGreaterThan(0);
});

test("get meals for 'Boulevard' and 'Steelrunner' monday of this week", async () => {
	const monday = getDateOfCurrentWeek(1);

	const mealsBoulevardSteelrunner = await MealsAPI.getMeals(monday, monday, [MealLocation.Boulevard, MealLocation.Steelrunner]);
	expect(mealsBoulevardSteelrunner).toBeInstanceOf(Array);
});

test('get meals for all locations monday of this week', async () => {
	const monday = getDateOfCurrentWeek(1);

	const mealsAll = await MealsAPI.getMeals(monday, monday);
	expect(mealsAll.length).toBeGreaterThan(0);
});

test("get meals for 'Elbe' for the whole current week", async () => {
	const monday = getDateOfCurrentWeek(1);
	const friday = getDateOfCurrentWeek(5);

	const mealsElbe = await MealsAPI.getMeals(monday, friday, MealLocation.Elbe);
	expect(mealsElbe.length).toBeGreaterThan(0);
});

test("get outlet capacity for canteen outlet id 4", async () => {
	const capacity = await MealsAPI.getOutletCapacity(4);

	expect(capacity).toBeDefined();
	expect(capacity.currentData).toBeDefined();
	expect(capacity.historicalData).toBeDefined();
	expect(Array.isArray(capacity.historicalData.values)).toBe(true);
});
