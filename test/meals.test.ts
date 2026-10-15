import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('../src/speiseplan', async () => {
	const actual = await vi.importActual<typeof import('../src/speiseplan')>('../src/speiseplan');
	return {
		...actual,
		getMenu: vi.fn(),
		getCapacity: vi.fn(),
		getCapacityOutlet: vi.fn(),
	};
});

import MealsAPI, { MealLocation } from '../src';
import {
	getCapacity,
	getCapacityOutlet,
	getMenu,
	type CapacityConfigurationData,
	type CapacityOutletContent,
	type SpeiseplanGerichtData,
	type SpeiseplanLocation,
} from '../src/speiseplan';

const mockedGetMenu = vi.mocked(getMenu);
const mockedGetCapacity = vi.mocked(getCapacity);
const mockedGetCapacityOutlet = vi.mocked(getCapacityOutlet);
const monday = new Date('2026-10-12T00:00:00.000Z');
const tuesday = new Date('2026-10-13T00:00:00.000Z');

function createMeal(id: number, title: string, date: string): SpeiseplanGerichtData {
	return {
		speiseplanAdvancedGericht: {
			id,
			aktiv: true,
			datum: date,
			gerichtkategorieID: 999,
			reihenfolgeInGerichtkategorie: 1,
			gerichtname: title,
			zusatzinformationenID: 0,
			speiseplanAdvancedID: id,
			timestampLog: `${date}T00:00:00.000Z`,
			benutzerID: 1,
		},
		zusatzinformationen: null,
		allergeneIds: '',
		zusatzstoffeIds: null,
		gerichtmerkmaleIds: '',
	};
}

function createLocation(id: number, name: string, meals: SpeiseplanGerichtData[]): SpeiseplanLocation {
	return {
		speiseplanAdvanced: {
			id,
			aktiv: true,
			gueltigTaeglich: false,
			showWeekend: true,
			exportInactiveContent: false,
			titel: name,
			anzeigename: name,
			gueltigVon: '2026-10-01',
			gueltigBis: '2026-10-31',
			reihenfolgeInApp: id,
			speiseplanLayoutTypeID: null,
			vendingMachineID: null,
			orderConfigurationID: null,
			pickupTimeID: null,
			outletID: id,
			timestampLog: '2026-10-01T00:00:00.000Z',
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
				id,
				name,
			},
			holidayInfo: [],
			pickupTimeInfo: [],
		},
		speiseplanGerichtData: meals,
	};
}

const menu = [
	createLocation(1, 'Elbe', [createMeal(11, 'Elbe Monday', '2026-10-12'), createMeal(12, 'Elbe Tuesday', '2026-10-13')]),
	createLocation(2, 'Steelrunner', [createMeal(21, 'Steelrunner Monday', '2026-10-12')]),
	createLocation(3, 'bonprix', [createMeal(31, 'Bonprix Monday', '2026-10-12')]),
	createLocation(4, 'Bistro Boulevard Mittag', [createMeal(41, 'Boulevard Monday', '2026-10-12')]),
];

const capacityConfiguration: CapacityConfigurationData = {
	id: 1,
	maxSitzplaetze: 120,
	durchschnittVerweildauer: 35,
	auswertungszeitraumVon: '11:00',
	auswertungszeitraumBis: '14:00',
	vergleichstag: 1,
	intervall: 15,
	durchschnittsArtikelAnzahl: 2,
	berechnungszeitpunktAusdruck: '*/15 * * * *',
	limitValueLowInteger: 30,
	limitValueMiddleInteger: 60,
	limitValueHighInteger: 90,
	lowRGBColor: '#00ff00',
	middleRGBColor: '#ffff00',
	highRGBColor: '#ff0000',
	outletID: 4,
	timestampLog: '2026-10-12T00:00:00.000Z',
	benutzerID: 1,
};

