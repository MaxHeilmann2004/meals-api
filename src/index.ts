import {
	type _Allergen,
	type CapacityConfigurationData,
	type CapacityOutletContent,
	type CapacityOutletCurrentData,
	type CapacityOutletHistoricalValue,
	type Gerichtsmerkmal,
	getAllAdditives,
	getAllAllergens,
	getCapacity,
	getCapacityOutlet,
	getAllFeatures,
	getMenu,
	type SpeiseplanAdvanced,
	type SpeiseplanGerichtData,
	type SpeiseplanLocation,
	type Zusatzinformationen,
	type Zusatzstoff,
} from './speiseplan';
import hashing from './utils/hashing';

const STUDENT_DISCOUNT_INDEX: Array<{ categories: number[]; discount: number }> = [
	{
		categories: [187, 201],
		discount: 1.6,
	},
	{
		categories: [243],
		discount: 4.7,
	},
	{
		categories: [242],
		discount: 4.1,
	},
	{
		categories: [235],
		discount: 0.75,
	},
	{
		categories: [1490],
		discount: 1.6,
	},
	{
		categories: [249],
		discount: 3.7,
	},
	{
		categories: [251],
		discount: -1.0,
	},
	{
		categories: [247],
		discount: 0.75,
	},
];

/** Get meals for a specified time periode
 *  @param start The start of the periode
 *  @param end The end of the periode
 *  @param options The cafeteria or an array of cafeterias and the format of the result
 */
async function getMeals(options?: {
	start?: Date;
	end?: Date;
	mealLocation?: MealLocation | MealLocation[];
	format: 'byMeal';
}): Promise<DetailedMealWithCanteen[]>;
async function getMeals(options?: {
	start?: Date;
	end?: Date;
	mealLocation?: MealLocation | MealLocation[];
	format: 'byLocation';
}): Promise<CanteenWithMeals[]>;
async function getMeals(
	options: { start?: Date; end?: Date; mealLocation?: MealLocation | MealLocation[]; format?: 'byMeal' | 'byLocation' } = {
		format: 'byMeal',
	},
): Promise<DetailedMeal[] | CanteenWithMeals[]> {
	const body = await getMenu();
	if (options.format === 'byLocation') {
		return extractMeals(body.content, { ...options, format: 'byLocation' });
	} else {
		return extractMeals(body.content, { ...options, format: 'byMeal' });
	}
}

/**
 * Get all additives
 */
async function getAdditives() {
	const body = await getAllAdditives();
	return extractAdditives(body.content);
}

async function getAllergens() {
	const body = await getAllAllergens();
	return extractAllergens(body.content);
}

async function getFeatures() {
	const body = await getAllFeatures();
	return extractFeatures(body.content);
}

async function getCapacityConfigurations(): Promise<CapacityConfiguration[]> {
	const body = await getCapacity();
	if (!body.success) {
		throw new Error('Failed to fetch capacity configurations');
	}

	return body.content.map(transformCapacityConfiguration);
}

async function getOutletCapacity(outletId: number): Promise<OutletCapacity> {
	const body = await getCapacityOutlet(outletId);
	if (!body.success) {
		throw new Error(`Failed to fetch outlet capacity for outlet ${outletId}`);
	}

	return transformOutletCapacity(body.content);
}

function transformCapacityConfiguration(data: CapacityConfigurationData): CapacityConfiguration {
	return {
		id: data.id,
		maxPersonsCount: data.maxSitzplaetze,
		averageDwellTimeMinutes: data.durchschnittVerweildauer,
		analysisPeriodStart: data.auswertungszeitraumVon,
		analysisPeriodEnd: data.auswertungszeitraumBis,
		comparisonWeekday: data.vergleichstag,
		intervalMinutes: data.intervall,
		averageArticleCount: data.durchschnittsArtikelAnzahl,
		calculationSchedule: data.berechnungszeitpunktAusdruck,
		lowLimitPercent: data.limitValueLowInteger,
		middleLimitPercent: data.limitValueMiddleInteger,
		highLimitPercent: data.limitValueHighInteger,
		lowColor: data.lowRGBColor,
		middleColor: data.middleRGBColor,
		highColor: data.highRGBColor,
		outletId: data.outletID,
	};
}

