import { KOCHWERK_MAIN_JS, KOCHWERK_MEALS_ENDPOINT, KOCHWERK_TOKEN_REGEX, STUDENT_DISCOUNT_INDEX } from './constants';
import { ResponseData, SpeiseplanAdvanced, SpeiseplanGerichtData, SpeiseplanLocation, Zusatzinformationen } from './speiseplan';
import hashing from './utils/hashing';

async function getKochwerkToken() {
	const req = await fetch(KOCHWERK_MAIN_JS);
	const body = await req.text();
	const match = body.match(KOCHWERK_TOKEN_REGEX);
	if (match == null) return null;
	return match[1];
}

/** Get meals for a specified time periode
 *  @param start The start of the periode
 *  @param end The end of the periode
 *  @param mealLocation The cafeteria or an array of cafeterias
 */
async function getMeals(start: Date, end: Date, mealLocation?: MealLocation | MealLocation[] | undefined) {
	const token = await getKochwerkToken();
	if (token == null) throw new Error('Could not fetch token');

	const req = await fetch(KOCHWERK_MEALS_ENDPOINT + '&token=' + token, { headers: { Referer: 'test' } });
	const body = (await req.json()) as ResponseData;
	const meals = extractMeals(body.content, mealLocation, start, end);
	return meals;
}

function extractMeals(data: SpeiseplanLocation[], mealLocation: MealLocation | MealLocation[] | undefined, start: Date, end: Date) {
	// Initialize an array to hold all meals from all locations
	const allMeals: DetailedMeal[] = [];

	// Iterate through each location in the content array
	for (const location of data) {
		if (mealLocation instanceof MealLocation) {
			if (location.speiseplanAdvanced.titel != mealLocation.mealsApiKey) continue;
		} else if (mealLocation != undefined) {
			if (!(mealLocation as MealLocation[]).some((mealLocation) => mealLocation.mealsApiKey == location.speiseplanAdvanced.titel)) continue;
		}
		const speiseplanGerichtData = location.speiseplanGerichtData;
		if (!Array.isArray(speiseplanGerichtData)) continue;
		for (const meal of speiseplanGerichtData) {
			const mealDate = new Date(meal.speiseplanAdvancedGericht.datum);
			if (mealDate.getFullYear() < start.getFullYear() || mealDate.getFullYear() > end.getFullYear()) continue;
			if (mealDate.getMonth() < start.getMonth() || mealDate.getMonth() > end.getMonth()) continue;
			if (mealDate.getDate() < start.getDate() || mealDate.getDate() > end.getDate()) continue;
			allMeals.push(transformMeal(meal, location.speiseplanAdvanced));
		}
	}

	return allMeals;
}

function transformMeal(mealData: SpeiseplanGerichtData, canteenInfo: SpeiseplanAdvanced): DetailedMeal {
	const { speiseplanAdvancedGericht, zusatzinformationen } = mealData;

	return {
		id: speiseplanAdvancedGericht.id,
		plu: zusatzinformationen.plu,
		title: speiseplanAdvancedGericht.gerichtname,
		hash: hashing.cyrb53(speiseplanAdvancedGericht.gerichtname),
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
		canteen: {
			id: canteenInfo.id,
			name: canteenInfo.titel,
			hash: hashing.cyrb53(canteenInfo.titel),
			displayName: canteenInfo.anzeigename,
			validFrom: canteenInfo.gueltigVon,
			validTo: canteenInfo.gueltigBis,
			orderInApp: canteenInfo.reihenfolgeInApp,
			outletId: canteenInfo.outletID,
			locationInfo: canteenInfo.locationInfo,
			orderInfo: canteenInfo.orderInfo,
		},
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
	hash: number;
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
	sustainability: {
		co2: number | null;
	};
	canteen: {
		id: number;
		name: string;
		hash: number;
		displayName: string;
		validFrom: string;
		validTo: string;
		orderInApp: number;
		outletId: number;
		locationInfo: {
			id: number;
			name: string;
		};
		orderInfo: {
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
		};
	};
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
export type { DetailedMeal, NutritionalInfo };