const outletCapacity: CapacityOutletContent = {
	configuration: {
		maxPersonsCount: 120,
		personsCountThreshold: 100,
		goPictureURL: 'go.png',
		stopPictureURL: 'stop.png',
		showTextualPersonsCount: true,
		lowSignalColor: '#00ff00',
		lowSignalLimitValue: 30,
		middleSignalColor: '#ffff00',
		middleSignalLimitValue: 60,
		highSignalColor: '#ff0000',
		highSignalLimitValue: 90,
	},
	currentData: {
		valueRelative: 0.5,
		unitValueRelative: '%',
		valueAbsolute: 60,
		unitValueAbsolute: 'people',
	},
	historicalData: {
		comparisonDay: '2026-10-05',
		values: [{ value: 55, timestamp: '2026-10-05T12:00:00.000Z' }],
	},
};

beforeEach(() => {
	mockedGetMenu.mockReset();
	mockedGetMenu.mockResolvedValue({ success: true, content: menu });
	mockedGetCapacity.mockReset();
	mockedGetCapacityOutlet.mockReset();
});

test.each([
	{ location: MealLocation.Elbe, title: 'Elbe Monday', canteenName: 'Elbe' },
	{ location: MealLocation.Steelrunner, title: 'Steelrunner Monday', canteenName: 'Steelrunner' },
	{ location: MealLocation.Bonprix, title: 'Bonprix Monday', canteenName: 'bonprix' },
	{ location: MealLocation.Boulevard, title: 'Boulevard Monday', canteenName: 'Bistro Boulevard Mittag' },
])('filters meals for $location.name', async ({ location, title, canteenName }) => {
	const meals = await MealsAPI.getMeals({ start: monday, end: monday, mealLocation: location, format: 'byMeal' });

	expect(meals).toMatchObject([{ title, date: '2026-10-12', canteen: { name: canteenName } }]);
});

test('filters meals by date and supports selecting multiple locations', async () => {
	const meals = await MealsAPI.getMeals({
		start: monday,
		end: tuesday,
		mealLocation: [MealLocation.Elbe, MealLocation.Steelrunner],
		format: 'byMeal',
	});

	expect(meals.map(({ title }) => title)).toEqual(['Elbe Monday', 'Elbe Tuesday', 'Steelrunner Monday']);
});

test('returns meals for all locations and groups them by location when requested', async () => {
	const meals = await MealsAPI.getMeals({ start: monday, end: monday, format: 'byMeal' });
	expect(meals.map(({ title }) => title)).toEqual(['Elbe Monday', 'Steelrunner Monday', 'Bonprix Monday', 'Boulevard Monday']);

	const canteens = await MealsAPI.getMeals({ start: monday, end: monday, format: 'byLocation' });
	expect(canteens.map(({ name, meals: locationMeals }) => [name, locationMeals.map(({ title }) => title)])).toEqual([
		['Elbe', ['Elbe Monday']],
		['Steelrunner', ['Steelrunner Monday']],
		['bonprix', ['Bonprix Monday']],
		['Bistro Boulevard Mittag', ['Boulevard Monday']],
	]);
});

test('returns an empty list when the selected date has no meals', async () => {
	const noMealsDate = new Date('2026-10-14T00:00:00.000Z');

	const meals = await MealsAPI.getMeals({ start: noMealsDate, end: noMealsDate, mealLocation: MealLocation.Elbe, format: 'byMeal' });

	expect(meals).toEqual([]);
});

test('maps capacity configurations', async () => {
	mockedGetCapacity.mockResolvedValue({ success: true, content: [capacityConfiguration] });

	const configurations = await MealsAPI.getCapacityConfigurations();

	expect(configurations).toMatchObject([
		{
			id: 1,
			outletId: 4,
			maxPersonsCount: 120,
			averageDwellTimeMinutes: 35,
			intervalMinutes: 15,
			lowColor: '#00ff00',
			middleColor: '#ffff00',
			highColor: '#ff0000',
		},
	]);
});

test('maps outlet capacity data', async () => {
	mockedGetCapacityOutlet.mockResolvedValue({ success: true, content: outletCapacity });

	const capacity = await MealsAPI.getOutletCapacity(4);

	expect(capacity).toEqual(outletCapacity);
});
