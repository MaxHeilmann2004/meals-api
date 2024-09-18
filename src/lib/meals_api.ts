import {
    ResponseData,
    SpeiseplanAdvanced,
    SpeiseplanGerichtData,
    SpeiseplanLocation,
    Sustainability,
    Zusatzinformationen
} from "@/types/speiseplan";

const KOCHWERK_MEALS_ENDPOINT = "https://kochwerk-web.webspeiseplan.de/index.php?model=menu&location=1800&languagetype=1&_=1691667030626";

export async function getAllDetailedMeals(): Promise<DetailedMeal[]> {
    const token = await getKochwerkToken();
    if (!token) throw new Error("Could not fetch token");

    const response = await fetch(`${KOCHWERK_MEALS_ENDPOINT}&token=${token}`, { 
        headers: { Referer: "test" } 
    });
    const data = await response.json() as ResponseData;

    if (!data.success) {
        console.error("API request was not successful");
    }

    return transformData(data.content);
}

async function getKochwerkToken(): Promise<string | null> {
    const KOCHWERK_MAIN_JS = "https://kochwerk-web.webspeiseplan.de/main.bf4740fd495508f750f5.js";
    const KOCHWERK_TOKEN_REGEX = /PROXY_TOKEN:"([A-Za-z0-9]+)"/;

    try {
        const response = await fetch(KOCHWERK_MAIN_JS);
        const body = await response.text();
        const match = body.match(KOCHWERK_TOKEN_REGEX);
        return match ? match[1] : null;
    } catch (error) {
        console.error("Error fetching Kochwerk token:", error);
        return null;
    }
}

function transformData(locations: SpeiseplanLocation[]): DetailedMeal[] {
    return locations.flatMap(location => 
        location.speiseplanGerichtData.map(meal => transformMeal(meal, location.speiseplanAdvanced))
    );
}

function getReducedPrice(preis: Float32Array, ) {
    return 
}

function transformMeal(mealData: SpeiseplanGerichtData, canteenInfo: SpeiseplanAdvanced): DetailedMeal {
    const { speiseplanAdvancedGericht, zusatzinformationen } = mealData;
    
    return {
        id: speiseplanAdvancedGericht.id,
        title: speiseplanAdvancedGericht.gerichtname,
        alternativeTitle: zusatzinformationen.gerichtnameAlternative,
        categoryId: speiseplanAdvancedGericht.gerichtkategorieID,
        categoryStringified: (id => (id >= 238 && id <= 241) ? "Daily Greens" : ({
            201: "The Original",
            233: "Original Soup",
            1483: "F&T Vegan",
            1485: "F&T Topping 1",
            1486: "F&T Topping 2",
            234: "Grill",
            243: "Pizza Station",
            242: "Pasta Station",
            235: "Salatbar",
            244: "Backwaren"
        }[id] || "Unknown Category"))(speiseplanAdvancedGericht.gerichtkategorieID),
        imageUrl: zusatzinformationen.gerichtImage,
        price: zusatzinformationen.mitarbeiterpreisDecimal2,
        guestPrice: zusatzinformationen.gaestepreisDecimal2,
        date: speiseplanAdvancedGericht.datum,
        nutritionalInfo: extractNutritionalInfo(zusatzinformationen),
        allergens: mealData.allergeneIds ? mealData.allergeneIds.split(',') : [],
        additives: mealData.zusatzstoffeIds ? mealData.zusatzstoffeIds.split(',') : [],
        features: mealData.gerichtmerkmaleIds ? mealData.gerichtmerkmaleIds.split(',') : [],
        sustainability: zusatzinformationen.sustainability,
        canteen: {
            id: canteenInfo.id,
            name: canteenInfo.titel,
            displayName: canteenInfo.anzeigename,
            validFrom: canteenInfo.gueltigVon,
            validTo: canteenInfo.gueltigBis,
            orderInApp: canteenInfo.reihenfolgeInApp,
            outletId: canteenInfo.outletID,
            locationInfo: canteenInfo.locationInfo,
            orderInfo: canteenInfo.orderInfo
        }
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
        salt: zusatzinformationen.nwsalzDecimal1
    };
}

export interface DetailedMeal {
    id: number;
    title: string;
    alternativeTitle: string;
    categoryId: number;
    imageUrl: string;
    price: number;
    guestPrice: number | null;
    date: string;
    nutritionalInfo: {
        kj: number;
        kcal: number;
        fat: number;
        saturatedFat: number;
        carbohydrates: number;
        sugar: number;
        protein: number;
        salt: number;
    };
    allergens: string[];
    additives: string[];
    features: string[];
    sustainability: Sustainability;
    canteen: {
        id: number;
        name: string;
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