function transformOutletCapacity(data: CapacityOutletContent): OutletCapacity {
	return {
		configuration: data.configuration,
		currentData: transformCurrentData(data.currentData),
		historicalData: {
			comparisonDay: data.historicalData.comparisonDay,
			values: data.historicalData.values.map(transformHistoricalValue),
		},
	};
}

function transformCurrentData(data: CapacityOutletCurrentData): OutletCapacityCurrentData {
	return {
		valueRelative: data.valueRelative,
		unitValueRelative: data.unitValueRelative,
		valueAbsolute: data.valueAbsolute,
		unitValueAbsolute: data.unitValueAbsolute,
	};
}

function transformHistoricalValue(value: CapacityOutletHistoricalValue): OutletCapacityHistoricalValue {
	return {
		value: value.value,
		timestamp: value.timestamp,
	};
}

function extractFeatures(data: Gerichtsmerkmal[]) {
	return data.map(
		(feature) =>
			({
				id: feature.id,
				name: feature.name,
				shortName: feature.kuerzel,
				orderInApp: feature.reihenfolgeInApp,
				rgbColor: feature.rgbColor,
				showInOverview: feature.showInSpeiseplanOverview,
				showInFilter: !feature.showNotInFilter,
			}) satisfies Feature,
	);
}

function extractAllergens(data: _Allergen[]) {
	return data.map(
		(allergen) =>
			({
				id: allergen.id,
				name: allergen.name,
				shortName: allergen.kuerzel,
			}) satisfies Allergen,
	);
}

function extractAdditives(data: Zusatzstoff[]) {
	return data.map(
		(additive) =>
			({
				id: additive.id,
				name: additive.name,
				shortName: additive.kuerzel,
			}) satisfies Additive,
	);
}

function extractMeals(
	data: SpeiseplanLocation[],
	options: { mealLocation?: MealLocation | MealLocation[]; format: 'byMeal'; start?: Date; end?: Date },
): DetailedMeal[];
function extractMeals(
	data: SpeiseplanLocation[],
	options: { mealLocation?: MealLocation | MealLocation[]; format: 'byLocation'; start?: Date; end?: Date },
): CanteenWithMeals[];
function extractMeals(
	data: SpeiseplanLocation[],
	options: { mealLocation?: MealLocation | MealLocation[]; format?: 'byMeal' | 'byLocation'; start?: Date; end?: Date },
): DetailedMeal[] | CanteenWithMeals[] {
	// Initialize an array to hold all meals from all locations
	const allMeals: DetailedMealWithCanteen[] = [];
	const allCanteens: CanteenWithMeals[] = [];

	// Iterate through each location in the content array
	for (const location of data) {
		if (options.mealLocation instanceof MealLocation) {
			if (location.speiseplanAdvanced.titel != options.mealLocation.mealsApiKey) continue;
		} else if (options.mealLocation != undefined) {
			if (!(options.mealLocation as MealLocation[]).some((mealLocation) => mealLocation.mealsApiKey == location.speiseplanAdvanced.titel))
				continue;
		}
		const speiseplanGerichtData = location.speiseplanGerichtData;
		if (!Array.isArray(speiseplanGerichtData)) continue;

		const canteen = transformCanteen(location.speiseplanAdvanced);
		if (options.format === 'byLocation') {
			allCanteens.push({ ...canteen, meals: [] });
		}

		for (const meal of speiseplanGerichtData) {
			const mealDate = new Date(meal.speiseplanAdvancedGericht.datum);
			if (options.start && mealDate < options.start) continue;
			if (options.end && mealDate > options.end) continue;

			if (options.format === 'byLocation') {
				allCanteens[allCanteens.length - 1].meals.push(transformMeal(meal));
			} else {
				allMeals.push(transformMeal(meal, location.speiseplanAdvanced));
			}
		}
	}

	if (options.format === 'byLocation') {
		return allCanteens;
	} else {
		return allMeals;
	}
}

