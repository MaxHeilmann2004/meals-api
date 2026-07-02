import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('../src/speiseplan', async () => {
	const actual = await vi.importActual<typeof import('../src/speiseplan')>('../src/speiseplan');
	return {
		...actual,
		getMenu: vi.fn(),
	};
});

import MealsAPI from '../src';
import { getMenu } from '../src/speiseplan';

const mockedGetMenu = vi.mocked(getMenu);

beforeEach(() => {
	mockedGetMenu.mockReset();
});

function createMeal(mealId: number, title: string, active: boolean) {
	return {
		speiseplanAdvancedGericht: {
			id: mealId,
			aktiv: active,
			datum: '2026-07-02',
			gerichtkategorieID: 999,
			reihenfolgeInGerichtkategorie: 1,
			gerichtname: title,
			zusatzinformationenID: 0,
			speiseplanAdvancedID: 8,
			timestampLog: '2026-07-02T00:00:00.000Z',
			benutzerID: 1,
		},
		zusatzinformationen: null,
		allergeneIds: '',
		zusatzstoffeIds: null,
		gerichtmerkmaleIds: '',
	};
}

function createLocation(canteenId: number, name: string, active: boolean, meals: ReturnType<typeof createMeal>[]) {
	return {
		speiseplanAdvanced: {
			id: canteenId,
			aktiv: active,
			gueltigTaeglich: false,
			showWeekend: true,
			exportInactiveContent: false,
			titel: name,
			anzeigename: name,
			gueltigVon: '2026-06-30',
			gueltigBis: '2026-07-31',
			reihenfolgeInApp: 1,
			speiseplanLayoutTypeID: null,
			vendingMachineID: null,
			orderConfigurationID: null,
			pickupTimeID: null,
			outletID: 4,
			timestampLog: '2026-07-02T00:00:00.000Z',
			benutzerID: 1,
			orderInfo: {
				orderAllowed: false,
				preOrderAllowed: false,
				instantOrderAllowed: false,
				shippingAllowed: false,
				deliveryAssortment: false,
				instantOrderMinimumOrderValue: null,
				preOrderMinimumOrderValue: null,
				shippingOrderMinimumOrderValue: null,
				shippingCostFlatrate: null,
				shippingCostThreshold: null,
				postalCodeVerification: false,
				reusableProvider: false,
				reusableProviderId: null,
				allowedOrderProcesses: [],
				scan2go: false,
			},
			locationInfo: {
				id: 1800,
				name: 'Main Campus',
			},
		},
		speiseplanGerichtData: meals,
	};
}

test('keeps inactive meals and inactive canteens and exposes activity flags', async () => {
	mockedGetMenu.mockResolvedValue({
		success: true,
		content: [
			createLocation(8, 'Elbe', true, [createMeal(1, 'Visible Meal', true), createMeal(2, 'Hidden Meal', false)]),
			createLocation(9, 'Inactive Canteen', false, [createMeal(3, 'Should Not Appear', true)]),
		],
	} as unknown as Awaited<ReturnType<typeof getMenu>>);

	const meals = await MealsAPI.getMeals({ format: 'byMeal' });
	expect(meals).toHaveLength(3);
	expect(meals[0]?.title).toBe('Visible Meal');
	expect(meals[0]?.isActive).toBe(true);
	expect(meals[1]?.title).toBe('Hidden Meal');
	expect(meals[1]?.isActive).toBe(false);
	expect(meals[2]?.title).toBe('Should Not Appear');
	expect(meals[2]?.canteen.isActive).toBe(false);

	const canteens = await MealsAPI.getMeals({ format: 'byLocation' });
	expect(canteens).toHaveLength(2);
	expect(canteens[0]?.name).toBe('Elbe');
	expect(canteens[0]?.isActive).toBe(true);
	expect(canteens[0]?.meals).toHaveLength(2);
	expect(canteens[0]?.meals[0]?.title).toBe('Visible Meal');
	expect(canteens[0]?.meals[1]?.title).toBe('Hidden Meal');
	expect(canteens[0]?.meals[1]?.isActive).toBe(false);
	expect(canteens[1]?.name).toBe('Inactive Canteen');
	expect(canteens[1]?.isActive).toBe(false);
	expect(canteens[1]?.meals).toHaveLength(1);
});
