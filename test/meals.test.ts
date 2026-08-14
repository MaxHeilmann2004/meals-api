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

	const mealsElbe = await MealsAPI.getMeals({ start: monday, end: monday, mealLocation: MealLocation.Elbe, format: 'byMeal' });
	expect(mealsElbe.length).toBeGreaterThan(0);
});

test("get meals for 'Steelrunner' monday of this week", async () => {
	const monday = getDateOfCurrentWeek(1);

	const mealsSteelrunner = await MealsAPI.getMeals({
		start: monday,
		end: monday,
		mealLocation: MealLocation.Steelrunner,
		format: 'byMeal',
	});
	expect(mealsSteelrunner).toBeInstanceOf(Array);
});

test("get meals for 'Bonprix' monday of this week", async () => {
	const monday = getDateOfCurrentWeek(1);

	const mealsBonprix = await MealsAPI.getMeals({ start: monday, end: monday, mealLocation: MealLocation.Bonprix, format: 'byMeal' });
	expect(mealsBonprix.length).toBeGreaterThan(0);
});

test("get meals for 'Boulevard' monday of this week", async () => {
	const monday = getDateOfCurrentWeek(1);

	const mealsBoulevard = await MealsAPI.getMeals({ start: monday, end: monday, mealLocation: MealLocation.Boulevard, format: 'byMeal' });
	expect(mealsBoulevard.length).toBeGreaterThan(0);
});

test("get meals for 'Boulevard' and 'Steelrunner' monday of this week", async () => {
	const monday = getDateOfCurrentWeek(1);

	const mealsBoulevardSteelrunner = await MealsAPI.getMeals({
		start: monday,
		end: monday,
		mealLocation: [MealLocation.Boulevard, MealLocation.Steelrunner],
		format: 'byMeal',
	});
	expect(mealsBoulevardSteelrunner).toBeInstanceOf(Array);
});

test('get meals for all locations monday of this week', async () => {
	const monday = getDateOfCurrentWeek(1);

	const mealsAll = await MealsAPI.getMeals({ start: monday, end: monday, format: 'byMeal' });
	expect(mealsAll.length).toBeGreaterThan(0);
});

test("get meals for 'Elbe' for the whole current week", async () => {
	const monday = getDateOfCurrentWeek(1);
	const friday = getDateOfCurrentWeek(5);

	const mealsElbe = await MealsAPI.getMeals({ start: monday, end: friday, mealLocation: MealLocation.Elbe, format: 'byMeal' });
	expect(mealsElbe.length).toBeGreaterThan(0);
});

test('get capacity configuration for canteen outlet id 4', async () => {
	const configurations = await MealsAPI.getCapacityConfigurations();
	const configuration = configurations.find((entry) => entry.outletId === 4);

	expect(configuration).toBeDefined();
	expect(configuration?.intervalMinutes).toBe(15);
	expect(configuration?.maxPersonsCount).toBeGreaterThan(0);
});

test('get outlet capacity for canteen outlet id 4', async () => {
	const capacity = await MealsAPI.getOutletCapacity(4);

	expect(capacity).toBeDefined();
	expect(capacity.currentData).toBeDefined();
	expect(capacity.currentData.valueRelative).toBeGreaterThanOrEqual(0);
	expect(capacity.currentData.valueAbsolute).toBeGreaterThanOrEqual(0);
	expect(capacity.historicalData).toBeDefined();
	expect(capacity.historicalData.values.length).toBeGreaterThan(1);
	expect(capacity.historicalData.values.every((point) => point.value >= 0 && point.timestamp.length > 0)).toBe(true);
});