function transformCanteen(canteenInfo: SpeiseplanAdvanced): Canteen {
	return {
		id: canteenInfo.id,
		name: canteenInfo.titel,
		hash: hashing.cyrb53(canteenInfo.titel.toLowerCase()).toString(),
		displayName: canteenInfo.anzeigename,
		validFrom: canteenInfo.gueltigVon,
		validTo: canteenInfo.gueltigBis,
		orderInApp: canteenInfo.reihenfolgeInApp,
		outletId: canteenInfo.outletID,
		isActive: canteenInfo.aktiv,
		locationInfo: canteenInfo.locationInfo,
		orderInfo: canteenInfo.orderInfo,
	};
}

function transformMeal(mealData: SpeiseplanGerichtData): DetailedMeal;
function transformMeal(mealData: SpeiseplanGerichtData, canteenInfo: SpeiseplanAdvanced): DetailedMealWithCanteen;
function transformMeal(mealData: SpeiseplanGerichtData, canteenInfo?: SpeiseplanAdvanced): DetailedMeal | DetailedMealWithCanteen {
	const { speiseplanAdvancedGericht, zusatzinformationen } = mealData;

	return {
		id: speiseplanAdvancedGericht.id,
		plu: zusatzinformationen?.plu ?? null,
		title: speiseplanAdvancedGericht.gerichtname,
		hash: hashing.cyrb53(speiseplanAdvancedGericht.gerichtname.toLowerCase()).toString(),
		alternativeTitle: zusatzinformationen?.gerichtnameAlternative ?? null,
		categoryId: speiseplanAdvancedGericht.gerichtkategorieID,
		imageUrl: zusatzinformationen?.gerichtImage ?? null,
		price: zusatzinformationen?.mitarbeiterpreisDecimal2 ?? null,
		studentPrice: getStudentPrice(mealData) ?? null,
		guestPrice: zusatzinformationen?.gaestepreisDecimal2 ?? null,
		isActive: speiseplanAdvancedGericht.aktiv,
		date: speiseplanAdvancedGericht.datum,
		nutritionalInfo: zusatzinformationen ? extractNutritionalInfo(zusatzinformationen) : null,
		allergens: mealData.allergeneIds ? mealData.allergeneIds.split(',').map((id) => parseInt(id)) : [],
		additives: mealData.zusatzstoffeIds ? mealData.zusatzstoffeIds.split(',').map((id) => parseInt(id)) : [],
		features: mealData.gerichtmerkmaleIds ? mealData.gerichtmerkmaleIds.split(',').map((id) => parseInt(id)) : [],
		sustainability: zusatzinformationen
			? {
					co2: zusatzinformationen.sustainability?.co2?.co2Value ?? null,
				}
			: null,
		...(canteenInfo ? { canteen: transformCanteen(canteenInfo) } : {}),
	};
}

function extractNutritionalInfo(zusatzinformationen: Zusatzinformationen) {
	return {
		kj: zusatzinformationen.nwkjInteger,
		kcal: zusatzinformationen.nwkcalInteger,
		fat: zusatzinformationen.nwfettDecimal1,
		saturatedFat: zusatzinformationen.nwfettsaeurenDecimal1,
		carbohydrates: zusatzinformationen.nwkohlehydrateDecimal1,
		sugar: zusatzinformationen.nwzuckerDecimal1,
		protein: zusatzinformationen.nweiweissDecimal1,
		salt: zusatzinformationen.nwsalzDecimal1,
	};
}

function getStudentPrice(mealData: SpeiseplanGerichtData) {
	if (!mealData.zusatzinformationen) return;

	const discount = STUDENT_DISCOUNT_INDEX.find((index) => index.categories.includes(mealData.speiseplanAdvancedGericht.gerichtkategorieID));
	if (!discount) return null;

	if (discount.discount > 0) return discount.discount;
	else if (discount.discount < 0) return mealData.zusatzinformationen.mitarbeiterpreisDecimal2 + discount.discount;

	return null;
}

interface Additive {
	id: number;
	name: string;
	shortName: string | null;
}

interface Allergen {
	id: number;
	name: string;
	shortName: string | null;
}

interface Feature {
	id: number;
	name: string;
	shortName: string | null;
	orderInApp: number;
	rgbColor: string | null;
	showInOverview: boolean;
	showInFilter: boolean;
}

