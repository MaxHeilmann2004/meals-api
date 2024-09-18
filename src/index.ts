import { Meal, ResponseData, SpeiseplanGerichtData, SpeiseplanLocation } from "./speiseplan";
import hashing from "./utils/hashing";

const KOCHWERK_MAIN_JS = "https://kochwerk-web.webspeiseplan.de/main.bf4740fd495508f750f5.js";
const KOCHWERK_TOKEN_REGEX = /PROXY_TOKEN:"([A-Za-z0-9]+)"/;
const KOCHWERK_MEALS_ENDPOINT = "https://kochwerk-web.webspeiseplan.de/index.php?model=menu&location=1800&languagetype=1&_=1691667030626";

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
async function getMeals(start: Date, end: Date, mealLocation: MealLocation | MealLocation[]) {
    const token = await getKochwerkToken();
    if (token == null) throw new Error("Could not fetch token");

    const req = await fetch(KOCHWERK_MEALS_ENDPOINT + "&token=" + token, { headers: { Referer: "test" } });
    const body = (await req.json()) as ResponseData;
    const meals = extractMeals(body.content, mealLocation, start, end);
    return meals;
}

function extractMeals(data: SpeiseplanLocation[], mealLocation: MealLocation | MealLocation[], start: Date, end: Date) {
    // Initialize an array to hold all meals from all locations
    const allMeals: Meal[] = [];

    // Iterate through each location in the content array
    for (const location of data) {
        if (mealLocation instanceof MealLocation) {
            if (location.speiseplanAdvanced.titel != mealLocation.mealsApiKey) continue;
        } else {
            if (!(mealLocation as MealLocation[]).some((mealLocation) => mealLocation.mealsApiKey == location.speiseplanAdvanced.titel)) continue;
        }
        const speiseplanGerichtData = location.speiseplanGerichtData;
        for (const meal of speiseplanGerichtData) {
            const mealDate = new Date(meal.speiseplanAdvancedGericht.datum);
            if (mealDate.getFullYear() < start.getFullYear() || mealDate.getFullYear() > end.getFullYear()) continue;
            if (mealDate.getMonth() < start.getMonth() || mealDate.getMonth() > end.getMonth()) continue;
            if (mealDate.getDate() < start.getDate() || mealDate.getDate() > end.getDate()) continue;
            allMeals.push(transformMeal(meal));
        }
    }

    return allMeals;
}

function transformMeal(meal: SpeiseplanGerichtData): Meal {
    return {
        id: meal.speiseplanAdvancedGericht.id,
        hash: hashing.cyrb53(meal.speiseplanAdvancedGericht.gerichtname),
        title: meal.speiseplanAdvancedGericht.gerichtname,
        categoryId: meal.speiseplanAdvancedGericht.gerichtkategorieID,
        imageUrl: meal.zusatzinformationen.gerichtImage,
        price: meal.zusatzinformationen.mitarbeiterpreisDecimal2,
        isVegan: meal.speiseplanAdvancedGericht.gerichtname.toLowerCase().includes("vegan"), // TODO: find a better way to determine if a meal is vegan
        studentPrice: meal.zusatzinformationen.mitarbeiterpreisDecimal2, // TODO: this is not correct, it should be the student price
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

    static Elbe = new MealLocation("Elbe", "Elbe");
    static Steelrunner = new MealLocation("Steelrunner", "Steelrunner");
    static Bonprix = new MealLocation("Bonprix", "bonprix");
    static Boulevard = new MealLocation("Boulevard", "Bistro Boulevard Mittag");
}

const MealsAPI = { getMeals };
export default MealsAPI;
export type { Meal };
