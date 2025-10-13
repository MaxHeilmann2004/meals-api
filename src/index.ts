import { getMenu, SpeiseplanAdvanced, SpeiseplanGerichtData, SpeiseplanLocation, Zusatzinformationen } from './speiseplan';
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
async function getMeals(
	start: Date,
	end: Date,
	options: { mealLocation?: MealLocation | MealLocation[]; format: 'byMeal' }
): Promise<DetailedMealWithCanteen[]>;
async function getMeals(
	start: Date,
	end: Date,
	options: { mealLocation?: MealLocation | MealLocation[]; format: 'byLocation' }
): Promise<CanteenWithMeals[]>;
async function getMeals(
	start: Date,
	end: Date,
	options: { mealLocation?: MealLocation | MealLocation[]; format: 'byMeal' | 'byLocation' } = { format: 'byMeal' }
): Promise<DetailedMeal[] | CanteenWithMeals[]> {
	const body = await getMenu();
	if (options.format === 'byLocation') {
		return extractMeals(body.content, { ...options, format: 'byLocation', start, end });
	} else {
		return extractMeals(body.content, { ...options, format: 'byMeal', start, end });
	}
}

function extractMeals(
	data: SpeiseplanLocation[],
	options: { mealLocation?: MealLocation | MealLocation[]; format: 'byMeal'; start: Date; end: Date }
): DetailedMeal[];
function extractMeals(
	data: SpeiseplanLocation[],
	options: { mealLocation?: MealLocation | MealLocation[]; format: 'byLocation'; start: Date; end: Date }
): CanteenWithMeals[];
function extractMeals(
	data: SpeiseplanLocation[],
	options: { mealLocation?: MealLocation | MealLocation[]; format?: 'byMeal' | 'byLocation'; start: Date; end: Date }
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
			if (mealDate.getFullYear() < options.start.getFullYear() || mealDate.getFullYear() > options.end.getFullYear()) continue;
			if (mealDate.getMonth() < options.start.getMonth() || mealDate.getMonth() > options.end.getMonth()) continue;
			if (mealDate.getDate() < options.start.getDate() || mealDate.getDate() > options.end.getDate()) continue;

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
		plu: zusatzinformationen.plu,
		title: speiseplanAdvancedGericht.gerichtname,
		hash: hashing.cyrb53(speiseplanAdvancedGericht.gerichtname.toLowerCase()).toString(),
		alternativeTitle: zusatzinformationen.gerichtnameAlternative,
		categoryId: speiseplanAdvancedGericht.gerichtkategorieID,
		imageUrl: zusatzinformationen.gerichtImage,
		price: zusatzinformationen.mitarbeiterpreisDecimal2,
		studentPrice: getStudentPrice(mealData),
		guestPrice: zusatzinformationen.gaestepreisDecimal2,
		date: speiseplanAdvancedGericht.datum,
		nutritionalInfo: extractNutritionalInfo(zusatzinformationen),
		allergens: mealData.allergeneIds ? mealData.allergeneIds.split(',').map((id) => parseInt(id)) : [],
		additives: mealData.zusatzstoffeIds ? mealData.zusatzstoffeIds.split(',').map((id) => parseInt(id)) : [],
		features: mealData.gerichtmerkmaleIds ? mealData.gerichtmerkmaleIds.split(',').map((id) => parseInt(id)) : [],
		sustainability: {
			co2: zusatzinformationen.sustainability?.co2?.co2Value ?? null,
		},
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
	const discount = STUDENT_DISCOUNT_INDEX.find((index) => index.categories.includes(mealData.speiseplanAdvancedGericht.gerichtkategorieID));
	if (!discount) return null;

	if (discount.discount > 0) return discount.discount;
	else if (discount.discount < 0) return mealData.zusatzinformationen.mitarbeiterpreisDecimal2 + discount.discount;

	return null;
}

interface DetailedMeal {
	id: number;
	plu?: string | null;
	title: string;
	hash: string;
	alternativeTitle: string;
	categoryId: number;
	imageUrl: string;
	price: number;
	studentPrice: number | null;
	guestPrice: number | null;
	date: string;
	nutritionalInfo: NutritionalInfo;
	allergens: number[];
	additives: number[];
	features: number[];
	sustainability: Sustainability;
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

const MealsAPI = { getMeals };
export default MealsAPI;
export type { Canteen, CanteenWithMeals, DetailedMeal, DetailedMealWithCanteen, LocationInfo, NutritionalInfo, OrderInfo, Sustainability };