interface DetailedMeal {
	id: number;
	plu: string | null;
	title: string;
	hash: string;
	alternativeTitle: string | null;
	categoryId: number;
	imageUrl: string | null;
	price: number | null;
	studentPrice: number | null;
	guestPrice: number | null;
	isActive: boolean;
	date: string;
	nutritionalInfo: NutritionalInfo | null;
	allergens: number[];
	additives: number[];
	features: number[];
	sustainability: Sustainability | null;
}

type DetailedMealWithCanteen = DetailedMeal & { canteen: Canteen };

interface Sustainability {
	co2: number | null;
}

interface Canteen {
	id: number;
	name: string;
	hash: string;
	displayName: string;
	validFrom: string;
	validTo: string;
	orderInApp: number;
	outletId: number;
	isActive: boolean;
	locationInfo: LocationInfo;
	orderInfo: OrderInfo;
}

type CanteenWithMeals = Canteen & { meals: DetailedMeal[] };

interface OrderInfo {
	orderAllowed: boolean;
	preOrderAllowed: boolean;
	instantOrderAllowed: boolean;
	shippingAllowed: boolean;
	deliveryAssortment: boolean;
	instantOrderMinimumOrderValue: number | null;
	preOrderMinimumOrderValue: number | null;
	shippingOrderMinimumOrderValue: number | null;
	shippingCostFlatrate: number | null;
	shippingCostThreshold: number | null;
	postalCodeVerification: boolean;
	reusableProvider: boolean;
	reusableProviderId: number | null;
	allowedOrderProcesses: unknown[];
	scan2go: boolean;
}

interface LocationInfo {
	id: number;
	name: string;
}

interface NutritionalInfo {
	kj: number;
	kcal: number;
	fat: number;
	saturatedFat: number;
	carbohydrates: number;
	sugar: number;
	protein: number;
	salt: number;
}

interface CapacityConfiguration {
	id: number;
	maxPersonsCount: number;
	averageDwellTimeMinutes: number;
	analysisPeriodStart: string;
	analysisPeriodEnd: string;
	comparisonWeekday: number;
	intervalMinutes: number;
	averageArticleCount: number;
	calculationSchedule: string;
	lowLimitPercent: number;
	middleLimitPercent: number;
	highLimitPercent: number;
	lowColor: string | null;
	middleColor: string | null;
	highColor: string | null;
	outletId: number;
}

interface OutletCapacityCurrentData {
	valueRelative: number;
	unitValueRelative: string;
	valueAbsolute: number;
	unitValueAbsolute: string;
}

interface OutletCapacityHistoricalValue {
	value: number;
	timestamp: string;
}

interface OutletCapacity {
	configuration: CapacityOutletContent['configuration'];
	currentData: OutletCapacityCurrentData;
	historicalData: {
		comparisonDay: string;
		values: OutletCapacityHistoricalValue[];
	};
}

/** The cafeteria a meal is located in */
export class MealLocation {
	readonly name: string;
	readonly mealsApiKey: string;
	private constructor(name: string, mealsApiKey: string) {
		this.name = name;
		this.mealsApiKey = mealsApiKey;
	}

	static Elbe = new MealLocation('Elbe', 'Elbe');
	static Steelrunner = new MealLocation('Steelrunner', 'Steelrunner');
	static Bonprix = new MealLocation('Bonprix', 'bonprix');
	static Boulevard = new MealLocation('Boulevard', 'Bistro Boulevard Mittag');
}

const MealsAPI = {
	getMeals,
	hashString: hashing.cyrb53,
	getAdditives,
	getAllergens,
	getFeatures,
	getCapacityConfigurations,
	getOutletCapacity,
};
export default MealsAPI;
export type {
	Additive,
	Allergen,
	Canteen,
	CanteenWithMeals,
	DetailedMeal,
	DetailedMealWithCanteen,
	Feature,
	LocationInfo,
	NutritionalInfo,
	CapacityConfiguration,
	OutletCapacity,
	OutletCapacityCurrentData,
	OutletCapacityHistoricalValue,
	OrderInfo,
	Sustainability,
};
